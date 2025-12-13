import { describe, it, expect } from 'vitest';
import {
  calculateDuctArea,
  calculateVelocity,
  calculateRoundDuctDiameter,
  calculateEquivalentDiameter,
} from '../ductSizing';

describe('duct sizing calculations', () => {
  it('calculates round and rectangular areas', () => {
    expect(calculateDuctArea('round', { diameter: 6 })).toBeCloseTo(28.27, 2);
    expect(calculateDuctArea('rectangular', { width: 12, height: 8 })).toBeCloseTo(96, 2);
  });

  it('calculates velocity and rounds to nearest 10', () => {
    const areaSqIn = calculateDuctArea('round', { diameter: 6 }); // ~28.27 sqin
    const velocity = calculateVelocity(500, areaSqIn);
    expect(velocity).toBeCloseTo(2550, 0);
    expect(velocity % 10).toBe(0);
  });

  it('calculates round duct diameter from CFM and velocity', () => {
    const diameter = calculateRoundDuctDiameter(1000, 1200);
    expect(diameter).toBeGreaterThan(10);
    expect(diameter).toBeLessThan(14);
  });

  it('calculates equivalent diameter for rectangular duct', () => {
    const deq = calculateEquivalentDiameter(12, 8);
    expect(deq).toBeGreaterThan(9);
    expect(deq).toBeLessThan(12);
  });
});
