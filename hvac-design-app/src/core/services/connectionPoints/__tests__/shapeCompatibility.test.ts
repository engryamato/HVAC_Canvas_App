import { describe, expect, it } from 'vitest';
import type { DuctRunShape } from '@/core/schema/duct-run.schema';
import { shapeCompatibility } from '../shapeCompatibility';

const SHAPES: DuctRunShape[] = ['rectangular', 'round', 'flat_oval', 'flexible'];

// `flexible` gates as `round`, so these are the equivalence classes.
function gating(shape: DuctRunShape): string {
  return shape === 'flexible' ? 'round' : shape;
}

describe('WS10 shapeCompatibility matrix (D9)', () => {
  it('returns direct for same-shape same-size and reducer for same-shape different-size', () => {
    expect(shapeCompatibility('rectangular', 'rectangular', true)).toBe('direct');
    expect(shapeCompatibility('rectangular', 'rectangular', false)).toBe('reducer');
    expect(shapeCompatibility('round', 'round', true)).toBe('direct');
    expect(shapeCompatibility('round', 'round', false)).toBe('reducer');
    expect(shapeCompatibility('flat_oval', 'flat_oval', true)).toBe('direct');
    expect(shapeCompatibility('flat_oval', 'flat_oval', false)).toBe('reducer');
  });

  it('treats flexible as round (direct/reducer, not transition)', () => {
    expect(shapeCompatibility('flexible', 'round', true)).toBe('direct');
    expect(shapeCompatibility('round', 'flexible', false)).toBe('reducer');
    expect(shapeCompatibility('flexible', 'flexible', true)).toBe('direct');
  });

  it('returns transition for every cross-shape pair regardless of size', () => {
    expect(shapeCompatibility('rectangular', 'round', true)).toBe('transition');
    expect(shapeCompatibility('rectangular', 'flat_oval', false)).toBe('transition');
    expect(shapeCompatibility('round', 'flat_oval', true)).toBe('transition');
    expect(shapeCompatibility('flexible', 'rectangular', true)).toBe('transition');
  });

  it('covers all 16 pairs × size-equal/diff and never returns blocked', () => {
    for (const from of SHAPES) {
      for (const to of SHAPES) {
        for (const sizeEqual of [true, false]) {
          const result = shapeCompatibility(from, to, sizeEqual);
          expect(['direct', 'reducer', 'transition']).toContain(result);

          if (gating(from) !== gating(to)) {
            expect(result).toBe('transition');
          } else {
            expect(result).toBe(sizeEqual ? 'direct' : 'reducer');
          }
        }
      }
    }
  });
});
