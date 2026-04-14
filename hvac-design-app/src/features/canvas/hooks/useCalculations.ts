import { useEffect, useRef } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import type { Duct, Entity, Equipment, Fitting, Room } from '@/core/schema';
import { calculateRoomValues } from '../calculators/ventilation';
import { calculateEquivalentDiameter } from '../calculators/ductSizing';
import type { EngineResolution } from '@/core/services/calculations/CalculationEngineRegistry';
import {
  type DuctCalculationRuntime,
  calculateDuctRuntime,
  calculateEquipmentRuntime,
  calculateFittingRuntime,
} from '@/core/services/calculations/entityCalculationRuntime';

const VELOCITY_LIMITS = {
  residential: { min: 600, max: 900 },
  commercial: { min: 1000, max: 1500 },
  industrial: { min: 1500, max: 2500 },
  kitchen_exhaust: { min: 1500, max: 4000 },
} as const;

type VelocityProfile = keyof typeof VELOCITY_LIMITS;

/**
 * Hook to recalculate entity derived values when props change.
 * Debounces updates to avoid thrashing during rapid edits.
 */
export function useCalculations(profile: VelocityProfile = 'commercial') {
  const entities = useEntityStore((state) =>
    state.allIds.map((id) => state.byId[id]).filter((entity): entity is NonNullable<typeof entity> => Boolean(entity))
  );
  const updateEntity = useEntityStore((state) => state.updateEntity);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(() => {
      const entitiesById = Object.fromEntries(entities.map((entity) => [entity.id, entity]));

      entities.forEach((entity) => {
        if (entity.type === 'room') {
          const nextCalc = calculateRoomValues(entity as Room);
          if (roomChanged(entity.calculated, nextCalc)) {
            updateEntity(
              entity.id,
              {
                calculated: nextCalc,
                modifiedAt: new Date().toISOString(),
              } as Partial<Room> as Partial<Entity>
            );
          }
          return;
        }

        if (entity.type === 'duct') {
          syncDuctCalculation(entity as Duct, updateEntity, profile);
          return;
        }

        if (entity.type === 'fitting') {
          syncFittingCalculation(entity as Fitting, entitiesById, updateEntity);
          return;
        }

        if (entity.type === 'equipment') {
          syncEquipmentCalculation(entity as Equipment, entitiesById, updateEntity);
        }
      });
    }, 300);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [entities, updateEntity, profile]);
}

function roomChanged(a: Room['calculated'], b: Room['calculated']): boolean {
  return a.area !== b.area || a.volume !== b.volume || a.requiredCFM !== b.requiredCFM;
}

function syncDuctCalculation(
  duct: Duct,
  updateEntity: (id: string, updates: Partial<Entity>) => void,
  profile: VelocityProfile
): void {
  const calculation = calculateDuct(duct);
  const nextVelocityWarning = buildVelocityWarning(calculation.calculated.velocity, profile);
  const nextEngineWarning = buildEngineComplianceWarning(calculation.complianceWarnings);
  const nextWarnings = mergeWarnings(nextVelocityWarning, nextEngineWarning);
  const nextEngineeringData = buildEngineeringData(duct, calculation.calculated);
  const nextConstraintStatus = buildConstraintStatus(nextVelocityWarning, nextEngineWarning);

  const changed =
    duct.calculated.area !== calculation.calculated.area ||
    duct.calculated.velocity !== calculation.calculated.velocity ||
    duct.calculated.frictionLoss !== calculation.calculated.frictionLoss ||
    ductEngineeringDataKey(duct.props.engineeringData) !== ductEngineeringDataKey(nextEngineeringData) ||
    constraintStatusKey(duct.props.constraintStatus) !== constraintStatusKey(nextConstraintStatus) ||
    (duct.warnings?.velocity ?? '') !== (nextWarnings?.velocity ?? '') ||
    warningListKey(duct.warnings?.constraintViolations) !== warningListKey(nextWarnings?.constraintViolations);

  if (!changed) {
    return;
  }

  updateEntity(
    duct.id,
    {
      calculated: calculation.calculated,
      warnings: nextWarnings,
      props: {
        ...duct.props,
        engineeringData: nextEngineeringData,
        constraintStatus: nextConstraintStatus,
      },
      modifiedAt: new Date().toISOString(),
    } as Partial<Duct> as Partial<Entity>
  );
}

function syncFittingCalculation(
  fitting: Fitting,
  entitiesById: Record<string, Entity>,
  updateEntity: (id: string, updates: Partial<Entity>) => void
): void {
  const calculation = calculateFittingRuntime(fitting, entitiesById);
  const nextWarnings = buildEngineComplianceWarning(calculation.complianceWarnings);
  const nextConstraintStatus = buildConstraintStatusFromMessages(calculation.complianceWarnings);

  const changed =
    fitting.calculated.equivalentLength !== calculation.calculated.equivalentLength ||
    fitting.calculated.pressureLoss !== calculation.calculated.pressureLoss ||
    constraintStatusKey(fitting.props.constraintStatus) !== constraintStatusKey(nextConstraintStatus) ||
    warningListKey(fitting.warnings?.constraintViolations) !== warningListKey(nextWarnings?.constraintViolations);

  if (!changed) {
    return;
  }

  updateEntity(
    fitting.id,
    {
      calculated: calculation.calculated,
      warnings: nextWarnings,
      props: {
        ...fitting.props,
        constraintStatus: nextConstraintStatus,
      },
      modifiedAt: new Date().toISOString(),
    } as Partial<Fitting> as Partial<Entity>
  );
}

function syncEquipmentCalculation(
  equipment: Equipment,
  entitiesById: Record<string, Entity>,
  updateEntity: (id: string, updates: Partial<Entity>) => void
): void {
  const calculation = calculateEquipmentRuntime(equipment, entitiesById);
  const nextWarnings = buildEngineComplianceWarning(calculation.complianceWarnings);
  const nextConstraintStatus = buildConstraintStatusFromMessages(calculation.complianceWarnings);
  const nextProps: Equipment['props'] = {
    ...equipment.props,
    engineeringData: calculation.engineeringData,
    constraintStatus: nextConstraintStatus,
    ...(typeof calculation.loadRating === 'number' &&
    ('loadRating' in equipment.props || equipment.props.engineeringSystem === 'universal')
      ? { loadRating: calculation.loadRating }
      : {}),
  };

  const currentLoadRating = 'loadRating' in equipment.props ? equipment.props.loadRating : undefined;
  const changed =
    equipmentEngineeringDataKey(equipment.props.engineeringData) !==
      equipmentEngineeringDataKey(calculation.engineeringData) ||
    constraintStatusKey(equipment.props.constraintStatus) !== constraintStatusKey(nextConstraintStatus) ||
    warningListKey(equipment.warnings?.constraintViolations) !== warningListKey(nextWarnings?.constraintViolations) ||
    (currentLoadRating ?? null) !== (calculation.loadRating ?? null);

  if (!changed) {
    return;
  }

  updateEntity(
    equipment.id,
    {
      warnings: nextWarnings,
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    } as Partial<Equipment> as Partial<Entity>
  );
}

export interface DuctCalculationResolution {
  calculated: Duct['calculated'];
  engine: EngineResolution;
  complianceWarnings: string[];
}

export function calculateDuct(duct: Duct): DuctCalculationResolution {
  const runtime: DuctCalculationRuntime = calculateDuctRuntime(duct);

  return {
    calculated: runtime.calculated,
    engine: runtime.engine,
    complianceWarnings: runtime.complianceWarnings,
  };
}

export function buildEngineeringData(
  duct: Duct,
  calculated: Duct['calculated']
): NonNullable<Duct['props']['engineeringData']> {
  return {
    airflow: duct.props.airflow,
    velocity: calculated.velocity,
    pressureDrop: calculated.frictionLoss,
    friction: calculated.frictionLoss,
    equivalentDiameter:
      duct.props.shape === 'round'
        ? duct.props.diameter
        : calculateEquivalentDiameter(duct.props.width ?? 0, duct.props.height ?? 0),
  };
}

export function buildConstraintStatus(
  velocityWarning: Duct['warnings'] | undefined,
  engineWarning: Duct['warnings'] | undefined
): NonNullable<Duct['props']['constraintStatus']> {
  const violations = [
    ...(velocityWarning?.velocity
      ? [
          {
            type: 'velocity',
            severity: 'warning' as const,
            message: velocityWarning.velocity,
          },
        ]
      : []),
    ...(velocityWarning?.constraintViolations?.map((message) => ({
      type: 'velocity',
      severity: 'warning' as const,
      message,
    })) ?? []),
    ...(engineWarning?.constraintViolations?.map((message) => ({
      type: 'engine-dispatch',
      severity: 'warning' as const,
      message,
    })) ?? []),
  ];

  return {
    isValid: violations.length === 0,
    violations,
    lastValidated: new Date(),
  };
}

export function buildEngineDispatchWarning(engine: EngineResolution): Duct['warnings'] | undefined {
  if (engine.supported) {
    return undefined;
  }

  return {
    constraintViolations: [
      `No registered calculation engine for ${engine.label}. Using generic duct calculations.`,
    ],
  };
}

export function buildEngineComplianceWarning(warnings: string[]): Duct['warnings'] | undefined {
  if (warnings.length === 0) {
    return undefined;
  }

  return {
    constraintViolations: warnings,
  };
}

function buildConstraintStatusFromMessages(
  messages: string[]
): NonNullable<Duct['props']['constraintStatus']> {
  return {
    isValid: messages.length === 0,
    violations: messages.map((message) => ({
      type: 'engine-dispatch',
      severity: 'warning' as const,
      message,
    })),
    lastValidated: new Date(),
  };
}

function mergeWarnings(
  primary: Duct['warnings'] | undefined,
  secondary: Duct['warnings'] | undefined
): Duct['warnings'] | undefined {
  const velocity = primary?.velocity ?? secondary?.velocity;
  const constraintViolations = [
    ...(primary?.constraintViolations ?? []),
    ...(secondary?.constraintViolations ?? []),
  ];

  if (!velocity && constraintViolations.length === 0) {
    return undefined;
  }

  return {
    ...(velocity ? { velocity } : {}),
    ...(constraintViolations.length > 0 ? { constraintViolations } : {}),
  };
}

function warningListKey(warnings: readonly string[] | undefined): string {
  return warnings?.join('|') ?? '';
}

function ductEngineeringDataKey(
  engineeringData: Duct['props']['engineeringData'] | undefined
): string {
  if (!engineeringData) {
    return '';
  }

  return [
    engineeringData.airflow,
    engineeringData.velocity,
    engineeringData.pressureDrop,
    engineeringData.friction,
    engineeringData.equivalentDiameter ?? '',
    engineeringData.reynoldsNumber ?? '',
  ].join('|');
}

function equipmentEngineeringDataKey(
  engineeringData: Equipment['props']['engineeringData'] | undefined
): string {
  if (!engineeringData) {
    return '';
  }

  return [
    engineeringData.airflow,
    engineeringData.pressureDrop ?? '',
    engineeringData.efficiency ?? '',
    engineeringData.powerConsumption ?? '',
  ].join('|');
}

function constraintStatusKey(
  status: Duct['props']['constraintStatus'] | undefined
): string {
  if (!status) {
    return '';
  }

  return [
    status.isValid ? '1' : '0',
    ...(status.violations ?? []).map((violation) =>
      [violation.type, violation.severity, violation.message, violation.suggestedFix ?? ''].join(':')
    ),
  ].join('|');
}

export function buildVelocityWarning(
  velocity: number,
  profile: VelocityProfile
): Duct['warnings'] | undefined {
  const range = VELOCITY_LIMITS[profile];
  if (!range || velocity === 0) {
    return undefined;
  }

  if (velocity < range.min) {
    return {
      velocity: `Velocity ${velocity.toFixed(0)} FPM is below ${profile} range (${range.min}-${range.max}).`,
    };
  }

  if (velocity > range.max) {
    return {
      velocity: `Velocity ${velocity.toFixed(0)} FPM exceeds ${profile} range (${range.min}-${range.max}).`,
    };
  }

  return undefined;
}

export default useCalculations;
