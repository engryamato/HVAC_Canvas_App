import { describe, expect, it } from 'vitest';
import type { Fitting } from '@/core/schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import { buildFittingGeometry } from '../fittingGeometry';
import { resolveLocalFittingPorts } from '../fittingResolver';

const now = '2026-01-01T00:00:00.000Z';

function fitting(type: FittingType): Fitting {
  return {
    id: '550e8400-e29b-41d4-a716-446655440200',
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: now,
    modifiedAt: now,
    props: { engineeringSystem: 'standard_duct', fittingType: type, manualOverride: false },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

const EXPECTED_PORTS: Record<FittingType, number> = {
  elbow_90: 2,
  elbow_45: 2,
  elbow_mitered: 2,
  reducer: 2,
  reducer_tapered: 2,
  reducer_eccentric: 2,
  transition_square_to_round: 2,
  end_boot: 2,
  cap: 1,
  tee: 3,
  wye: 3,
};

const ALL_TYPES = Object.keys(EXPECTED_PORTS) as FittingType[];

describe('buildFittingGeometry', () => {
  it.each(ALL_TYPES)('produces the expected stable port count for %s', (type) => {
    const geometry = buildFittingGeometry(fitting(type));
    expect(geometry.openings).toHaveLength(EXPECTED_PORTS[type]);
  });

  it.each(ALL_TYPES)('emits unit facing directions and non-empty body for %s', (type) => {
    const geometry = buildFittingGeometry(fitting(type));
    expect(geometry.body.length).toBeGreaterThan(0);
    for (const opening of geometry.openings) {
      const magnitude = Math.hypot(opening.direction.x, opening.direction.y);
      expect(magnitude).toBeCloseTo(1, 3);
      expect(opening.profile).toBeDefined();
    }
  });

  it.each(ALL_TYPES)('resolver ports and geometry openings are the same data for %s', (type) => {
    const geometry = buildFittingGeometry(fitting(type));
    const ports = resolveLocalFittingPorts(fitting(type));

    expect(ports).toHaveLength(geometry.openings.length);
    geometry.openings.forEach((opening, index) => {
      expect(ports[index]?.id).toBe(opening.id);
      expect(ports[index]?.localPosition).toEqual(opening.position);
      expect(ports[index]?.facingDirection).toEqual(opening.direction);
    });
  });

  it('keeps the first opening off the fitting origin (no origin-snap target)', () => {
    for (const type of ALL_TYPES) {
      const [first] = buildFittingGeometry(fitting(type)).openings;
      expect(Math.hypot(first.position.x, first.position.y)).toBeGreaterThan(0);
    }
  });

  it('honors a larger radiusRatio by pushing elbow openings farther from the corner', () => {
    const base = fitting('elbow_90');
    const wide: Fitting = { ...base, props: { ...base.props, radiusRatio: 3 } };
    const baseReach = Math.hypot(...openingReach(base));
    const wideReach = Math.hypot(...openingReach(wide));
    expect(wideReach).toBeGreaterThan(baseReach);
  });
});

function openingReach(f: Fitting): [number, number] {
  const [inlet] = buildFittingGeometry(f).openings;
  return [inlet.position.x, inlet.position.y];
}

function withAngle(type: FittingType, angle: number): Fitting {
  const base = fitting(type);
  return { ...base, props: { ...base.props, angle } };
}

function dirAngleDeg(d: { x: number; y: number }): number {
  return (Math.atan2(d.y, d.x) * 180) / Math.PI;
}

function angleBetween(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dot = a.x * b.x + a.y * b.y;
  return (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
}

describe('fitting geometry follows the detected angle', () => {
  it('wye branch opening leans at the detected branch angle (default 45 unchanged)', () => {
    const def = buildFittingGeometry(fitting('wye')).openings.find((o) => o.role === 'branch')!;
    expect(dirAngleDeg(def.direction)).toBeCloseTo(-45, 1); // up-and-forward

    const shallow = buildFittingGeometry(withAngle('wye', 30)).openings.find((o) => o.role === 'branch')!;
    expect(dirAngleDeg(shallow.direction)).toBeCloseTo(-30, 1);
  });

  it('tee branch opening is perpendicular by default and leans when angled', () => {
    const def = buildFittingGeometry(fitting('tee')).openings.find((o) => o.role === 'branch')!;
    expect(def.direction).toEqual({ x: 0, y: -1 }); // straight up = classic tee, no regression

    const leaned = buildFittingGeometry(withAngle('tee', 75)).openings.find((o) => o.role === 'branch')!;
    expect(dirAngleDeg(leaned.direction)).toBeCloseTo(-75, 1);
  });

  it('elbow arc spans the detected turn angle (90 / 45 presets unchanged)', () => {
    const ports90 = buildFittingGeometry(fitting('elbow_90')).openings;
    expect(angleBetween(ports90[0].direction, ports90[1].direction)).toBeCloseTo(90, 1);

    const ports45 = buildFittingGeometry(fitting('elbow_45')).openings;
    expect(angleBetween(ports45[0].direction, ports45[1].direction)).toBeCloseTo(45, 1);

    const ports60 = buildFittingGeometry(withAngle('elbow_90', 60)).openings;
    expect(angleBetween(ports60[0].direction, ports60[1].direction)).toBeCloseTo(60, 1);
  });
});
