import { describe, expect, it } from 'vitest';
import type { Duct, DuctRun } from '@/core/schema';
import { feetToPixels, pixelsToFeet } from '@/core/constants/coordinates';
import {
  applyDuctEndpointCutback,
  getDuctCenterline,
  getDuctEndpoints,
  restoreDuctToDesign,
} from '../ductCutbackService';

const now = '2026-01-01T00:00:00.000Z';

function run(start: { x: number; y: number }, end: { x: number; y: number }): DuctRun {
  const installLength = pixelsToFeet(Math.hypot(end.x - start.x, end.y - start.y));
  return {
    id: '550e8400-e29b-41d4-a716-446655440100',
    type: 'duct_run',
    transform: {
      x: start.x,
      y: start.y,
      elevation: 0,
      rotation: (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Run',
      engineeringSystem: 'standard_duct',
      shape: 'round',
      diameter: 12,
      installLength,
      sectionLengthOverride: 5,
      airflow: 0,
      staticPressure: 0.1,
      startPoint: { ...start },
      endPoint: { ...end },
      designStartPoint: { ...start },
      designEndPoint: { ...end },
      designLength: installLength,
      segments: [],
    },
    calculated: { area: 113, velocity: 0, frictionLoss: 0 },
  } as DuctRun;
}

function plainDuct(start: { x: number; y: number }, end: { x: number; y: number }): Duct {
  const length = pixelsToFeet(Math.hypot(end.x - start.x, end.y - start.y));
  return {
    id: '550e8400-e29b-41d4-a716-446655440200',
    type: 'duct',
    transform: {
      x: start.x,
      y: start.y,
      elevation: 0,
      rotation: (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Duct',
      engineeringSystem: 'standard_duct',
      shape: 'round',
      diameter: 12,
      length,
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
    },
    calculated: { area: 113, velocity: 0, frictionLoss: 0 },
  } as Duct;
}

describe('applyDuctEndpointCutback', () => {
  it('trims the end endpoint exactly onto the port opening and shortens the run', () => {
    const duct = run({ x: 100, y: 100 }, { x: 220, y: 100 }); // 120px = 10ft
    const changed = applyDuctEndpointCutback(duct, 'end', { x: 200, y: 100 });

    expect(changed).toBe(true);
    expect(duct.props.endPoint).toEqual({ x: 200, y: 100 });
    expect(duct.props.startPoint).toEqual({ x: 100, y: 100 });
    expect(duct.props.installLength).toBeCloseTo(pixelsToFeet(100), 6);
    expect(duct.transform.x).toBe(100);
    expect(duct.transform.rotation).toBe(0);
    expect(duct.props.segments.length).toBeGreaterThan(0);
    expect(getDuctCenterline(duct)).toEqual({
      start: { x: 100, y: 100 },
      end: { x: 220, y: 100 },
      length: pixelsToFeet(120),
    });
  });

  it('trims the start endpoint and keeps the far end fixed', () => {
    const duct = run({ x: 100, y: 100 }, { x: 220, y: 100 });
    applyDuctEndpointCutback(duct, 'start', { x: 130, y: 100 });

    expect(duct.props.startPoint).toEqual({ x: 130, y: 100 });
    expect(duct.props.endPoint).toEqual({ x: 220, y: 100 });
    expect(duct.transform.x).toBe(130);
    expect(duct.props.installLength).toBeCloseTo(pixelsToFeet(90), 6);
  });

  it('is idempotent when the endpoint already sits on the opening', () => {
    const duct = run({ x: 100, y: 100 }, { x: 220, y: 100 });
    const first = applyDuctEndpointCutback(duct, 'end', { x: 220, y: 100 });
    expect(first).toBe(false);
  });

  it('restores the applied geometry to the authored design centerline', () => {
    const duct = run({ x: 100, y: 100 }, { x: 220, y: 100 });
    applyDuctEndpointCutback(duct, 'end', { x: 200, y: 100 });

    const restored = restoreDuctToDesign(duct);

    expect(restored).toBe(true);
    expect(duct.props.startPoint).toEqual({ x: 100, y: 100 });
    expect(duct.props.endPoint).toEqual({ x: 220, y: 100 });
    expect(duct.props.installLength).toBeCloseTo(pixelsToFeet(120), 6);
  });

  it('adopts legacy current geometry as design before the first cutback', () => {
    const duct = run({ x: 100, y: 100 }, { x: 220, y: 100 });
    delete duct.props.designStartPoint;
    delete duct.props.designEndPoint;
    delete duct.props.designLength;

    applyDuctEndpointCutback(duct, 'start', { x: 130, y: 100 });

    expect(getDuctCenterline(duct)).toEqual({
      start: { x: 100, y: 100 },
      end: { x: 220, y: 100 },
      length: pixelsToFeet(120),
    });
  });

  it('keeps trimmed endpoints on the authored centerline when the opening is off-axis', () => {
    const duct = run({ x: 100, y: 100 }, { x: 200, y: 100 });
    applyDuctEndpointCutback(duct, 'end', { x: 180, y: 150 });

    expect(duct.props.endPoint).toEqual({ x: 180, y: 100 });
    expect(duct.transform.rotation).toBeCloseTo(0, 6);
    expect(duct.props.installLength).toBeCloseTo(pixelsToFeet(80), 6);
  });

  it('exposes resolved endpoints via getDuctEndpoints', () => {
    const duct = run({ x: 10, y: 20 }, { x: 70, y: 20 });
    expect(getDuctEndpoints(duct)).toEqual({ start: { x: 10, y: 20 }, end: { x: 70, y: 20 } });
    // installLength projection sanity (feet → px round-trips).
    expect(feetToPixels(pixelsToFeet(60))).toBeCloseTo(60, 6);
  });

  it('captures and restores a plain duct centerline so its cutback is not permanent', () => {
    const duct = plainDuct({ x: 100, y: 100 }, { x: 220, y: 100 }); // 120px = 10ft

    applyDuctEndpointCutback(duct, 'end', { x: 200, y: 100 });
    // The body shortened to the opening...
    expect(duct.props.length).toBeCloseTo(pixelsToFeet(100), 6);
    expect(getDuctEndpoints(duct).end).toEqual({ x: 200, y: 100 });
    // ...but the authored centerline was captured before the cut.
    expect(getDuctCenterline(duct)).toEqual({
      start: { x: 100, y: 100 },
      end: { x: 220, y: 100 },
      length: pixelsToFeet(120),
    });

    const restored = restoreDuctToDesign(duct);
    expect(restored).toBe(true);
    expect(duct.transform.x).toBe(100);
    expect(duct.props.length).toBeCloseTo(pixelsToFeet(120), 6);
    expect(getDuctEndpoints(duct).end).toEqual({ x: 220, y: 100 });
  });
});
