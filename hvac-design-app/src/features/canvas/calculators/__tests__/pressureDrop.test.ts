import { describe, it, expect } from 'vitest';
import {
  calculateVelocityPressure,
  calculateFrictionLoss,
  calculateFittingLoss,
  calculateEquivalentDiameter,
} from '../pressureDrop';

describe('pressure drop calculations', () => {
  it('calculates velocity pressure', () => {
    expect(calculateVelocityPressure(2000)).toBeCloseTo(0.25, 2);
  });

  it('calculates friction loss for a duct run', () => {
    const loss = calculateFrictionLoss(1500, 12, 50);
    expect(loss).toBeGreaterThan(0);
    expect(loss).toBeLessThan(2);
  });

  it('calculates fitting loss', () => {
    expect(calculateFittingLoss(0.4, 30)).toBeCloseTo(0.12, 2);
  });

  it('calculates equivalent diameter for rectangular ducts', () => {
    const deq = calculateEquivalentDiameter(10, 6);
    expect(deq).toBeGreaterThan(7);
    expect(deq).toBeLessThan(10);
  });
});
