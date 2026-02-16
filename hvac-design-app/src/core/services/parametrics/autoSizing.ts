export interface SizingConstraints {
  maxVelocity: number;
  minVelocity: number;
  targetFriction: number;
}

export interface DuctSizingResult {
  diameter?: number;
  width?: number;
  height?: number;
  velocity: number;
  pressureDrop: number;
  equivalentDiameter: number;
}

export class AutoSizingService {
  calculateDuctSize(
    airflow: number,
    constraints: SizingConstraints,
    shape: 'round' | 'rectangular' = 'round',
    aspectRatio: number = 1.5
  ): DuctSizingResult {
    const area = this.calculateRequiredArea(airflow, constraints.maxVelocity);
    
    if (shape === 'round') {
      const diameter = Math.sqrt((4 * area) / Math.PI);
      const velocity = this.calculateVelocity(airflow, area);
      
      return {
        diameter,
        velocity,
        pressureDrop: this.calculatePressureDrop(velocity, diameter / 12),
        equivalentDiameter: diameter,
      };
    } else {
      const { width, height } = this.calculateRectangularDimensions(area, aspectRatio);
      const velocity = this.calculateVelocity(airflow, area);
      const eqDiameter = 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
      
      return {
        width,
        height,
        velocity,
        pressureDrop: this.calculatePressureDrop(velocity, eqDiameter / 12),
        equivalentDiameter: eqDiameter,
      };
    }
  }

  private calculateRequiredArea(airflow: number, maxVelocity: number): number {
    return airflow / maxVelocity;
  }

  private calculateVelocity(airflow: number, area: number): number {
    return area > 0 ? airflow / area : 0;
  }

  private calculatePressureDrop(velocity: number, diameterFt: number): number {
    const frictionFactor = 0.02;
    const airDensity = 0.075;
    return (frictionFactor * airDensity * Math.pow(velocity / 4005, 2)) / (diameterFt * 100);
  }

  private calculateRectangularDimensions(
    area: number,
    aspectRatio: number
  ): { width: number; height: number } {
    const height = Math.sqrt(area / aspectRatio);
    const width = height * aspectRatio;
    return { width, height };
  }

  validateSizing(result: DuctSizingResult, constraints: SizingConstraints): string[] {
    const issues: string[] = [];

    if (result.velocity > constraints.maxVelocity) {
      issues.push(`Velocity ${result.velocity.toFixed(0)} FPM exceeds maximum ${constraints.maxVelocity} FPM`);
    }

    if (result.velocity < constraints.minVelocity) {
      issues.push(`Velocity ${result.velocity.toFixed(0)} FPM is below minimum ${constraints.minVelocity} FPM`);
    }

    return issues;
  }
}

export const autoSizingService = new AutoSizingService();
