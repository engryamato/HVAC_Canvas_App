import { describe, expect, it } from 'vitest';
import type { Fitting } from '@/core/schema';
import type { FittingProps, FittingType } from '@/core/schema/fitting.schema';
import { resolveFittingDimensions } from '../fittingGeometry';
import { buildBootGeometry } from '../bootGeometry';

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

const geom = (props: Partial<FittingProps>) =>
  buildBootGeometry(resolveFittingDimensions(fitting({ fittingType: 'end_boot', ...props })));
const opening = (g: ReturnType<typeof geom>, id: string) => g.openings.find((o) => o.id === id)!;

describe('WS6e E5 — terminal boot / register collar geometry', () => {
  it('has a duct INLET and a rectangular register OUTLET', () => {
    const g = geom({ transitionData: { fromShape: 'round', fromDiameter: 12 } });
    expect(g.openings.map((o) => o.id).sort()).toEqual(['INLET', 'OUTLET']);
    expect(opening(g, 'OUTLET').profile.shape).toBe('rectangular');
  });

  it('keeps a round inlet profile for round duct inlets', () => {
    expect(opening(geom({ transitionData: { fromShape: 'round', fromDiameter: 12 } }), 'INLET').profile.shape).toBe(
      'round'
    );
  });

  it('uses rectangular inlet dimensions from transition data', () => {
    const profile = opening(
      geom({ transitionData: { fromShape: 'rectangular', fromWidth: 20, fromHeight: 10 } }),
      'INLET'
    ).profile;

    expect(profile.shape).toBe('rectangular');
    if (profile.shape !== 'rectangular') throw new Error('expected rectangular inlet profile');
    expect(profile.width).toBe(20);
    expect(profile.height).toBe(10);
  });

  it('flares the register face larger than the duct', () => {
    const g = geom({ transitionData: { fromShape: 'round', fromDiameter: 12 } });
    const outlet = opening(g, 'OUTLET').profile;
    if (outlet.shape !== 'rectangular') throw new Error('expected rectangular register face');
    expect(outlet.height).toBeGreaterThan(12);
  });

  it('scales the register face with the duct size', () => {
    const small = opening(geom({ transitionData: { fromShape: 'round', fromDiameter: 8 } }), 'OUTLET').profile;
    const large = opening(geom({ transitionData: { fromShape: 'round', fromDiameter: 20 } }), 'OUTLET').profile;
    if (small.shape !== 'rectangular' || large.shape !== 'rectangular') throw new Error('expected rectangular faces');
    expect(large.height).toBeGreaterThan(small.height);
  });

  it('draws the rectangular inlet body edge from rectHeight, not the inlet width', () => {
    // fromWidth 20 / fromHeight 10: inletSize resolves to the width (20), so the
    // body inlet edge must come from rectHeight (10) → half-height 5, not 10.
    const g = geom({ transitionData: { fromShape: 'rectangular', fromWidth: 20, fromHeight: 10 } });
    const polygon = g.body.find((p) => p.kind === 'polygon');
    if (!polygon || polygon.kind !== 'polygon') throw new Error('expected a polygon body part');
    const minX = Math.min(...polygon.points.map((p) => p.x));
    const inletEdgeHalfHeight = Math.max(
      ...polygon.points.filter((p) => p.x === minX).map((p) => Math.abs(p.y))
    );
    expect(inletEdgeHalfHeight).toBeCloseTo(5, 6);
  });

  it('adds a round footprint for a round duct inlet but not for a rectangular one', () => {
    const round = geom({ transitionData: { fromShape: 'round', fromDiameter: 12 } });
    const rect = geom({ transitionData: { fromShape: 'rectangular', fromWidth: 12, fromHeight: 8 } });
    expect(round.body.map((p) => p.kind)).toContain('circle');
    expect(rect.body.map((p) => p.kind)).not.toContain('circle');
  });

  it('draws a flange plate at the open register end', () => {
    const g = geom({ transitionData: { fromShape: 'round', fromDiameter: 12 } });
    expect(g.accents).toHaveLength(1);
    // Flange is the vertical frame at the +x face.
    expect(g.accents[0]!.from.x).toBe(g.accents[0]!.to.x);
    expect(g.accents[0]!.from.x).toBeGreaterThan(0);
  });

  it('anchors at the centered origin with INLET facing −x and OUTLET facing +x', () => {
    const g = geom({ transitionData: { fromShape: 'round', fromDiameter: 12 } });
    expect(g.anchor).toEqual({ x: 0, y: 0 });
    expect(opening(g, 'INLET').direction).toEqual({ x: -1, y: 0 });
    expect(opening(g, 'OUTLET').direction).toEqual({ x: 1, y: 0 });
  });
});
