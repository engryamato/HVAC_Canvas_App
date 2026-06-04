import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Fitting } from '@/core/schema';
import type { FittingProps, FittingType } from '@/core/schema/fitting.schema';
import { resolveFittingDimensions, type FittingBodyPart } from '../fittingGeometry';
import { buildTakeoffGeometry } from '../takeoffGeometry';

/** Minimal Fitting for the pure geometry resolvers (they read props only). */
function fitting(props: Partial<FittingProps> & { fittingType: FittingType }): Fitting {
  return {
    props: {
      engineeringSystem: 'standard_duct',
      serviceId: '00000000-0000-0000-0000-000000000001',
      ...props,
    },
  } as Fitting;
}

const dims = (props: Partial<FittingProps>) =>
  resolveFittingDimensions(fitting({ fittingType: 'takeoff', ...props }));

const geom = (props: Partial<FittingProps>) => buildTakeoffGeometry(dims(props));
const branch = (g: ReturnType<typeof geom>) => g.openings.find((o) => o.id === 'BRANCH')!;
const kinds = (g: ReturnType<typeof geom>) => g.body.map((p: FittingBodyPart) => p.kind);

describe('WS6e E4 — takeoff variant threading into FittingDimensions', () => {
  it('defaults to a perpendicular straight tap with no damper', () => {
    const d = dims({});
    expect(d.takeoffType).toBe('straight_tap');
    expect(d.entryAngle).toBe(90);
    expect(d.hasDamper).toBe(false);
  });

  it('reads takeoffType, entryAngleDeg and hasDamper from the variant', () => {
    const d = dims({ variant: { takeoffType: 'spin_in', entryAngleDeg: 45, hasDamper: true } });
    expect(d.takeoffType).toBe('spin_in');
    expect(d.entryAngle).toBe(45);
    expect(d.hasDamper).toBe(true);
  });
});

describe('WS6e E4 — takeoff branch geometry', () => {
  it('exposes a single BRANCH opening on the trunk centerline', () => {
    const g = geom({});
    expect(g.openings).toHaveLength(1);
    expect(branch(g).role).toBe('branch');
    expect(g.anchor).toEqual({ x: 0, y: 0 });
  });

  it('rises perpendicular at 90° and leans toward the outlet below it', () => {
    const perpendicular = branch(geom({ variant: { entryAngleDeg: 90 } }));
    const angled = branch(geom({ variant: { entryAngleDeg: 45 } }));
    expect(Math.abs(perpendicular.direction.x)).toBeLessThan(0.01);
    expect(perpendicular.direction.y).toBeLessThan(0); // branch points up (−y)
    expect(angled.direction.x).toBeGreaterThan(0.5); // leans toward +x outlet
  });
});

describe('WS6e E4 — per-class takeoff geometry', () => {
  it('conical_tap and bellmouth flare wider at the base than a straight tap', () => {
    const straight = geom({ variant: { takeoffType: 'straight_tap' } });
    const conical = geom({ variant: { takeoffType: 'conical_tap' } });
    const baseWidth = (g: ReturnType<typeof geom>) => {
      const poly = g.body[0];
      if (poly.kind !== 'polygon') throw new Error('expected stub polygon');
      // base edge is the last->first vertex span across p (here the trunk x-axis).
      return Math.abs(poly.points[3]!.x - poly.points[0]!.x);
    };
    expect(baseWidth(conical)).toBeGreaterThan(baseWidth(straight));
  });

  it('spin_in adds a round collar circle', () => {
    expect(kinds(geom({ variant: { takeoffType: 'spin_in' } }))).toContain('circle');
    expect(kinds(geom({ variant: { takeoffType: 'straight_tap' } }))).not.toContain('circle');
  });

  it('bellmouth adds radiused throat quads', () => {
    expect(kinds(geom({ variant: { takeoffType: 'bellmouth' } }))).toContain('quad');
  });
});

describe('WS6e E4 — shape-aware saddle footprint', () => {
  const onMain = (shape: 'round' | 'rectangular') =>
    geom({ variant: { takeoffType: 'saddle' }, transitionData: { fromShape: shape, toDiameter: 8 } });

  it('wraps a round trunk with a curved saddle (two chords)', () => {
    expect(onMain('round').accents).toHaveLength(2);
  });

  it('uses a single straight flange on a rectangular trunk', () => {
    expect(onMain('rectangular').accents).toHaveLength(1);
  });
});

describe('WS6e E4 — damper blade', () => {
  it('adds exactly one blade accent when hasDamper is set', () => {
    const without = geom({ variant: { takeoffType: 'straight_tap' } });
    const withDamper = geom({ variant: { takeoffType: 'straight_tap', hasDamper: true } });
    expect(without.accents).toHaveLength(0);
    expect(withDamper.accents).toHaveLength(1);
  });
});

describe('WS6e E4 — flag gating', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/core/flags/featureFlags');
  });

  it('falls back to the legacy reducer-shaped geometry (INLET/OUTLET) when the flag is off', async () => {
    vi.resetModules();
    vi.doMock('@/core/flags/featureFlags', () => ({
      isEnabled: (flag: string) => flag !== 'WS6D_DESIGN_GEOMETRY',
    }));
    const { buildFittingGeometry } = await import('../fittingGeometry');
    const g = buildFittingGeometry(
      fitting({ fittingType: 'takeoff', transitionData: { fromShape: 'round', toDiameter: 8 } })
    );
    const ids = g.openings.map((o) => o.id).sort();
    expect(ids).toEqual(['INLET', 'OUTLET']);
  });

  it('produces the BRANCH-only takeoff geometry when the flag is on', async () => {
    vi.resetModules();
    vi.doMock('@/core/flags/featureFlags', () => ({
      isEnabled: () => true,
    }));
    const { buildFittingGeometry } = await import('../fittingGeometry');
    const g = buildFittingGeometry(fitting({ fittingType: 'takeoff' }));
    expect(g.openings.map((o) => o.id)).toEqual(['BRANCH']);
  });
});
