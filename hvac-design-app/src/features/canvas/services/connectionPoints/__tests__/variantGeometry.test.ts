import { describe, expect, it } from 'vitest';
import type { Fitting } from '@/core/schema';
import type { FittingProps, FittingType } from '@/core/schema/fitting.schema';
import {
  buildFittingGeometry,
  resolveFittingDimensions,
  type FittingBodyPart,
} from '../fittingGeometry';

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

const opening = (geom: ReturnType<typeof buildFittingGeometry>, id: string) =>
  geom.openings.find((o) => o.id === id)!;

const reducerTransition = { fromShape: 'round', toShape: 'round', fromDiameter: 12, toDiameter: 8 } as const;

describe('WS6e E2 — variant threading into FittingDimensions', () => {
  it('maps radiusClass to the radius ratio', () => {
    expect(resolveFittingDimensions(fitting({ fittingType: 'elbow_90', variant: { radiusClass: 'R2.0' } })).radiusRatio).toBe(2.0);
    expect(resolveFittingDimensions(fitting({ fittingType: 'elbow_90', variant: { radiusClass: 'R1.0' } })).radiusRatio).toBe(1.0);
  });

  it('lets branchAngleDeg override the branch angle', () => {
    expect(resolveFittingDimensions(fitting({ fittingType: 'tee', variant: { branchAngleDeg: 60 } })).angle).toBe(60);
  });

  it('defaults elbowKind from the fitting type, variant overrides it', () => {
    expect(resolveFittingDimensions(fitting({ fittingType: 'elbow_mitered' })).elbowKind).toBe('mitered');
    expect(resolveFittingDimensions(fitting({ fittingType: 'elbow_90' })).elbowKind).toBe('radius');
    expect(resolveFittingDimensions(fitting({ fittingType: 'elbow_90', variant: { elbowType: 'mitered' } })).elbowKind).toBe('mitered');
  });

  it('leaves old fittings (no variant) at concentric/default posture', () => {
    const dims = resolveFittingDimensions(fitting({ fittingType: 'reducer' }));
    expect(dims.eccentricSide).toBeNull();
    expect(dims.vaneType).toBe('none');
    expect(dims.branchSide).toBe('right');
    expect(dims.transitionStyle).toBe('straight');
  });
});

describe('WS6e E2 — variant-aware elbow geometry', () => {
  const bodyKinds = (type: FittingType, variant: FittingProps['variant']) =>
    buildFittingGeometry(fitting({ fittingType: type, variant })).body.map((p: FittingBodyPart) => p.kind);

  it('honors variant.elbowType over the granular type', () => {
    expect(bodyKinds('elbow_90', { elbowType: 'mitered' })).toContain('polygon');
    expect(bodyKinds('elbow_90', { elbowType: 'mitered' })).not.toContain('arcBand');
    expect(bodyKinds('elbow_mitered', { elbowType: 'radius' })).toContain('arcBand');
  });

  it('scales the smooth-elbow arc with the radius class', () => {
    const small = buildFittingGeometry(fitting({ fittingType: 'elbow_90', variant: { radiusClass: 'R1.0' } })).body[0];
    const large = buildFittingGeometry(fitting({ fittingType: 'elbow_90', variant: { radiusClass: 'R2.0' } })).body[0];
    expect(small.kind).toBe('arcBand');
    expect(large.kind).toBe('arcBand');
    if (small.kind === 'arcBand' && large.kind === 'arcBand') {
      expect(large.outerRadius).toBeGreaterThan(small.outerRadius);
    }
  });

  it('adds turning vanes that grow with the vane treatment', () => {
    const none = buildFittingGeometry(fitting({ fittingType: 'elbow_90', variant: { vaneType: 'none' } }));
    const single = buildFittingGeometry(fitting({ fittingType: 'elbow_90', variant: { vaneType: 'single_wall' } }));
    const dbl = buildFittingGeometry(fitting({ fittingType: 'elbow_90', variant: { vaneType: 'double_wall' } }));
    expect(none.accents.length).toBe(0);
    expect(single.accents.length).toBe(2);
    expect(dbl.accents.length).toBe(4);
  });
});

describe('WS6e E2 — variant-aware reducer eccentricity', () => {
  it('is concentric by default (outlet centered)', () => {
    const geom = buildFittingGeometry(fitting({ fittingType: 'reducer', transitionData: reducerTransition }));
    expect(opening(geom, 'OUTLET').position.y).toBe(0);
  });

  it('flushes to the bottom or top wall per variant.eccentricOffset', () => {
    const bottom = buildFittingGeometry(fitting({ fittingType: 'reducer', transitionData: reducerTransition, variant: { eccentricOffset: 'bottom' } }));
    const top = buildFittingGeometry(fitting({ fittingType: 'reducer', transitionData: reducerTransition, variant: { eccentricOffset: 'top' } }));
    expect(opening(bottom, 'OUTLET').position.y).toBeGreaterThan(0);
    expect(opening(top, 'OUTLET').position.y).toBeLessThan(0);
  });

  it('treats the legacy reducer_eccentric type as bottom-flush', () => {
    const geom = buildFittingGeometry(fitting({ fittingType: 'reducer_eccentric', transitionData: reducerTransition }));
    expect(opening(geom, 'OUTLET').position.y).toBeGreaterThan(0);
  });
});

describe('WS6e E2 — variant-aware transition alignment & style', () => {
  // rect taller than the round end so top/bottom alignment has room to shift.
  const transitionData = { fromShape: 'rectangular', toShape: 'round', fromWidth: 14, fromHeight: 14, toDiameter: 8 } as const;

  it('aligns the round end per transitionAlignment', () => {
    const centered = buildFittingGeometry(fitting({ fittingType: 'transition_square_to_round', transitionData }));
    const top = buildFittingGeometry(fitting({ fittingType: 'transition_square_to_round', transitionData, variant: { transitionAlignment: 'top' } }));
    const bottom = buildFittingGeometry(fitting({ fittingType: 'transition_square_to_round', transitionData, variant: { transitionAlignment: 'bottom' } }));
    expect(opening(centered, 'OUTLET').position.y).toBe(0);
    expect(opening(top, 'OUTLET').position.y).toBeLessThan(0);
    expect(opening(bottom, 'OUTLET').position.y).toBeGreaterThan(0);
  });

  it('adds gore seams only for the gored style', () => {
    const straight = buildFittingGeometry(fitting({ fittingType: 'transition_square_to_round', transitionData }));
    const gored = buildFittingGeometry(fitting({ fittingType: 'transition_square_to_round', transitionData, variant: { transitionStyle: 'gored' } }));
    expect(straight.accents.length).toBe(0);
    expect(gored.accents.length).toBe(3);
  });
});

describe('WS6e E2 — variant-aware wye/branch', () => {
  it('mirrors the branch across the main run per branchSide', () => {
    const right = buildFittingGeometry(fitting({ fittingType: 'tee' }));
    const left = buildFittingGeometry(fitting({ fittingType: 'tee', variant: { branchSide: 'left' } }));
    expect(opening(right, 'BRANCH').position.y).toBeLessThan(0);
    expect(opening(left, 'BRANCH').position.y).toBeGreaterThan(0);
    // Main run openings stay on the axis under mirroring.
    expect(opening(left, 'INLET').position.y).toBe(0);
    expect(opening(left, 'OUTLET').position.y).toBe(0);
  });

  it('uses branchAngleDeg for the tee branch direction', () => {
    const perpendicular = buildFittingGeometry(fitting({ fittingType: 'tee', variant: { branchAngleDeg: 90 } }));
    const angled = buildFittingGeometry(fitting({ fittingType: 'tee', variant: { branchAngleDeg: 45 } }));
    expect(Math.abs(opening(perpendicular, 'BRANCH').direction.x)).toBeLessThan(0.01);
    expect(opening(angled, 'BRANCH').direction.x).toBeGreaterThan(0.5);
  });
});
