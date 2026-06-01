import { describe, expect, it } from 'vitest';
import type { Fitting } from '@/core/schema';
import { resolveFittingGeometry } from '../fittingResolver';

const now = '2026-01-01T00:00:00.000Z';

function fitting(type: Fitting['props']['fittingType'], rotation = 0): Fitting {
  return {
    id: '550e8400-e29b-41d4-a716-446655449001',
    type: 'fitting',
    transform: { x: 200, y: 140, elevation: 0, rotation, scaleX: 1, scaleY: 1 },
    zIndex: 10,
    createdAt: now,
    modifiedAt: now,
    props: {
      engineeringSystem: 'standard_duct',
      fittingType: type,
      manualOverride: false,
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

describe('resolveFittingGeometry', () => {
  it('resolves a cap as a one-port connectable object', () => {
    const geometry = resolveFittingGeometry(fitting('cap'));

    expect(geometry.connectionPoints).toHaveLength(1);
    // Parametric geometry: cap body half-length = bodyLength(12) * 0.7 / 2 = 17.64.
    expect(geometry.connectionPoints[0]).toMatchObject({
      id: 'INLET',
      objectId: '550e8400-e29b-41d4-a716-446655449001',
      role: 'inlet',
      worldPosition: { x: 182.36, y: 140 },
    });
  });

  it('resolves a reducer as inlet and outlet ports instead of an origin target', () => {
    const geometry = resolveFittingGeometry(fitting('reducer'));

    // Parametric geometry: reducer half-length = bodyLength(12) / 2 = 25.2.
    expect(geometry.connectionPoints.map((point) => point.id)).toEqual(['INLET', 'OUTLET']);
    expect(geometry.connectionPoints[0]?.worldPosition).toEqual({ x: 174.8, y: 140 });
    expect(geometry.connectionPoints[1]?.worldPosition).toEqual({ x: 225.2, y: 140 });
  });

  it('resolves a tee as inlet, outlet, and branch ports', () => {
    const geometry = resolveFittingGeometry(fitting('tee'));

    // Branch centered on the main run, branchLen = mainH/2 + bodyLength(6)*0.45 = 24.
    expect(geometry.connectionPoints.map((point) => point.id)).toEqual(['INLET', 'OUTLET', 'BRANCH']);
    expect(geometry.connectionPoints[2]).toMatchObject({
      role: 'branch',
      worldPosition: { x: 200, y: 116 },
    });
  });

  it('resolves the SD5-2 wye with stable inlet, outlet, and branch ports from reference geometry', () => {
    const geometry = resolveFittingGeometry(fitting('wye'));
    const branch = geometry.connectionPoints.find((point) => point.id === 'BRANCH');

    expect(geometry.connectionPoints.map((point) => point.id)).toEqual(['INLET', 'OUTLET', 'BRANCH']);
    // Geometry is centered on the main run (origin on the main centerline), so
    // the inlet opening sits to the left of the fitting transform, not on it.
    expect(geometry.connectionPoints[0]?.worldPosition).toEqual({ x: 172.76, y: 140 });
    expect(geometry.connectionPoints[1]?.worldPosition.x).toBeGreaterThan(geometry.connectionPoints[0]!.worldPosition.x);
    expect(branch?.worldPosition.x).toBeGreaterThan(geometry.connectionPoints[0]!.worldPosition.x);
    expect(branch?.worldPosition.y).toBeLessThan(geometry.connectionPoints[0]!.worldPosition.y);
    expect(branch?.facingDirection.x).toBeCloseTo(Math.SQRT1_2, 3);
    expect(branch?.facingDirection.y).toBeCloseTo(-Math.SQRT1_2, 3);
  });

  it('applies fitting rotation to resolved port positions and directions', () => {
    const geometry = resolveFittingGeometry(fitting('reducer', 90));

    expect(geometry.connectionPoints[0]?.worldPosition).toEqual({ x: 200, y: 114.8 });
    expect(geometry.connectionPoints[1]?.worldPosition).toEqual({ x: 200, y: 165.2 });
    expect(geometry.connectionPoints[0]?.facingDirection).toEqual({ x: 0, y: -1 });
    expect(geometry.connectionPoints[1]?.facingDirection).toEqual({ x: 0, y: 1 });
  });
});
