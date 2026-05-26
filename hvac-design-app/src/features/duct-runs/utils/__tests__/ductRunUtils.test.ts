import { describe, expect, it } from 'vitest';
import { recomputeDuctRunSegments } from '../recomputeDuctRunSegments';
import { getActiveSectionLength } from '../getActiveSectionLength';
import { summarizeDuctRunQuantity } from '../summarizeDuctRunQuantity';
import { convertDuctToDuctRun } from '../convertDuctToDuctRun';
import { DEFAULT_FABRICATION_PROFILE } from '@/core/schema/fabrication-profile.schema';
import { createDuctRun } from '../../entities/ductRunDefaults';
import type { Duct, DuctRun } from '@/core/schema';

describe('duct run utilities', () => {
  it('recomputes 50 ft at 5 ft as 10 full sections', () => {
    const segments = recomputeDuctRunSegments(50, 5);

    expect(segments).toHaveLength(10);
    expect(segments.every((segment) => !segment.isPartial && segment.length === 5)).toBe(true);
  });

  it('recomputes 63 ft at 5 ft as 12 full and 1 partial section', () => {
    const segments = recomputeDuctRunSegments(63, 5);

    expect(segments).toHaveLength(13);
    expect(segments.filter((segment) => segment.isPartial)).toHaveLength(1);
    expect(segments[12]).toMatchObject({ index: 12, startStation: 60, endStation: 63, length: 3, isPartial: true });
  });

  it('uses run override before profile defaults', () => {
    const run = {
      props: {
        shape: 'round',
        family: 'standard_duct',
        sectionLengthOverride: 8,
      },
    } as DuctRun;

    expect(getActiveSectionLength(run, DEFAULT_FABRICATION_PROFILE)).toBe(8);
  });

  it('defaults flexible-shape duct runs to flexible construction', () => {
    const run = createDuctRun({
      shape: 'flexible',
      start: { x: 0, y: 0 },
      end: { x: 120, y: 0 },
    });

    expect(run.props.shape).toBe('flexible');
    expect(run.props.constructionType).toBe('flexible');
  });

  it('summarizes quantity directly from segment records', () => {
    const run = {
      id: 'run-1',
      props: {
        name: 'Run A',
        shape: 'rectangular',
        family: 'standard_duct',
        width: 24,
        height: 12,
        installLength: 63,
        segments: recomputeDuctRunSegments(63, 5),
      },
    } as DuctRun;

    expect(summarizeDuctRunQuantity(run)).toMatchObject({
      runId: 'run-1',
      totalPieces: 13,
      segmentSpanCount: 13,
      internalBreakLineCount: 12,
      terminalEndMarkerCount: 2,
      fullPieceCount: 12,
      partialPieceCount: 1,
      partialLengths: [3],
      sizeLabel: '24"x12"',
      odSizeLabel: '24"x12"',
    });
  });

  it('converts legacy ducts to duct runs with generated segments', () => {
    const duct = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'duct',
      transform: { x: 10, y: 20, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 5,
      createdAt: '2026-01-01T00:00:00.000Z',
      modifiedAt: '2026-01-01T00:00:00.000Z',
      props: {
        name: 'Legacy Duct',
        engineeringSystem: 'standard_duct',
        shape: 'round',
        diameter: 12,
        length: 12,
        material: 'galvanized',
        airflow: 0,
        staticPressure: 0.1,
      },
      calculated: { area: 0, velocity: 0, frictionLoss: 0 },
    } as Duct;

    const converted = convertDuctToDuctRun(duct, DEFAULT_FABRICATION_PROFILE);

    expect(converted.type).toBe('duct_run');
    expect(converted.props.installLength).toBe(12);
    expect(converted.props.end).toEqual({ x: 154, y: 20 });
    expect(converted.props.segments).toHaveLength(3);
    expect(converted.props.segments[2]?.length).toBe(2);
  });
});
