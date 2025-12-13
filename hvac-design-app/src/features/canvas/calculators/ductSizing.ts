import { calculateEquivalentDiameter as calcEqDiaInternal } from './pressureDrop';

export type DuctShape = 'round' | 'rectangular';

/**
 * Calculate duct area in square inches.
 */
export function calculateDuctArea(
  shape: DuctShape,
  dimensions: { diameter?: number; width?: number; height?: number }
): number {
  if (shape === 'round' && dimensions.diameter) {
    const radius = dimensions.diameter / 2;
    return round(Math.PI * radius * radius, 2);
  }

  if (shape === 'rectangular' && dimensions.width && dimensions.height) {
    return round(dimensions.width * dimensions.height, 2);
  }

  return 0;
}

/**
 * Calculate velocity in FPM from CFM and area (square inches).
 * Rounded to nearest 10 FPM.
 */
export function calculateVelocity(cfm: number, areaSqIn: number): number {
  if (areaSqIn <= 0) {
    return 0;
  }
  const areaSqFt = areaSqIn / 144;
  const velocity = cfm / areaSqFt;
  return roundToNearest(velocity, 10);
}

/**
 * Calculate round duct diameter (inches) given CFM and target velocity.
 */
export function calculateRoundDuctDiameter(cfm: number, velocityFpm: number): number {
  if (velocityFpm <= 0) {
    return 0;
  }
  const areaSqFt = cfm / velocityFpm;
  const areaSqIn = areaSqFt * 144;
  const diameter = Math.sqrt((4 * areaSqIn) / Math.PI);
  return round(diameter, 2);
}

/**
 * Calculate equivalent round diameter for a rectangular duct (inches).
 * Uses standard conversion formula.
 */
export function calculateEquivalentDiameter(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return 0;
  }
  return round(calcEqDiaInternal(width, height), 2);
}

function roundToNearest(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }
  return Math.round(value / step) * step;
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export default calculateDuctArea;
