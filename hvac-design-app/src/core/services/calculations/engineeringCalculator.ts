import { EngineeringLimits } from '../../schema/calculation-settings.schema';
import { DuctEngineeringData } from '../../schema/duct.schema';

/**
 * Engineering Calculations Service
 * 
 * Performs HVAC engineering calculations for airflow, pressure drop,
 * velocity, and duct sizing based on industry standards (ASHRAE).
 */

export interface DuctSizingParams {
  airflow: number; // CFM
  shape: 'round' | 'rectangular';
  material: 'galvanized' | 'stainless' | 'flexible' | 'fiberglass';
  length: number; // feet
  
  // For round ducts
  diameter?: number; // inches
  
  // For rectangular ducts
  width?: number; // inches
  height?: number; // inches
}

export interface DuctCalculationResult {
  area: number; // sq in
  velocity: number; // FPM
  pressureDrop: number; // in.w.g./100ft
  friction: number; // friction factor
  equivalentDiameter?: number; // for rectangular ducts
  reynoldsNumber?: number;
}

/**
 * Engineering Calculations Engine
 */
export class EngineeringCalculator {
  /**
   * Calculate duct cross-sectional area
   */
  static calculateArea(params: DuctSizingParams): number {
    if (params.shape === 'round') {
      if (!params.diameter) throw new Error('Diameter required for round duct');
      const radius = params.diameter / 2;
      return Math.PI * radius * radius;
    } else {
      if (!params.width || !params.height) {
        throw new Error('Width and height required for rectangular duct');
      }
      return params.width * params.height;
    }
  }

  /**
   * Calculate air velocity (FPM)
   * velocity = (CFM / area) * 144 (convert sq ft to sq in)
   */
  static calculateVelocity(airflow: number, area: number): number {
    if (area <= 0) throw new Error('Area must be greater than zero');
    return (airflow / area) * 144;
  }

  /**
   * Calculate equivalent diameter for rectangular ducts
   * Using perimeter method: De = 1.30 * [(a*b)^0.625] / [(a+b)^0.25]
   */
  static calculateEquivalentDiameter(width: number, height: number): number {
    const numerator = Math.pow(width * height, 0.625);
    const denominator = Math.pow(width + height, 0.25);
    return 1.30 * (numerator / denominator);
  }

  /**
   * Get friction factor based on material type
   */
  static getFrictionFactor(
    material: string,
    limits: EngineeringLimits
  ): number {
    const factors = limits.frictionFactors;
    switch (material) {
      case 'galvanized':
        return factors.galvanized;
      case 'stainless':
        return factors.stainless;
      case 'flexible':
        return factors.flexible;
      case 'fiberglass':
        return factors.fiberglass;
      default:
        return factors.galvanized; // Default to galvanized
    }
  }

  /**
   * Calculate pressure drop using Darcy-Weisbach equation
   * ΔP = f * (L/D) * (ρ * V²) / 2
   * Simplified for HVAC: ΔP/100ft = (f * V²) / (2 * 4005 * D)
   */
  static calculatePressureDrop(
    velocity: number,
    diameter: number,
    friction: number
  ): number {
    if (diameter <= 0) throw new Error('Diameter must be greater than zero');
    
    // Simplified pressure drop formula for HVAC (in.w.g. per 100 ft)
    // This is an approximation based on standard air density
    return (friction * Math.pow(velocity, 2)) / (2 * 4005 * diameter);
  }

  /**
   * Calculate Reynolds number
   * Re = (V * D) / ν
   * where ν (kinematic viscosity) ≈ 0.0001568 ft²/s for air at standard conditions
   */
  static calculateReynoldsNumber(velocity: number, diameter: number): number {
    const kinematicViscosity = 0.0001568; // ft²/s for air at 70°F
    const velocityFtPerSec = velocity / 60; // Convert FPM to ft/s
    const diameterFt = diameter / 12; // Convert inches to feet
    
    return (velocityFtPerSec * diameterFt) / kinematicViscosity;
  }

  /**
   * Perform complete duct engineering calculations
   */
  static calculateDuct(
    params: DuctSizingParams,
    limits: EngineeringLimits
  ): DuctCalculationResult {
    // Calculate area
    const area = this.calculateArea(params);

    // Calculate velocity
    const velocity = this.calculateVelocity(params.airflow, area);

    // Get effective diameter for calculations
    let diameter: number;
    let equivalentDiameter: number | undefined;

    if (params.shape === 'round') {
      diameter = params.diameter!;
    } else {
      equivalentDiameter = this.calculateEquivalentDiameter(
        params.width!,
        params.height!
      );
      diameter = equivalentDiameter;
    }

    // Get friction factor
    const friction = this.getFrictionFactor(params.material, limits);

    // Calculate pressure drop
    const pressureDrop = this.calculatePressureDrop(velocity, diameter, friction);

    // Calculate Reynolds number
    const reynoldsNumber = this.calculateReynoldsNumber(velocity, diameter);

    return {
      area,
      velocity,
      pressureDrop,
      friction,
      equivalentDiameter,
      reynoldsNumber,
    };
  }

  /**
   * Auto-size duct to meet target velocity
   * Iteratively calculates duct size to achieve target velocity within tolerance
   */
  static autoSizeDuct(
    airflow: number,
    targetVelocity: number,
    shape: 'round' | 'rectangular',
    material: string,
    limits: EngineeringLimits,
    tolerance: number = 50 // FPM tolerance
  ): DuctSizingParams {
    if (shape === 'round') {
      // Calculate diameter from target velocity
      // area = CFM / (velocity / 144)
      // π * r² = area
      // r = sqrt(area / π)
      // d = 2 * r

      const targetArea = (airflow / targetVelocity) * 144;
      const radius = Math.sqrt(targetArea / Math.PI);
      const diameter = 2 * radius;

      // Round to nearest inch
      const roundedDiameter = Math.round(diameter);

      return {
        airflow,
        shape: 'round',
        material: material as any,
        length: 10, // Default length
        diameter: roundedDiameter,
      };
    } else {
      // For rectangular, use aspect ratio of 1.5:1 (width:height)
      const aspectRatio = 1.5;
      const targetArea = (airflow / targetVelocity) * 144;

      // area = width * height
      // width = aspectRatio * height
      // area = (aspectRatio * height) * height = aspectRatio * height²
      // height = sqrt(area / aspectRatio)

      const height = Math.sqrt(targetArea / aspectRatio);
      const width = height * aspectRatio;

      // Round to nearest inch, with minimums
      const roundedWidth = Math.max(4, Math.round(width));
      const roundedHeight = Math.max(4, Math.round(height));

      return {
        airflow,
        shape: 'rectangular',
        material: material as any,
        length: 10, // Default length
        width: roundedWidth,
        height: roundedHeight,
      };
    }
  }

  /**
   * Calculate fitting equivalent length
   * Based on ASHRAE fitting loss coefficients
   */
  static calculateFittingEquivalentLength(
    fittingType: string,
    diameter: number
  ): number {
    // Simplified equivalent length factors (in terms of pipe diameters)
    const equivalentLengthFactors: Record<string, number> = {
      elbow_90: 30,
      elbow_45: 16,
      tee: 60,
      reducer: 12,
      cap: 0,
    };

    const factor = equivalentLengthFactors[fittingType] || 0;
    return (factor * diameter) / 12; // Convert to feet
  }

  /**
   * Calculate total system pressure drop
   * Includes duct friction and fitting losses
   */
  static calculateSystemPressureDrop(
    ductLengths: number[], // Array of duct lengths (ft)
    ductPressureDrops: number[], // Array of pressure drops (in.w.g./100ft)
    fittingEquivalentLengths: number[] // Array of fitting equivalent lengths (ft)
  ): number {
    // Duct friction losses
    let totalDuctLoss = 0;
    for (let i = 0; i < ductLengths.length; i++) {
      totalDuctLoss += (ductLengths[i] / 100) * ductPressureDrops[i];
    }

    // Fitting losses (assuming same pressure drop as connected duct)
    let totalFittingLoss = 0;
    for (let i = 0; i < fittingEquivalentLengths.length; i++) {
      const ductIndex = Math.min(i, ductPressureDrops.length - 1);
      totalFittingLoss +=
        (fittingEquivalentLengths[i] / 100) * ductPressureDrops[ductIndex];
    }

    return totalDuctLoss + totalFittingLoss;
  }
}

/**
 * Export singleton instance
 */
export const engineeringCalculator = EngineeringCalculator;
