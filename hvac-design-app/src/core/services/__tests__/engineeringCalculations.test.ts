import { describe, expect, it } from 'vitest';
import {
  calculateCrossSectionAreaSqFt,
  calculateEquivalentDiameter,
  calculateFrictionFactor,
  calculatePressureDrop,
  calculateVelocity,
  getHydraulicDiameter,
  suggestDuctSize,
} from '../engineeringCalculations';

describe('engineeringCalculations', () => {
  it('calculates round duct velocity', () => {
    const velocity = calculateVelocity(1000, { shape: 'round', diameter: 12 });
    expect(velocity).toBeGreaterThan(1200);
    expect(velocity).toBeLessThan(1300);
  });

  it('calculates rectangular equivalent diameter', () => {
    const de = calculateEquivalentDiameter(24, 12);
    expect(de).toBeGreaterThan(15);
    expect(de).toBeLessThan(20);
  });

  it('calculates positive pressure drop for valid inputs', () => {
    const pressureDrop = calculatePressureDrop(20, 1400, 0.0005, 12);
    expect(pressureDrop).toBeGreaterThan(0);
  });

  it('returns zero pressure drop for invalid inputs', () => {
    const pressureDrop = calculatePressureDrop(0, 1400, 0.0005, 12);
    expect(pressureDrop).toBe(0);
  });

  it('scales friction factor for flex duct at high velocity', () => {
    const low = calculateFrictionFactor('flex', 800);
    const high = calculateFrictionFactor('flex', 2400);
    expect(high).toBeGreaterThan(low);
  });

  it('suggests larger duct size for higher airflow at same velocity target', () => {
    const lowAirflowSize = suggestDuctSize(800, 1200);
    const highAirflowSize = suggestDuctSize(2400, 1200);
    expect(highAirflowSize).toBeGreaterThanOrEqual(lowAirflowSize);
  });

  it('gets hydraulic diameter for rectangular ducts', () => {
    const hydraulicDiameter = getHydraulicDiameter({
      shape: 'rectangular',
      width: 20,
      height: 10,
    });
    expect(hydraulicDiameter).toBeGreaterThan(10);
  });

  it('calculates area in square feet', () => {
    const area = calculateCrossSectionAreaSqFt({ shape: 'round', diameter: 12 });
    expect(area).toBeCloseTo(0.785, 2);
  });
});

