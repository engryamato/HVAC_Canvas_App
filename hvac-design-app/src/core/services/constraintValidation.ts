/**
 * Constraint Validation Service
 * 
 * checks entities against the rules defined in their active service.
 */
import { Service } from '../schema/service.schema';
import { EngineeringLimits } from '../schema/calculation-settings.schema';
import { DuctProps } from '../schema/duct.schema';
import { ConstraintViolation } from '../store/validationStore';
import {
  calculateFrictionFactor,
  calculatePressureDrop,
  calculateVelocity,
  getHydraulicDiameter,
} from './engineeringCalculations';

interface ValidationContext {
  engineeringLimits?: EngineeringLimits;
}

const DEFAULT_LIMITS: EngineeringLimits = {
  maxVelocity: {
    supply: 2500,
    return: 2000,
    exhaust: 2000,
  },
  minVelocity: {
    supply: 600,
    return: 500,
    exhaust: 500,
  },
  maxPressureDrop: {
    supply: 0.1,
    return: 0.08,
    exhaust: 0.08,
  },
  frictionFactors: {
    galvanized: 0.0005,
    stainless: 0.00015,
    flexible: 0.003,
    fiberglass: 0.0003,
  },
  standardConditions: {
    temperature: 70,
    pressure: 29.92,
    altitude: 0,
  },
};

function toSystemBucket(systemType?: DuctProps['systemType']): 'supply' | 'return' | 'exhaust' {
  if (systemType === 'return' || systemType === 'exhaust') {
    return systemType;
  }
  return 'supply';
}

function severityByExceedance(actual: number, maxAllowed: number): ConstraintViolation['severity'] {
  if (maxAllowed <= 0) {
    return 'warning';
  }
  return actual > maxAllowed * 1.25 ? 'blocker' : 'warning';
}

export class ConstraintValidationService {
  /**
   * Validates a duct against a service's dimensional constraints.
   */
  static validateDuct(props: DuctProps, service: Service, context?: ValidationContext): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const constraints = service.dimensionalConstraints;
    const limits = context?.engineeringLimits ?? DEFAULT_LIMITS;
    const systemBucket = toSystemBucket(props.systemType);

    // 1. Shape check
    const allowedShapes = constraints.allowedShapes;
    if (!allowedShapes.includes(props.shape)) {
      violations.push({
        ruleId: 'shape-not-allowed',
        message: `Shape '${props.shape}' is not allowed by service '${service.name}'. Allowed: ${allowedShapes.join(', ')}`,
        severity: 'blocker'
      });
      // If shape is wrong, dimensions likely won't make sense to check against specifics, 
      // but we'll check what we can.
    }

    // 2. Material check (if service enforces it strictly)
    if (props.material !== service.material) {
        violations.push({
            ruleId: 'material-mismatch',
            message: `Material '${props.material}' does not match service spec '${service.material}'`,
            severity: 'warning' // Warning because maybe they really want to override
        });
    }

    // 3. Dimensional checks
    if (props.shape === 'round' && props.diameter !== undefined) {
      if (constraints.minDiameter !== undefined && props.diameter < constraints.minDiameter) {
        violations.push({
          ruleId: 'min-diameter',
          message: `Diameter ${props.diameter}" is below minimum ${constraints.minDiameter}"`,
          severity: 'warning'
        });
      }
      if (constraints.maxDiameter !== undefined && props.diameter > constraints.maxDiameter) {
        violations.push({
          ruleId: 'max-diameter',
          message: `Diameter ${props.diameter}" exceeds maximum ${constraints.maxDiameter}"`,
          severity: 'warning'
        });
      }
    } else if (props.shape === 'rectangular' && props.width !== undefined && props.height !== undefined) {
      if (constraints.minWidth !== undefined && props.width < constraints.minWidth) {
        violations.push({
          ruleId: 'min-width',
          message: `Width ${props.width}" is below minimum ${constraints.minWidth}"`,
          severity: 'warning'
        });
      }
      if (constraints.maxWidth !== undefined && props.width > constraints.maxWidth) {
        violations.push({
          ruleId: 'max-width',
          message: `Width ${props.width}" exceeds maximum ${constraints.maxWidth}"`,
          severity: 'warning'
        });
      }
      if (constraints.minHeight !== undefined && props.height < constraints.minHeight) {
        violations.push({
          ruleId: 'min-height',
          message: `Height ${props.height}" is below minimum ${constraints.minHeight}"`,
          severity: 'warning'
        });
      }
      if (constraints.maxHeight !== undefined && props.height > constraints.maxHeight) {
        violations.push({
          ruleId: 'max-height',
          message: `Height ${props.height}" exceeds maximum ${constraints.maxHeight}"`,
          severity: 'warning'
        });
      }
    }

    // 4. Engineering checks (velocity and pressure drop)
    const velocity = calculateVelocity(props.airflow, {
      shape: props.shape,
      diameter: props.diameter,
      width: props.width,
      height: props.height,
    });
    const hydraulicDiameter = getHydraulicDiameter(props);
    const frictionFactor = calculateFrictionFactor(props.material, velocity);
    const pressureDrop = calculatePressureDrop(props.length, velocity, frictionFactor, hydraulicDiameter);

    const maxVelocity = limits.maxVelocity[systemBucket];
    const minVelocity = limits.minVelocity[systemBucket];
    const maxPressureDrop = limits.maxPressureDrop[systemBucket];

    if (velocity > maxVelocity) {
      violations.push({
        ruleId: 'max-velocity',
        type: 'velocity',
        message: `Velocity ${Math.round(velocity)} FPM exceeds ${maxVelocity} FPM for ${systemBucket} systems`,
        severity: severityByExceedance(velocity, maxVelocity),
        suggestedFix: 'Increase duct size or reduce airflow on this run.',
      });
    }

    if (velocity > 0 && velocity < minVelocity) {
      violations.push({
        ruleId: 'min-velocity',
        type: 'velocity',
        message: `Velocity ${Math.round(velocity)} FPM is below recommended ${minVelocity} FPM for ${systemBucket} systems`,
        severity: 'warning',
        suggestedFix: 'Reduce duct size or increase airflow.',
      });
    }

    if (pressureDrop > maxPressureDrop) {
      violations.push({
        ruleId: 'max-pressure-drop',
        type: 'pressure',
        message: `Pressure drop ${pressureDrop.toFixed(3)} in.w.g. exceeds ${maxPressureDrop.toFixed(3)} in.w.g.`,
        severity: severityByExceedance(pressureDrop, maxPressureDrop),
        suggestedFix: 'Shorten run, increase duct size, or switch to lower-friction material.',
      });
    }

    return violations;
  }

  /**
   * Checks if a proposed dimension is valid (for realtime UI feedback)
   */
  static isValidDimension(
    dimension: number, 
    type: 'diameter' | 'width' | 'height', 
    service: Service
  ): { valid: boolean; message?: string } {
    const c = service.dimensionalConstraints;
    
    switch (type) {
      case 'diameter':
        if (c.minDiameter !== undefined && dimension < c.minDiameter) return { valid: false, message: `Min ${c.minDiameter}"` };
        if (c.maxDiameter !== undefined && dimension > c.maxDiameter) return { valid: false, message: `Max ${c.maxDiameter}"` };
        break;
      case 'width':
        if (c.minWidth !== undefined && dimension < c.minWidth) return { valid: false, message: `Min ${c.minWidth}"` };
        if (c.maxWidth !== undefined && dimension > c.maxWidth) return { valid: false, message: `Max ${c.maxWidth}"` };
        break;
      case 'height':
        if (c.minHeight !== undefined && dimension < c.minHeight) return { valid: false, message: `Min ${c.minHeight}"` };
        if (c.maxHeight !== undefined && dimension > c.maxHeight) return { valid: false, message: `Max ${c.maxHeight}"` };
        break;
    }

    return { valid: true };
  }
}
