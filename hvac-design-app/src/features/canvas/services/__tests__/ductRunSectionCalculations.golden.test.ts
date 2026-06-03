import { describe, expect, it } from 'vitest';
import type { DuctRun } from '@/core/schema';
import { calculateDuctRunSections } from '../ductRunSectionCalculations';
import { sourceNotes } from '@/core/services/calculations/__tests__/goldenFixtures';

describe('WS9 golden ductRunSectionCalculations', () => {
  it('reports eight 5 ft fabrication sections and stations for a 40 ft run', () => {
    expect(sourceNotes.sections).toContain('40 ft');
    const run: DuctRun = {
      id: '550e8400-e29b-41d4-a716-446655449000',
      type: 'duct_run',
      transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      modifiedAt: '2026-01-01T00:00:00.000Z',
      props: {
        name: 'WS9 40 ft run',
        engineeringSystem: 'standard_duct',
        shape: 'rectangular',
        width: 24,
        height: 12,
        material: 'galvanized',
        airflow: 1000,
        staticPressure: 1,
        installLength: 40,
        sectionLengthOverride: 5,
        segments: Array.from({ length: 8 }, (_, index) => ({
          index,
          startStation: index * 5,
          endStation: (index + 1) * 5,
          length: 5,
          isPartial: false,
        })),
      },
      calculated: {
        area: 288,
        velocity: 500,
        frictionLoss: 0.1,
        cumulativePressureDrop: 0,
        availableStaticPressure: 1,
      },
    };

    const sections = calculateDuctRunSections(run);

    expect(sections).toHaveLength(8);
    expect(sections.map((section) => [section.startStation, section.endStation])).toEqual([
      [0, 5],
      [5, 10],
      [10, 15],
      [15, 20],
      [20, 25],
      [25, 30],
      [30, 35],
      [35, 40],
    ]);
    expect(sections[7]).toMatchObject({
      sectionNumber: 8,
      length: 5,
      pressureLoss: 0.01,
      cumulativePressureDrop: 0.04,
      availableStaticPressure: 0.96,
    });
  });
});
