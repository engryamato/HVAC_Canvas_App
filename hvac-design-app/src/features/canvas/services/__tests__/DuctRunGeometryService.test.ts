import { describe, expect, it } from 'vitest';
import { createDuctRun } from '../../entities/ductRunDefaults';
import { DuctRunGeometryService } from '../DuctRunGeometryService';

describe('DuctRunGeometryService', () => {
  it('exposes cached centerline, walls, planes, and hit helpers', () => {
    const run = createDuctRun({ x: 100, y: 100, installLength: 10, sectionLengthOverride: 5 });

    const geometry = DuctRunGeometryService.getGeometry(run);

    expect(geometry.centerline.start).toEqual({ x: 100, y: 100 });
    expect(geometry.centerline.end).toEqual({ x: 220, y: 100 });
    expect(geometry.centerline.midpoint).toEqual(geometry.labelAnchor);
    expect(geometry.walls).toHaveLength(2);
    expect(geometry.segmentPlanes).toHaveLength(run.props.segments.length);
    expect(geometry.segmentPlanes[0]?.polygon).toHaveLength(4);
    expect(DuctRunGeometryService.hitTestRun(run, { x: 160, y: 100 })).toBe(true);
    expect(DuctRunGeometryService.hitTestRun(run, { x: 160, y: 120 })).toBe(false);
  });

  it('builds segment geometry for hit testing', () => {
    const run = createDuctRun({ x: 100, y: 100, installLength: 10, sectionLengthOverride: 5 });
    run.props.segments = [
      { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
      { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
    ];

    const geometry = DuctRunGeometryService.getGeometry(run);

    expect(geometry.segmentGeometries).toHaveLength(2);
    expect(DuctRunGeometryService.hitTestSegment(run, { x: 120, y: 100 })?.segment.index).toBe(0);
    expect(DuctRunGeometryService.getSegmentIndexAtPoint(run, { x: 120, y: 100 })).toBe(0);
    expect(DuctRunGeometryService.getSegmentIndexAtPoint(run, { x: 190, y: 100 })).toBe(1);
  });
});
