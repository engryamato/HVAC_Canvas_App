import { describe, expect, it } from 'vitest';
import { createDuctRun } from '../../entities/ductRunDefaults';
import { DuctRunGeometryService } from '../DuctRunGeometryService';

describe('DuctRunGeometryService', () => {
  it('builds segment geometry for hit testing', () => {
    const run = createDuctRun({ x: 100, y: 100, installLength: 10, sectionLengthOverride: 5 });
    run.props.segments = [
      { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
      { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
    ];

    const geometry = DuctRunGeometryService.getGeometry(run);

    expect(geometry.segmentGeometries).toHaveLength(2);
    expect(DuctRunGeometryService.getSegmentIndexAtPoint(run, { x: 120, y: 100 })).toBe(0);
    expect(DuctRunGeometryService.getSegmentIndexAtPoint(run, { x: 190, y: 100 })).toBe(1);
  });
});
