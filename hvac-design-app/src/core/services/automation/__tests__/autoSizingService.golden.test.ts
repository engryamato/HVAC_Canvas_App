import { describe, expect, it } from 'vitest';
import { autoSizingService } from '../autoSizingService';
import { sizingGolden } from '../../calculations/__tests__/goldenFixtures';

describe('WS9 golden autoSizingService', () => {
  it('rounds 1000 CFM at 1500 FPM to the nearest standard round diameter', () => {
    expect(sizingGolden.sourceNote).toContain('STANDARD_ROUND_SIZES');

    // roundToStandardSizes is a private static method; bind `this` to the class
    // so its internal this.roundToNearestStandardRound call resolves.
    const roundToStandardSizes = (autoSizingService as unknown as {
      roundToStandardSizes: (
        size: { diameter?: number; width?: number; height?: number },
        shape: 'round' | 'rectangular'
      ) => { diameter?: number; width?: number; height?: number };
    }).roundToStandardSizes;

    const actual = roundToStandardSizes.call(
      autoSizingService,
      { diameter: sizingGolden.calculatedDiameterInches },
      'round'
    );

    expect(sizingGolden.calculatedDiameterInches).toBeCloseTo(11.055812783, 9);
    // AutoSizingService.STANDARD_ROUND_SIZES includes 11 and rounds to NEAREST,
    // so 11.0558 -> 11. NOTE: engineeringCalculations.suggestDuctSize uses a
    // different table (no 11) and rounds UP, returning 12 for the same input.
    // That divergence is tracked in docs/ductwork-program/WS9-engine-divergences.md.
    expect(actual.diameter).toBe(sizingGolden.nearestStandardDiameterInches);
  });
});
