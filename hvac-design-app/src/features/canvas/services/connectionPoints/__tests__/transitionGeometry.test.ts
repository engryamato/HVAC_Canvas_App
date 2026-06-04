import { describe, expect, it } from 'vitest';
import type { ConnectionProfile } from '../types';
import {
  buildTransitionGeometry,
  buildTransitionIfNeeded,
  normalizeTransitionProfile,
} from '../transitionGeometry';
import type { FittingGeometry } from '../fittingGeometry';

const round = (diameter: number): ConnectionProfile => ({ shape: 'round', diameter });
const flexible = (diameter: number): ConnectionProfile => ({ shape: 'flexible', diameter });
const rect = (width: number, height: number): ConnectionProfile => ({ shape: 'rectangular', width, height });
const flatOval = (width: number, height: number): ConnectionProfile => ({ shape: 'flat_oval', width, height });

const inlet = (geom: FittingGeometry) => geom.openings.find((o) => o.id === 'INLET')!;
const outlet = (geom: FittingGeometry) => geom.openings.find((o) => o.id === 'OUTLET')!;

describe('WS6e E3 — per-shape-pair transition geometry', () => {
  it('resolves all six cross-shape pairs with both ports carrying the right profile', () => {
    const pairs: Array<[ConnectionProfile, ConnectionProfile]> = [
      [rect(14, 10), round(10)],
      [round(10), rect(14, 10)],
      [rect(14, 10), flatOval(20, 8)],
      [flatOval(20, 8), rect(14, 10)],
      [round(10), flatOval(20, 8)],
      [flatOval(20, 8), round(10)],
    ];

    for (const [from, to] of pairs) {
      const geom = buildTransitionGeometry(from, to);
      expect(geom.openings).toHaveLength(2);
      expect(inlet(geom).profile.shape).toBe(from.shape);
      expect(outlet(geom).profile.shape).toBe(to.shape);
      // INLET faces −x, OUTLET faces +x; the body is non-empty for every pair.
      expect(inlet(geom).direction).toEqual({ x: -1, y: 0 });
      expect(outlet(geom).direction).toEqual({ x: 1, y: 0 });
      expect(inlet(geom).position.x).toBeLessThan(outlet(geom).position.x);
      expect(geom.body.length).toBeGreaterThan(0);
      expect(geom.maskBounds.width).toBeGreaterThan(0);
      expect(geom.maskBounds.height).toBeGreaterThan(0);
    }
  });

  it('draws a round footprint (circle) for each round face', () => {
    const rectToRound = buildTransitionGeometry(rect(14, 10), round(10));
    const circles = rectToRound.body.filter((p) => p.kind === 'circle');
    expect(circles).toHaveLength(1);
    if (circles[0]?.kind === 'circle') {
      expect(circles[0].radius).toBe(5); // diameter 10 / 2
    }

    const roundToFlatOval = buildTransitionGeometry(round(10), flatOval(20, 8));
    expect(roundToFlatOval.body.filter((p) => p.kind === 'circle')).toHaveLength(1);
  });

  it('adds rounded end-cap accents only for flat_oval faces', () => {
    const rectToRound = buildTransitionGeometry(rect(14, 10), round(10));
    expect(rectToRound.accents).toHaveLength(0);

    const rectToFlatOval = buildTransitionGeometry(rect(14, 10), flatOval(20, 8));
    expect(rectToFlatOval.accents).toHaveLength(2); // one flat_oval face

    const flatOvalToFlatOval = buildTransitionGeometry(flatOval(14, 10), flatOval(20, 8));
    expect(flatOvalToFlatOval.accents).toHaveLength(4); // both faces
  });

  it('treats flexible as round (normalized port profile + sizing)', () => {
    expect(normalizeTransitionProfile(flexible(9))).toEqual({ shape: 'round', diameter: 9 });

    const geom = buildTransitionGeometry(flexible(9), rect(14, 10));
    expect(inlet(geom).profile).toEqual({ shape: 'round', diameter: 9 });
    // A flexible (round-like) face still draws a circle footprint.
    expect(geom.body.filter((p) => p.kind === 'circle')).toHaveLength(1);
  });

  it('never throws on unknown profiles — falls back to a round default (D9)', () => {
    const geom = buildTransitionGeometry({ shape: 'unknown' }, rect(14, 10));
    expect(inlet(geom).profile.shape).toBe('round');
    expect(geom.openings).toHaveLength(2);
  });
});

describe('WS6e E3 — §9D-gated consumption (buildTransitionIfNeeded)', () => {
  it('builds geometry only when the matrix resolves to transition', () => {
    expect(buildTransitionIfNeeded(rect(14, 10), round(10))).not.toBeNull();
    expect(buildTransitionIfNeeded(round(10), flatOval(20, 8))).not.toBeNull();
  });

  it('returns null for direct (same shape + size) and reducer (same shape, different size)', () => {
    expect(buildTransitionIfNeeded(round(10), round(10))).toBeNull();
    expect(buildTransitionIfNeeded(round(12), round(10))).toBeNull();
    expect(buildTransitionIfNeeded(rect(14, 10), rect(14, 10))).toBeNull();
  });

  it('treats flexible↔round as same-shape (no transition), flexible↔rect as a transition', () => {
    expect(buildTransitionIfNeeded(flexible(10), round(10))).toBeNull();
    expect(buildTransitionIfNeeded(flexible(10), rect(14, 10))).not.toBeNull();
  });
});
