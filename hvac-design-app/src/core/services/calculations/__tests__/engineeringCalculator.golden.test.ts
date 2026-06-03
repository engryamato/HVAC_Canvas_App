import { describe, expect, it } from 'vitest';
import { engineeringCalculator } from '../engineeringCalculator';
import { pressureDropGolden, velocityGolden } from './goldenFixtures';

describe('WS9 golden engineeringCalculator', () => {
  it('calculates round duct velocity from continuity', () => {
    expect(velocityGolden.sourceNote).toContain('Continuity');

    const actual = engineeringCalculator.calculateVelocity(
      velocityGolden.airflowCfm,
      velocityGolden.areaSquareInches
    );

    expect(actual).toBeCloseTo(velocityGolden.expectedFpm, 9);
  });

  it('calculates pressure drop using the documented Darcy-Weisbach approximation', () => {
    expect(pressureDropGolden.sourceNote).toContain('Darcy-Weisbach');

    const actual = engineeringCalculator.calculatePressureDrop(
      pressureDropGolden.velocityFpm,
      pressureDropGolden.diameterInches,
      pressureDropGolden.frictionFactor
    );

    expect(actual).toBeCloseTo(pressureDropGolden.expectedInWgPer100Ft, 12);
  });
});
