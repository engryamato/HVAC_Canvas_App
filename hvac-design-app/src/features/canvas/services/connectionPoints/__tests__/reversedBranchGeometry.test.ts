import { describe, expect, it } from 'vitest';
import type { Fitting } from '@/core/schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import { buildFittingGeometry } from '../fittingGeometry';

/**
 * Reversed-branch coverage (ductwork wrap-up): tee / wye / takeoff branches at
 * angles > 90° lean BACK toward the inlet. The branch opening must follow the
 * requested angle so the resolved port lines up with the actual duct, instead
 * of being folded into the forward 0–90° range.
 */

function makeFitting(fittingType: FittingType, angle: number, variant?: Fitting['props']['variant']): Fitting {
  return {
    id: `test-${fittingType}-${angle}`,
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      engineeringSystem: 'standard_duct',
      fittingType,
      manualOverride: false,
      angle,
      variant,
      transitionData: { fromShape: 'round', fromDiameter: 12, toShape: 'round', toDiameter: 8 },
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  } as Fitting;
}

function branchOpening(fitting: Fitting) {
  const opening = buildFittingGeometry(fitting).openings.find((o) => o.role === 'branch');
  expect(opening).toBeDefined();
  return opening!;
}

function expectedDirection(angleDeg: number) {
  const theta = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(theta), y: -Math.sin(theta) };
}

describe('tee reversed branch angles', () => {
  it.each([60, 90, 120, 150])('tee branch direction follows %d°', (angle) => {
    const opening = branchOpening(makeFitting('tee', angle));
    const expected = expectedDirection(angle);
    expect(opening.direction.x).toBeCloseTo(expected.x, 2);
    expect(opening.direction.y).toBeCloseTo(expected.y, 2);
  });

  it('reversed tee branch opening sits on the inlet side (x < 0)', () => {
    const opening = branchOpening(makeFitting('tee', 135));
    expect(opening.position.x).toBeLessThan(0);
    expect(opening.position.y).toBeLessThan(0);
  });

  it('clamps extreme angles into the fabricable 30–150 band', () => {
    const low = branchOpening(makeFitting('tee', 10));
    const high = branchOpening(makeFitting('tee', 170));
    expect(low.direction.x).toBeCloseTo(expectedDirection(30).x, 2);
    expect(high.direction.x).toBeCloseTo(expectedDirection(150).x, 2);
  });

  it('branchSide left mirrors a reversed branch across the main run', () => {
    const right = branchOpening(makeFitting('tee', 120));
    const left = branchOpening(makeFitting('tee', 120, { branchSide: 'left' }));
    expect(left.position.x).toBeCloseTo(right.position.x, 3);
    expect(left.position.y).toBeCloseTo(-right.position.y, 3);
    expect(left.direction.y).toBeCloseTo(-right.direction.y, 3);
  });
});

describe('wye reversed branch angles', () => {
  it.each([30, 45, 135, 150])('wye branch direction follows %d°', (angle) => {
    const opening = branchOpening(makeFitting('wye', angle));
    const expected = expectedDirection(angle);
    expect(opening.direction.x).toBeCloseTo(expected.x, 2);
    expect(opening.direction.y).toBeCloseTo(expected.y, 2);
  });

  it('keeps the reversed-wye cone root seated on the body (no spill past the inlet face)', () => {
    const geometry = buildFittingGeometry(makeFitting('wye', 150));
    const outline = geometry.body[0];
    const cone = geometry.body[1];
    expect(outline?.kind).toBe('polygon');
    expect(cone?.kind).toBe('polygon');
    if (outline?.kind === 'polygon' && cone?.kind === 'polygon') {
      const inletFaceX = Math.min(...outline.points.map((p) => p.x));
      // Cone polygon is [Tb1, W1, W2, Tb2]; W1/W2 (indices 1, 2) are the
      // wall-root points that must stay seated on the body. The tip (Tb1/Tb2)
      // may legitimately overhang the inlet face when leaning back.
      const rootXs = [cone.points[1]!.x, cone.points[2]!.x];
      expect(Math.min(...rootXs)).toBeGreaterThan(inletFaceX);
    }
  });

  it('inlet and outlet stay on the main axis for reversed wyes', () => {
    const geometry = buildFittingGeometry(makeFitting('wye', 135));
    const inlet = geometry.openings.find((o) => o.role === 'inlet')!;
    const outlet = geometry.openings.find((o) => o.role === 'outlet')!;
    expect(inlet.position.y).toBeCloseTo(0, 3);
    expect(outlet.position.y).toBeCloseTo(0, 3);
    expect(inlet.direction).toEqual({ x: -1, y: 0 });
    expect(outlet.direction).toEqual({ x: 1, y: 0 });
  });
});

describe('takeoff reversed entry angles', () => {
  it.each([60, 90, 120])('takeoff branch direction follows %d° via props.angle fallback', (angle) => {
    const opening = branchOpening(makeFitting('takeoff', angle));
    const expected = expectedDirection(angle);
    expect(opening.direction.x).toBeCloseTo(expected.x, 2);
    expect(opening.direction.y).toBeCloseTo(expected.y, 2);
  });

  it('variant.entryAngleDeg still wins over props.angle', () => {
    const opening = branchOpening(makeFitting('takeoff', 90, { entryAngleDeg: 120 }));
    const expected = expectedDirection(120);
    expect(opening.direction.x).toBeCloseTo(expected.x, 2);
    expect(opening.direction.y).toBeCloseTo(expected.y, 2);
  });
});
