import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DuctRun, Entity } from '@/core/schema';
import { pixelsToFeet } from '@/core/constants/coordinates';
import { ConnectionReconciliationService } from '../ConnectionReconciliationService';

const now = '2026-01-01T00:00:00.000Z';

/**
 * A duct_run whose RENDERED geometry has been cut (endPoint pulled in from the
 * authored design endPoint) — simulating a fitting cutback whose fitting has
 * since been removed. No fitting is present in the entity map.
 */
function cutRun(): DuctRun {
  const designStart = { x: 100, y: 100 };
  const designEnd = { x: 220, y: 100 };
  const cutEnd = { x: 200, y: 100 };
  return {
    id: '550e8400-e29b-41d4-a716-446655440100',
    type: 'duct_run',
    transform: { x: 100, y: 100, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Run',
      engineeringSystem: 'standard_duct',
      shape: 'round',
      diameter: 12,
      installLength: pixelsToFeet(100),
      sectionLengthOverride: 5,
      airflow: 0,
      staticPressure: 0.1,
      startPoint: { ...designStart },
      endPoint: { ...cutEnd },
      designStartPoint: { ...designStart },
      designEndPoint: { ...designEnd },
      designLength: pixelsToFeet(120),
      segments: [],
    },
    calculated: { area: 113, velocity: 0, frictionLoss: 0 },
  } as DuctRun;
}

describe('ConnectionReconciliationService — WS6d detach restores design geometry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('re-extends a previously-cut duct to its design centerline when no fitting connects it', () => {
    const duct = cutRun();
    const result = ConnectionReconciliationService.reconcile({ [duct.id]: duct }) as Record<string, Entity>;
    const reconciled = result[duct.id] as DuctRun;

    expect(reconciled.props.endPoint).toEqual({ x: 220, y: 100 });
    expect(reconciled.props.startPoint).toEqual({ x: 100, y: 100 });
    expect(reconciled.props.installLength).toBeCloseTo(pixelsToFeet(120), 6);
  });

  it('leaves the cut geometry untouched when WS6D_DESIGN_GEOMETRY is off (legacy)', async () => {
    vi.resetModules();
    vi.doMock('@/core/flags/featureFlags', () => ({
      isEnabled: (flag: string) => flag !== 'WS6D_DESIGN_GEOMETRY',
    }));
    const { ConnectionReconciliationService: Service } = await import('../ConnectionReconciliationService');

    const duct = cutRun();
    const result = Service.reconcile({ [duct.id]: duct }) as Record<string, Entity>;
    const reconciled = result[duct.id] as DuctRun;

    // Legacy: the detached duct stays cut (the asymmetry bug, preserved behind the flag).
    expect(reconciled.props.endPoint).toEqual({ x: 200, y: 100 });
    expect(reconciled.props.installLength).toBeCloseTo(pixelsToFeet(100), 6);
  });
});
