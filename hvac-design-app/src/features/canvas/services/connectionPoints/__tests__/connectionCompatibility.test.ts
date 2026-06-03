import { describe, expect, it } from 'vitest';
import type { ConnectionProfile } from '../types';
import {
  isDirectlyConnectable,
  resolveConnectionCompatibility,
} from '../connectionCompatibility';

const round = (diameter: number): ConnectionProfile => ({ shape: 'round', diameter });
const flexible = (diameter: number): ConnectionProfile => ({ shape: 'flexible', diameter });
const rect = (width: number, height: number): ConnectionProfile => ({ shape: 'rectangular', width, height });
const flatOval = (width: number, height: number): ConnectionProfile => ({ shape: 'flat_oval', width, height });

describe('resolveConnectionCompatibility (WS6e E1 — §9D bridge)', () => {
  it('returns direct for same shape + same size', () => {
    expect(resolveConnectionCompatibility(round(12), round(12))).toEqual({
      resolution: 'direct',
      requiresAdapter: false,
    });
    expect(resolveConnectionCompatibility(rect(12, 8), rect(12, 8))).toEqual({
      resolution: 'direct',
      requiresAdapter: false,
    });
  });

  it('returns reducer for same shape + different size', () => {
    expect(resolveConnectionCompatibility(round(12), round(10)).resolution).toBe('reducer');
    expect(resolveConnectionCompatibility(rect(12, 8), rect(14, 8)).resolution).toBe('reducer');
    expect(resolveConnectionCompatibility(round(12), round(10)).requiresAdapter).toBe(true);
  });

  it('returns transition for any cross-shape pair (regardless of size)', () => {
    expect(resolveConnectionCompatibility(round(12), rect(12, 8)).resolution).toBe('transition');
    expect(resolveConnectionCompatibility(round(12), flatOval(12, 8)).resolution).toBe('transition');
    expect(resolveConnectionCompatibility(rect(12, 8), flatOval(12, 8)).resolution).toBe('transition');
  });

  it('treats flexible as round for gating', () => {
    expect(resolveConnectionCompatibility(flexible(12), round(12)).resolution).toBe('direct');
    expect(resolveConnectionCompatibility(flexible(12), round(10)).resolution).toBe('reducer');
    expect(resolveConnectionCompatibility(flexible(12), rect(12, 8)).resolution).toBe('transition');
  });

  it('never blocks unknown shapes — falls back to transition (D9)', () => {
    expect(resolveConnectionCompatibility({ shape: 'unknown' }, round(12))).toEqual({
      resolution: 'transition',
      requiresAdapter: true,
    });
  });

  it('compares round vs round by equivalent diameter when diameter is absent', () => {
    const a: ConnectionProfile = { shape: 'round', equivalentDiameter: 12 };
    const b: ConnectionProfile = { shape: 'round', equivalentDiameter: 12 };
    expect(resolveConnectionCompatibility(a, b).resolution).toBe('direct');
  });

  it('falls back to reducer when same-shape sizes are missing/unequal', () => {
    expect(resolveConnectionCompatibility({ shape: 'round' }, { shape: 'round' }).resolution).toBe('reducer');
    expect(resolveConnectionCompatibility(rect(12, 8), rect(12, 10)).resolution).toBe('reducer');
  });

  it('isDirectlyConnectable mirrors a direct resolution', () => {
    expect(isDirectlyConnectable(round(12), round(12))).toBe(true);
    expect(isDirectlyConnectable(round(12), round(10))).toBe(false);
    expect(isDirectlyConnectable(round(12), rect(12, 8))).toBe(false);
  });
});
