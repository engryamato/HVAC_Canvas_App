/**
 * Velocity pressure (in.w.g.) using standard HVAC approximation.
 */
export function calculateVelocityPressure(velocityFpm: number): number {
  const vp = Math.pow(velocityFpm / 4005, 2);
  return round(vp, 2);
}

/**
 * Friction loss (in.w.g.) for given length using a simplified ASHRAE-based approximation.
 * - velocity in FPM
 * - diameter in inches (use equivalent diameter for rectangular)
 * - length in feet
 * - roughness in feet (defaults to galvanized)
 *
 * Returns total loss for the given length.
 */
export function calculateFrictionLoss(
  velocityFpm: number,
  diameterInches: number,
  lengthFeet: number,
  roughnessFeet = 0.0005
): number {
  if (velocityFpm <= 0 || diameterInches <= 0 || lengthFeet <= 0) {
    return 0;
  }

  // Base formula adapted from common duct friction charts (per 100 ft)
  const frictionPer100 =
    0.109136 *
    Math.pow(velocityFpm / 1000, 1.9) *
    Math.pow(12 / diameterInches, 1.22) *
    roughnessAdjustment(roughnessFeet);

  const friction = (frictionPer100 / 100) * lengthFeet;
  return round(friction, 2);
}

/**
 * Calculate fitting loss using friction per 100 ft and equivalent length (ft).
 */
export function calculateFittingLoss(frictionPer100: number, equivalentLengthFeet: number): number {
  if (frictionPer100 <= 0 || equivalentLengthFeet <= 0) {
    return 0;
  }
  const loss = (frictionPer100 / 100) * equivalentLengthFeet;
  return round(loss, 2);
}

/**
 * Equivalent round diameter (in) for rectangular ducts.
 * Formula: De = 1.30 * ((a*b)^0.625) / ((a+b)^0.25)
 */
export function calculateEquivalentDiameter(widthInches: number, heightInches: number): number {
  if (widthInches <= 0 || heightInches <= 0) {
    return 0;
  }
  const numerator = Math.pow(widthInches * heightInches, 0.625) * 1.3;
  const denominator = Math.pow(widthInches + heightInches, 0.25);
  return numerator / denominator;
}

function roughnessAdjustment(roughnessFeet: number): number {
  // Normalize against galvanized roughness (~0.0005 ft)
  const base = 0.0005;
  return Math.max(0.5, roughnessFeet / base);
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export default calculateVelocityPressure;
