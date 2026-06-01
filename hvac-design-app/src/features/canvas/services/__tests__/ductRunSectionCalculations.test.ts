import { describe, expect, it } from 'vitest';
import type { DuctRun } from '@/core/schema';
import type { SelectedSegment } from '../../store/selectionStore';
import {
  calculateDuctRunSections,
  calculateSelectedDuctRunBranch,
  calculateSelectedDuctRunSegments,
} from '../ductRunSectionCalculations';

const now = '2026-01-01T00:00:00.000Z';

function createRun(overrides: Partial<DuctRun['props']> = {}): DuctRun {
  return {
    id: '550e8400-e29b-41d4-a716-446655443000',
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Supply Main',
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 12,
      height: 12,
      material: 'galvanized',
      airflow: 850,
      staticPressure: 0.1,
      installLength: 10,
      segments: [
        { index: 0, startStation: 0, endStation: 4, length: 4, isPartial: false },
        { index: 1, startStation: 4, endStation: 8, length: 4, isPartial: false },
        { index: 2, startStation: 8, endStation: 10, length: 2, isPartial: true },
      ],
      ...overrides,
    } as DuctRun['props'],
    calculated: {
      area: 144,
      velocity: 850,
      frictionLoss: 2.5,
      cumulativePressureDrop: 0.25,
      availableStaticPressure: 1.75,
    },
  };
}

describe('ductRunSectionCalculations', () => {
  it('returns first-class section results for every persisted segment', () => {
    const sections = calculateDuctRunSections(createRun());

    expect(sections).toHaveLength(3);
    expect(sections[0]).toMatchObject({
      segmentIndex: 0,
      sectionNumber: 1,
      isPartial: false,
      startStation: 0,
      endStation: 4,
      length: 4,
      airflow: 850,
      area: 144,
      velocity: 850,
      frictionRate: 2.5,
      pressureLoss: 0.1,
      cumulativePressureDrop: 0.1,
      availableStaticPressure: 1.9,
    });
    expect(sections[2]).toMatchObject({
      segmentIndex: 2,
      sectionNumber: 3,
      isPartial: true,
      length: 2,
    });
  });

  it('summarizes selected sections and ignores selections for other runs', () => {
    const run = createRun();
    const selectedSegments: SelectedSegment[] = [
      { runId: run.id, segmentIndex: 0 },
      { runId: '550e8400-e29b-41d4-a716-446655443999', segmentIndex: 1 },
      { runId: run.id, segmentIndex: 2 },
    ];

    const selected = calculateSelectedDuctRunSegments(run, selectedSegments);

    expect(selected).toMatchObject({
      title: 'Selected Sections',
      selectedLength: 6,
      stationStart: 0,
      stationEnd: 10,
      aggregatePressureLoss: 0.15,
    });
    expect(selected?.sections.map((section) => section.sectionNumber)).toEqual([1, 3]);
  });

  it('calculates selected section pressure loss from aggregate selected length before rounding', () => {
    const run = createRun({
      segments: [
        { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
        { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
      ],
    });

    const selected = calculateSelectedDuctRunSegments(run, [
      { runId: run.id, segmentIndex: 0 },
      { runId: run.id, segmentIndex: 1 },
    ]);

    expect(selected).toMatchObject({
      selectedLength: 10,
      aggregatePressureLoss: 0.25,
    });
  });

  it('uses computed engineering airflow for selected section values when persisted airflow is zero', () => {
    const run = createRun({
      airflow: 0,
      engineeringData: {
        airflow: 950,
        velocity: 0,
        pressureDrop: 2.5,
        friction: 2.5,
        systemType: 'supply',
      },
    });
    run.calculated = {
      ...run.calculated,
      velocity: 0,
    };

    const selected = calculateSelectedDuctRunSegments(run, [{ runId: run.id, segmentIndex: 0 }]);

    expect(selected?.sections[0]).toMatchObject({
      airflow: 950,
      velocity: 950,
    });
  });

  it('summarizes selected duct runs as a first-class branch calculation', () => {
    const trunk = createRun({
      installLength: 10,
      airflow: 1200,
      segments: [
        { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
        { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
      ],
    });
    const branch = createRun({
      installLength: 6,
      airflow: 400,
      segments: [{ index: 0, startStation: 0, endStation: 6, length: 6, isPartial: false }],
    });
    branch.id = '550e8400-e29b-41d4-a716-446655443001';
    branch.calculated = {
      area: 144,
      velocity: 400,
      frictionLoss: 1.5,
      cumulativePressureDrop: 0.09,
      availableStaticPressure: 1.91,
    };

    const selected = calculateSelectedDuctRunBranch([trunk, branch]);

    expect(selected).toMatchObject({
      title: 'Selected Branch',
      runs: [
        { runId: trunk.id, length: 10, airflow: 1200, pressureLoss: 0.25 },
        { runId: branch.id, length: 6, airflow: 400, pressureLoss: 0.09 },
      ],
      selectedLength: 16,
      aggregatePressureLoss: 0.34,
      maxAirflow: 1200,
      terminalAvailableStaticPressure: 1.91,
    });
  });
});
