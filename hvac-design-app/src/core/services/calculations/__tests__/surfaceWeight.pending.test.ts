import { describe, expect, it } from 'vitest';
import { engineeringCalculator } from '../engineeringCalculator';
import { getGaugeWeight } from '../gaugeWeightTable';
import { surfaceAreaGolden, weightGolden } from './goldenFixtures';

type PendingSurfaceWeightEngine = {
  calculateSurfaceArea?: (input: unknown) => number;
  calculateDuctWeight?: (input: unknown) => number;
};

const pendingEngine = engineeringCalculator as PendingSurfaceWeightEngine;

describe('WS9 pending golden surface area and weight', () => {
  it('calculates rectangular surface area from 2(W+H)L', () => {
    expect(surfaceAreaGolden.sourceNote).toContain('rect 2(W+H)L');
    expect(typeof pendingEngine.calculateSurfaceArea).toBe('function');

    const actual = pendingEngine.calculateSurfaceArea?.({
      shape: 'rectangular',
      widthFeet: surfaceAreaGolden.rectangular.widthFeet,
      heightFeet: surfaceAreaGolden.rectangular.heightFeet,
      lengthFeet: surfaceAreaGolden.rectangular.lengthFeet,
    });

    expect(actual).toBeCloseTo(surfaceAreaGolden.rectangular.expectedSquareFeet, 9);
  });

  it('calculates round surface area from piDL', () => {
    expect(typeof pendingEngine.calculateSurfaceArea).toBe('function');

    const actual = pendingEngine.calculateSurfaceArea?.({
      shape: 'round',
      diameterFeet: surfaceAreaGolden.round.diameterFeet,
      lengthFeet: surfaceAreaGolden.round.lengthFeet,
    });

    expect(actual).toBeCloseTo(surfaceAreaGolden.round.expectedSquareFeet, 9);
  });

  it('calculates flat-oval surface area from [pi*a + 2(A-a)]L', () => {
    expect(typeof pendingEngine.calculateSurfaceArea).toBe('function');

    const actual = pendingEngine.calculateSurfaceArea?.({
      shape: 'flat_oval',
      majorFeet: surfaceAreaGolden.flatOval.majorFeet,
      minorFeet: surfaceAreaGolden.flatOval.minorFeet,
      lengthFeet: surfaceAreaGolden.flatOval.lengthFeet,
    });

    expect(actual).toBeCloseTo(surfaceAreaGolden.flatOval.expectedSquareFeet, 9);
  });

  it('calculates flex surface area from piDL times 1.05', () => {
    expect(typeof pendingEngine.calculateSurfaceArea).toBe('function');

    const actual = pendingEngine.calculateSurfaceArea?.({
      shape: 'flexible',
      diameterFeet: surfaceAreaGolden.flex.diameterFeet,
      lengthFeet: surfaceAreaGolden.flex.lengthFeet,
    });

    expect(actual).toBeCloseTo(surfaceAreaGolden.flex.expectedSquareFeet, 9);
  });

  it('calculates fabricated duct weight from area, gauge table, and 15 percent seam allowance', () => {
    expect(weightGolden.sourceNote).toContain('1.15 seam allowance');
    expect(getGaugeWeight(weightGolden.gauge)).toMatchObject({
      nominalLbPerSquareFoot: weightGolden.nominalLbPerSquareFoot,
      fabricatedLbPerSquareFoot: weightGolden.nominalLbPerSquareFoot * weightGolden.seamFactor,
    });
    expect(typeof pendingEngine.calculateDuctWeight).toBe('function');

    const actual = pendingEngine.calculateDuctWeight?.({
      areaSquareFeet: weightGolden.rectangularAreaSquareFeet,
      gauge: weightGolden.gauge,
    });

    expect(actual).toBeCloseTo(weightGolden.expectedPounds, 9);
  });
});
