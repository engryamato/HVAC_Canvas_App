import { describe, expect, it } from 'vitest';
import { EngineeringCalculator, FLEX_CORRUGATION_FACTOR } from '../engineeringCalculator';
import { getGaugeWeight } from '../gaugeWeightTable';
import { surfaceAreaGolden, weightGolden } from './goldenFixtures';

/**
 * WS6a-A1/A3 — duct surface area + weight, asserted against the WS9 golden
 * fixtures (the same truth values the `surfaceWeight.pending` golden checks, but
 * runnable in the default suite). Fitting developed-area (A2) is separate.
 */
describe('WS6a-A1 — duct surface area', () => {
  it('rectangular: 2(W+H)L', () => {
    const { rectangular: r } = surfaceAreaGolden;
    expect(
      EngineeringCalculator.calculateSurfaceArea({
        shape: 'rectangular',
        widthFeet: r.widthFeet,
        heightFeet: r.heightFeet,
        lengthFeet: r.lengthFeet,
      })
    ).toBeCloseTo(r.expectedSquareFeet, 9);
  });

  it('round: piDL', () => {
    const { round: r } = surfaceAreaGolden;
    expect(
      EngineeringCalculator.calculateSurfaceArea({ shape: 'round', diameterFeet: r.diameterFeet, lengthFeet: r.lengthFeet })
    ).toBeCloseTo(r.expectedSquareFeet, 9);
  });

  it('flat-oval: [pi*a + 2(A-a)]L', () => {
    const { flatOval: r } = surfaceAreaGolden;
    expect(
      EngineeringCalculator.calculateSurfaceArea({
        shape: 'flat_oval',
        majorFeet: r.majorFeet,
        minorFeet: r.minorFeet,
        lengthFeet: r.lengthFeet,
      })
    ).toBeCloseTo(r.expectedSquareFeet, 9);
  });

  it('flexible: piDL x 1.05 corrugation factor', () => {
    const { flex: r } = surfaceAreaGolden;
    expect(FLEX_CORRUGATION_FACTOR).toBe(1.05);
    expect(
      EngineeringCalculator.calculateSurfaceArea({ shape: 'flexible', diameterFeet: r.diameterFeet, lengthFeet: r.lengthFeet })
    ).toBeCloseTo(r.expectedSquareFeet, 9);
  });

  it('flat-oval is NOT the rectangular approximation', () => {
    const { flatOval: r } = surfaceAreaGolden;
    const oval = EngineeringCalculator.calculateSurfaceArea({
      shape: 'flat_oval',
      majorFeet: r.majorFeet,
      minorFeet: r.minorFeet,
      lengthFeet: r.lengthFeet,
    });
    // The rectangular 2(W+H)L approximation with W=major, H=minor differs.
    const rectApprox = 2 * (r.majorFeet + r.minorFeet) * r.lengthFeet;
    expect(oval).not.toBeCloseTo(rectApprox, 3);
  });
});

describe('WS6a-A3 — duct weight', () => {
  it('weight = area x fabricated gauge unit-weight (15% seam)', () => {
    const actual = EngineeringCalculator.calculateDuctWeight({
      areaSquareFeet: weightGolden.rectangularAreaSquareFeet,
      gauge: weightGolden.gauge,
    });
    expect(actual).toBeCloseTo(weightGolden.expectedPounds, 9);
    // Uses the fabricated (nominal x1.15) value from the ratified table.
    expect(actual).toBeCloseTo(
      weightGolden.rectangularAreaSquareFeet * getGaugeWeight(weightGolden.gauge).fabricatedLbPerSquareFoot,
      9
    );
  });

  it('scales linearly with area', () => {
    const single = EngineeringCalculator.calculateDuctWeight({ areaSquareFeet: 10, gauge: 24 });
    const double = EngineeringCalculator.calculateDuctWeight({ areaSquareFeet: 20, gauge: 24 });
    expect(double).toBeCloseTo(single * 2, 9);
  });
});
