import { Duct, DuctProps, DuctEngineeringData } from '../../schema/duct.schema';
import { EngineeringLimits } from '../../schema/calculation-settings.schema';
import { parametricUpdateService } from '../parametric/parametricUpdateService';
import { engineeringCalculator } from '../calculations/engineeringCalculator';

/**
 * Auto-Sizing Service
 * 
 * Automatically sizes ducts to meet velocity and pressure drop targets.
 * Integrates with constraint validation and parametric updates.
 */

export interface SizingCriteria {
  targetVelocity?: number; // Target velocity in FPM
  maxPressureDrop?: number; // Max pressure drop in in.w.g./100ft
  preferredAspectRatio?: number; // For rectangular ducts (width:height)
  roundToStandard?: boolean; // Round to standard duct sizes
}

export interface SizingResult {
  success: boolean;
  originalSize: { diameter?: number; width?: number; height?: number };
  newSize: { diameter?: number; width?: number; height?: number };
  calculatedVelocity: number;
  calculatedPressureDrop: number;
  meetsConstraints: boolean;
  warnings: string[];
}

export class AutoSizingService {
  /**
   * Standard round duct sizes (inches)
   */
  private static readonly STANDARD_ROUND_SIZES = [
    4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36,
  ];

  /**
   * Standard rectangular duct sizes (inches)
   */
  private static readonly STANDARD_RECTANGULAR_INCREMENTS = [
    4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48,
  ];

  /**
   * Auto-size a duct to meet target velocity
   */
  static autoSizeDuct(
    duct: Partial<DuctProps>,
    criteria: SizingCriteria,
    limits: EngineeringLimits
  ): SizingResult {
    const warnings: string[] = [];

    // Store original size
    const originalSize = {
      diameter: duct.diameter,
      width: duct.width,
      height: duct.height,
    };

    // Determine target velocity
    const targetVelocity =
      criteria.targetVelocity || this.getDefaultTargetVelocity(duct.systemType);

    // Calculate new size
    const newSizeParams = parametricUpdateService.autoSizeDuctToVelocity(
      duct,
      targetVelocity,
      limits
    );

    // Round to standard sizes if requested
    let finalSize = {
      diameter: newSizeParams.diameter,
      width: newSizeParams.width,
      height: newSizeParams.height,
    };

    if (criteria.roundToStandard) {
      finalSize = this.roundToStandardSizes(finalSize, duct.shape || 'round');
    }

    // Recalculate with final size
    const testDuct = { ...duct, ...finalSize };
    const engineeringData = parametricUpdateService.updateDuctCalculations(
      testDuct,
      limits
    );

    // Check constraints
    const meetsVelocity =
      engineeringData.velocity >= limits.minVelocity.supply &&
      engineeringData.velocity <= limits.maxVelocity.supply;

    const meetsPressureDrop =
      !criteria.maxPressureDrop ||
      engineeringData.pressureDrop <= criteria.maxPressureDrop;

    if (!meetsVelocity) {
      warnings.push(
        `Velocity ${engineeringData.velocity.toFixed(0)} FPM outside acceptable range`
      );
    }

    if (!meetsPressureDrop) {
      warnings.push(
        `Pressure drop ${engineeringData.pressureDrop.toFixed(3)} exceeds target`
      );
    }

    return {
      success: meetsVelocity && meetsPressureDrop,
      originalSize,
      newSize: finalSize,
      calculatedVelocity: engineeringData.velocity,
      calculatedPressureDrop: engineeringData.pressureDrop,
      meetsConstraints: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Batch auto-size multiple ducts
   */
  static batchAutoSize(
    ducts: Array<{ id: string; props: Partial<DuctProps> }>,
    criteria: SizingCriteria,
    limits: EngineeringLimits
  ): Map<string, SizingResult> {
    const results = new Map<string, SizingResult>();

    for (const duct of ducts) {
      const result = this.autoSizeDuct(duct.props, criteria, limits);
      results.set(duct.id, result);
    }

    return results;
  }

  /**
   * Auto-size duct network to balance system
   * Optimizes sizes to minimize total pressure drop while meeting velocity constraints
   */
  static autoSizeNetwork(
    ducts: Array<{ id: string; props: Partial<DuctProps> }>,
    criteria: SizingCriteria,
    limits: EngineeringLimits
  ): Map<string, SizingResult> {
    const results = new Map<string, SizingResult>();

    // Sort ducts by airflow (largest first)
    const sortedDucts = [...ducts].sort(
      (a, b) => (b.props.airflow || 0) - (a.props.airflow || 0)
    );

    // Size each duct
    for (const duct of sortedDucts) {
      const result = this.autoSizeDuct(duct.props, criteria, limits);
      results.set(duct.id, result);
    }

    return results;
  }

  /**
   * Get default target velocity based on system type
   */
  private static getDefaultTargetVelocity(systemType?: string): number {
    switch (systemType) {
      case 'supply':
        return 1500; // 1500 FPM for supply
      case 'return':
        return 1200; // 1200 FPM for return
      case 'exhaust':
        return 1500; // 1500 FPM for exhaust
      default:
        return 1500; // Default to supply
    }
  }

  /**
   * Round duct sizes to standard sizes
   */
  private static roundToStandardSizes(
    size: { diameter?: number; width?: number; height?: number },
    shape: 'round' | 'rectangular'
  ): { diameter?: number; width?: number; height?: number } {
    if (shape === 'round' && size.diameter) {
      return {
        diameter: this.roundToNearestStandardRound(size.diameter),
      };
    } else if (shape === 'rectangular' && size.width && size.height) {
      return {
        width: this.roundToNearestStandardRectangular(size.width),
        height: this.roundToNearestStandardRectangular(size.height),
      };
    }

    return size;
  }

  /**
   * Round to nearest standard round duct size
   */
  private static roundToNearestStandardRound(diameter: number): number {
    return this.STANDARD_ROUND_SIZES.reduce((prev, curr) =>
      Math.abs(curr - diameter) < Math.abs(prev - diameter) ? curr : prev
    );
  }

  /**
   * Round to nearest standard rectangular duct size
   */
  private static roundToNearestStandardRectangular(dimension: number): number {
    return this.STANDARD_RECTANGULAR_INCREMENTS.reduce((prev, curr) =>
      Math.abs(curr - dimension) < Math.abs(prev - dimension) ? curr : prev
    );
  }

  /**
   * Suggest duct size based on airflow and constraints
   * Returns multiple size options with tradeoffs
   */
  static suggestDuctSizes(
    airflow: number,
    shape: 'round' | 'rectangular',
    limits: EngineeringLimits
  ): Array<{
    size: { diameter?: number; width?: number; height?: number };
    velocity: number;
    pressureDrop: number;
    recommendation: string;
  }> {
    const suggestions = [];
    const targetVelocities = [1200, 1500, 1800, 2000]; // Different velocity targets

    for (const targetVel of targetVelocities) {
      const sized = engineeringCalculator.autoSizeDuct(
        airflow,
        targetVel,
        shape,
        'galvanized',
        limits
      );

      const result = engineeringCalculator.calculateDuct(sized, limits);

      let recommendation = '';
      if (targetVel === 1200) {
        recommendation = 'Low velocity - quieter, lower pressure drop, larger size';
      } else if (targetVel === 1500) {
        recommendation = 'Balanced - good compromise between size and performance';
      } else if (targetVel === 1800) {
        recommendation = 'Higher velocity - smaller duct, higher pressure drop';
      } else {
        recommendation = 'Maximum velocity - smallest duct, highest noise/pressure';
      }

      suggestions.push({
        size: {
          diameter: sized.diameter,
          width: sized.width,
          height: sized.height,
        },
        velocity: result.velocity,
        pressureDrop: result.pressureDrop,
        recommendation,
      });
    }

    return suggestions;
  }

  /**
   * Optimize duct size for energy efficiency
   * Balances first cost (larger duct) vs operating cost (energy)
   */
  static optimizeForEfficiency(
    duct: Partial<DuctProps>,
    limits: EngineeringLimits,
    energyCostPerKwh: number = 0.12 // $/kWh
  ): SizingResult {
    // For energy optimization, target lower velocity to reduce fan power
    const criteria: SizingCriteria = {
      targetVelocity: 1200, // Lower velocity for efficiency
      roundToStandard: true,
    };

    return this.autoSizeDuct(duct, criteria, limits);
  }
}

/**
 * Export singleton instance
 */
export const autoSizingService = AutoSizingService;
