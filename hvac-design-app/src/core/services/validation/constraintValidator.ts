import { 
  ConstraintStatus, 
  ValidationSeverity,
  DuctEngineeringData,
  DuctProps 
} from '../../schema/duct.schema';
import { EngineeringLimits } from '../../schema/calculation-settings.schema';

/**
 * Get the system bucket for limits lookup based on systemType
 * Defaults to 'supply' when undefined
 */
function getSystemBucket(systemType?: DuctProps['systemType']): 'supply' | 'return' | 'exhaust' {
  if (systemType === 'return' || systemType === 'exhaust') {
    return systemType;
  }
  // Default to supply for undefined, 'supply', or 'outside_air'
  return 'supply';
}

/**
 * Constraint Validation Engine
 * 
 * Validates entities against engineering constraints and best practices.
 * Provides real-time validation feedback with severity levels and suggested fixes.
 */

export interface ValidationRule<T> {
  id: string;
  name: string;
  severity: ValidationSeverity;
  validate: (entity: T, limits: EngineeringLimits) => ValidationViolation | null;
}

export interface ValidationViolation {
  type: string;
  severity: ValidationSeverity;
  message: string;
  suggestedFix?: {
    property: string;
    value: number;
    sourceViolationType?: string;
    summary?: string;
  } | string;
}

export interface ValidationSuggestion {
  violationType: string;
  severity: ValidationSeverity;
  message: string;
  fix: {
    property: string;
    value: number;
    sourceViolationType?: string;
    summary?: string;
  };
}

function roundToInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value);
}

function clampAirflow(value: number): number {
  return Math.max(1, roundToInteger(value));
}

function createAirflowSuggestion(
  sourceViolationType: string,
  targetAirflow: number,
  summary: string
): NonNullable<Exclude<ValidationViolation['suggestedFix'], string>> {
  const value = clampAirflow(targetAirflow);
  return {
    property: 'airflow',
    value,
    sourceViolationType,
    summary,
  };
}

function getObjectFix(
  suggestedFix: ValidationViolation['suggestedFix']
): ValidationSuggestion['fix'] | null {
  if (!suggestedFix || typeof suggestedFix === 'string') {
    return null;
  }
  return suggestedFix;
}

export function generateDeterministicSuggestions(
  violations: ReadonlyArray<ValidationViolation>
): ValidationSuggestion[] {
  const withFix = violations
    .map((violation) => {
      const fix = getObjectFix(violation.suggestedFix);
      if (!fix) {
        return null;
      }

      return {
        violationType: violation.type,
        severity: violation.severity,
        message: violation.message,
        fix,
      } as ValidationSuggestion;
    })
    .filter((item): item is ValidationSuggestion => item !== null);

  return [...withFix].sort((a, b) => {
    const severityOrder: Record<ValidationSeverity, number> = {
      error: 0,
      warning: 1,
      info: 2,
    };

    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    if (a.violationType !== b.violationType) {
      return a.violationType.localeCompare(b.violationType);
    }

    if (a.fix.property !== b.fix.property) {
      return a.fix.property.localeCompare(b.fix.property);
    }

    if (a.fix.value !== b.fix.value) {
      return a.fix.value - b.fix.value;
    }

    return a.message.localeCompare(b.message);
  });
}

/**
 * Duct Validation Rules
 */
export class DuctValidator {
  private rules: ValidationRule<DuctEngineeringData>[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules() {
    this.addRule({
      id: 'velocity-max',
      name: 'Maximum Velocity',
      severity: 'error',
      validate: (data, limits) => {
        const systemType = (data as DuctEngineeringData & { systemType?: DuctProps['systemType'] }).systemType;
        const systemBucket = getSystemBucket(systemType);
        const maxVelocity = limits.maxVelocity[systemBucket];
        if (data.velocity > maxVelocity) {
          const suggestedAirflow = clampAirflow((maxVelocity / data.velocity) * data.airflow);
          return {
            type: 'velocity-max',
            severity: 'error',
            message: `Velocity ${data.velocity.toFixed(0)} FPM exceeds maximum ${maxVelocity} FPM for ${systemBucket} system`,
            suggestedFix: createAirflowSuggestion(
              'velocity-max',
              suggestedAirflow,
              `Set airflow to ${suggestedAirflow} CFM to target ${maxVelocity} FPM`
            ),
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'velocity-min',
      name: 'Minimum Velocity',
      severity: 'warning',
      validate: (data, limits) => {
        const systemType = (data as DuctEngineeringData & { systemType?: DuctProps['systemType'] }).systemType;
        const systemBucket = getSystemBucket(systemType);
        const minVelocity = limits.minVelocity[systemBucket];
        if (data.velocity > 0 && data.velocity < minVelocity) {
          const suggestedAirflow = clampAirflow((minVelocity / data.velocity) * data.airflow);
          return {
            type: 'velocity-min',
            severity: 'warning',
            message: `Velocity ${data.velocity.toFixed(0)} FPM is below minimum ${minVelocity} FPM for ${systemBucket} system`,
            suggestedFix: createAirflowSuggestion(
              'velocity-min',
              suggestedAirflow,
              `Set airflow to ${suggestedAirflow} CFM to target ${minVelocity} FPM`
            ),
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'pressure-drop-max',
      name: 'Maximum Pressure Drop',
      severity: 'error',
      validate: (data, limits) => {
        const systemType = (data as DuctEngineeringData & { systemType?: DuctProps['systemType'] }).systemType;
        const systemBucket = getSystemBucket(systemType);
        const maxPressure = limits.maxPressureDrop[systemBucket];
        if (data.pressureDrop > maxPressure) {
          const pressureRatio = maxPressure > 0 ? maxPressure / data.pressureDrop : 0;
          const suggestedAirflow = clampAirflow(data.airflow * pressureRatio);
          return {
            type: 'pressure-drop-max',
            severity: 'error',
            message: `Pressure drop ${data.pressureDrop.toFixed(3)} in.w.g./100ft exceeds maximum ${maxPressure} for ${systemBucket} system`,
            suggestedFix: createAirflowSuggestion(
              'pressure-drop-max',
              suggestedAirflow,
              `Set airflow to ${suggestedAirflow} CFM to reduce pressure drop`
            ),
          };
        }
        return null;
      },
    });

    // Airflow reasonableness
    this.addRule({
      id: 'airflow-zero',
      name: 'Zero Airflow',
      severity: 'error',
      validate: (data) => {
        if (data.airflow <= 0) {
          return {
            type: 'airflow-zero',
            severity: 'error',
            message: 'Airflow must be greater than zero',
            suggestedFix: createAirflowSuggestion('airflow-zero', 100, 'Set airflow to 100 CFM'),
          };
        }
        return null;
      },
    });

    // Velocity best practices
    this.addRule({
      id: 'velocity-optimal',
      name: 'Optimal Velocity Range',
      severity: 'info',
      validate: (data) => {
        const optimalMin = 1000;
        const optimalMax = 1800;
        if (data.velocity < optimalMin || data.velocity > optimalMax) {
          const targetVelocity = data.velocity < optimalMin ? optimalMin : optimalMax;
          const suggestedAirflow = data.velocity > 0
            ? clampAirflow((targetVelocity / data.velocity) * data.airflow)
            : data.airflow;
          return {
            type: 'velocity-optimal',
            severity: 'info',
            message: `Velocity ${data.velocity.toFixed(0)} FPM is outside optimal range (${optimalMin}-${optimalMax} FPM)`,
            suggestedFix: createAirflowSuggestion(
              'velocity-optimal',
              suggestedAirflow,
              `Set airflow to ${suggestedAirflow} CFM to target ${targetVelocity} FPM`
            ),
          };
        }
        return null;
      },
    });
  }

  addRule(rule: ValidationRule<DuctEngineeringData>) {
    this.rules.push(rule);
  }

  removeRule(ruleId: string) {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  validate(
    engineeringData: DuctEngineeringData,
    limits: EngineeringLimits
  ): ConstraintStatus {
    const violations: ValidationViolation[] = [];

    for (const rule of this.rules) {
      const violation = rule.validate(engineeringData, limits);
      if (violation) {
        violations.push(violation);
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'error').length === 0,
      violations: violations as unknown as ConstraintStatus['violations'],
      lastValidated: new Date(),
    };
  }

  /**
   * Get validation status with only errors (for critical checks)
   */
  validateCritical(
    engineeringData: DuctEngineeringData,
    limits: EngineeringLimits
  ): ConstraintStatus {
    const fullStatus = this.validate(engineeringData, limits);
    return {
      isValid: fullStatus.isValid,
      violations: fullStatus.violations.filter(v => v.severity === 'error'),
      lastValidated: fullStatus.lastValidated,
    };
  }
}

/**
 * Equipment Validation Rules
 */
export class EquipmentValidator {
  private rules: ValidationRule<any>[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules() {
    this.addRule({
      id: 'airflow-positive',
      name: 'Positive Airflow',
      severity: 'error',
      validate: (data) => {
        if (data.airflow <= 0) {
          return {
            type: 'airflow-positive',
            severity: 'error',
            message: 'Equipment airflow must be greater than zero',
            suggestedFix: 'Set a valid airflow capacity (CFM)',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'efficiency-range',
      name: 'Efficiency Range',
      severity: 'warning',
      validate: (data) => {
        if (data.efficiency !== undefined) {
          if (data.efficiency < 0 || data.efficiency > 100) {
            return {
              type: 'efficiency-range',
              severity: 'warning',
              message: 'Efficiency must be between 0-100%',
              suggestedFix: 'Enter a valid efficiency percentage',
            };
          }
        }
        return null;
      },
    });
  }

  addRule(rule: ValidationRule<any>) {
    this.rules.push(rule);
  }

  validate(engineeringData: any, limits: EngineeringLimits): ConstraintStatus {
    const violations: ValidationViolation[] = [];

    for (const rule of this.rules) {
      const violation = rule.validate(engineeringData, limits);
      if (violation) {
        violations.push(violation);
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'error').length === 0,
      violations: violations as unknown as ConstraintStatus['violations'],
      lastValidated: new Date(),
    };
  }
}

/**
 * Singleton validators
 */
export const ductValidator = new DuctValidator();
export const equipmentValidator = new EquipmentValidator();

/**
 * Validation helper functions
 */
export function hasErrors(status: ConstraintStatus): boolean {
  return !status.isValid;
}

export function hasWarnings(status: ConstraintStatus): boolean {
  return status.violations.some(v => v.severity === 'warning');
}

export function getErrorCount(status: ConstraintStatus): number {
  return status.violations.filter(v => v.severity === 'error').length;
}

export function getWarningCount(status: ConstraintStatus): number {
  return status.violations.filter(v => v.severity === 'warning').length;
}

export function getViolationsByType(
  status: ConstraintStatus,
  type: string
): ConstraintStatus['violations'] {
  return status.violations.filter((v) => v.type === type);
}
