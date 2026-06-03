import type { Duct, Entity, Equipment, Fitting } from '@/core/schema';
import type { EngineeringSystem, SystemProfile } from '@/core/schema/unified-component.schema';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import {
  CalculationEngineRegistry,
  type EngineResolution,
} from './CalculationEngineRegistry';
import { EngineeringCalculator } from './engineeringCalculator';
import {
  calculateDuctArea,
  calculateEquivalentDiameter,
  calculateVelocity,
} from '@/features/canvas/calculators/ductSizing';
import { calculateFrictionLoss } from '@/features/canvas/calculators/pressureDrop';

const MATERIAL_ROUGHNESS: Record<Duct['props']['material'], number> = {
  galvanized: 0.0005,
  stainless: 0.0002,
  aluminum: 0.0002,
  flex: 0.003,
};

const AIRFLOW_M3H_TO_CFM = 0.588577778;
const DEFAULT_FITTING_DIAMETER = 12;

export interface DuctCalculationRuntime {
  calculated: Duct['calculated'];
  engine: EngineResolution;
  complianceWarnings: string[];
}

export interface FittingCalculationRuntime {
  calculated: Fitting['calculated'];
  engine: EngineResolution;
  complianceWarnings: string[];
}

export interface EquipmentCalculationRuntime {
  engineeringData: NonNullable<Equipment['props']['engineeringData']>;
  engine: EngineResolution;
  complianceWarnings: string[];
  loadRating?: number;
  spacing?: number;
}

function resolveEngineeringSystem(engineeringSystem: unknown): EngineeringSystem | undefined {
  if (
    engineeringSystem === 'standard_duct' ||
    engineeringSystem === 'universal'
  ) {
    return engineeringSystem;
  }

  return undefined;
}

function resolveSystemProfile(engineeringSystem: unknown): SystemProfile | undefined {
  const resolvedEngineeringSystem = resolveEngineeringSystem(engineeringSystem);
  return resolvedEngineeringSystem
    ? useUnifiedCatalogStore.getState().getSystemProfile(resolvedEngineeringSystem)
    : undefined;
}

function buildDispatchWarnings(engine: EngineResolution): string[] {
  if (engine.supported) {
    return [];
  }

  return [`No registered calculation engine for ${engine.label}. Using generic calculations.`];
}

function dedupeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings.filter((warning) => warning.length > 0))];
}

function getEquivalentDiameter(duct: Duct): number {
  return duct.props.shape === 'round'
    ? (duct.props.diameter ?? 0)
    : calculateEquivalentDiameter(duct.props.width ?? 0, duct.props.height ?? 0);
}

function calculateGenericDuctValues(duct: Duct): Duct['calculated'] {
  const area = calculateDuctArea(duct.props.shape, {
    diameter: duct.props.shape === 'round' ? duct.props.diameter : undefined,
    width: duct.props.shape === 'rectangular' ? duct.props.width : undefined,
    height: duct.props.shape === 'rectangular' ? duct.props.height : undefined,
  });

  const velocity = calculateVelocity(duct.props.airflow, area);
  const equivalentDiameter = getEquivalentDiameter(duct) || 1;
  const frictionLoss = calculateFrictionLoss(
    velocity,
    equivalentDiameter,
    duct.props.length,
    MATERIAL_ROUGHNESS[duct.props.material]
  );

  return {
    area,
    velocity,
    frictionLoss,
  };
}

function collectComplianceWarnings(
  engine: EngineResolution,
  duct: Duct,
  profile?: SystemProfile
): string[] {
  return dedupeWarnings([
    ...buildDispatchWarnings(engine),
    ...(engine.engine?.getComplianceEngine?.()?.validate(duct, profile).warnings ??
      engine.engine?.getWarnings?.(duct, profile) ??
      []),
    ...(engine.engine?.getLoadEngine?.()?.calculateSpacing({ duct }).warnings ?? []),
  ]);
}

function resolveDuctEntity(entity: Entity | undefined): Duct | undefined {
  return entity?.type === 'duct' ? (entity as Duct) : undefined;
}

function resolveFirstConnectedDuct(entityIds: Array<string | undefined>, entitiesById: Record<string, Entity>): Duct | undefined {
  for (const entityId of entityIds) {
    if (!entityId) {
      continue;
    }

    const duct = resolveDuctEntity(entitiesById[entityId]);
    if (duct) {
      return duct;
    }
  }

  return undefined;
}

function buildFittingContextDuct(
  fitting: Fitting,
  entitiesById: Record<string, Entity>
): Duct | undefined {
  const baseDuct = resolveFirstConnectedDuct(
    [
      fitting.props.inletDuctId,
      fitting.props.outletDuctId,
      ...(fitting.props.connectionPoints?.map((point) => point.ductId) ?? []),
    ],
    entitiesById
  );

  if (!baseDuct) {
    return undefined;
  }

  return {
    ...baseDuct,
    props: {
      ...baseDuct.props,
      engineeringSystem: fitting.props.engineeringSystem,
    } as Duct['props'],
  };
}

function toEquipmentAirflow(equipment: Equipment): number {
  return equipment.props.capacityUnit === 'm3/h'
    ? equipment.props.capacity * AIRFLOW_M3H_TO_CFM
    : equipment.props.capacity;
}

function buildSyntheticEquipmentDuct(equipment: Equipment): Duct {
  return {
    id: `${equipment.id}-runtime-context` as `${string}-${string}`,
    type: 'duct',
    transform: equipment.transform,
    zIndex: equipment.zIndex,
    createdAt: equipment.createdAt,
    modifiedAt: equipment.modifiedAt,
    props: {
      name: `${equipment.props.name} Runtime Context`,
      engineeringSystem: equipment.props.engineeringSystem as Duct['props']['engineeringSystem'],
      shape: 'rectangular',
      width: Math.max(4, equipment.props.width),
      height: Math.max(4, equipment.props.depth),
      length: Math.max(1, equipment.props.height / 12),
      material: 'galvanized',
      airflow: toEquipmentAirflow(equipment),
      staticPressure: equipment.props.staticPressure,
    } as Duct['props'],
    calculated: {
      area: 0,
      velocity: 0,
      frictionLoss: 0,
    },
  };
}

function buildEquipmentContextDuct(
  equipment: Equipment,
  entitiesById: Record<string, Entity>,
  engine: EngineResolution
): Duct | undefined {
  const connectedDuct = resolveDuctEntity(
    equipment.props.connectedDuctId ? entitiesById[equipment.props.connectedDuctId] : undefined
  );

  if (connectedDuct) {
    return {
      ...connectedDuct,
      props: {
        ...connectedDuct.props,
        engineeringSystem: equipment.props.engineeringSystem as Duct['props']['engineeringSystem'],
        airflow: toEquipmentAirflow(equipment),
        staticPressure: equipment.props.staticPressure,
      } as Duct['props'],
    };
  }

  if (engine.capabilities.includes('load')) {
    return buildSyntheticEquipmentDuct(equipment);
  }

  return undefined;
}

export function calculateDuctRuntime(duct: Duct): DuctCalculationRuntime {
  const engineeringSystem = resolveEngineeringSystem(duct.props.engineeringSystem);
  const engine = CalculationEngineRegistry.describe(engineeringSystem);
  const profile = resolveSystemProfile(engineeringSystem);
  const sizingEngine = engine.engine?.getSizingEngine?.();
  const pressureDropEngine = engine.engine?.getPressureDropEngine?.();

  const sized =
    sizingEngine?.calculateSize({ duct }).calculated ??
    engine.engine?.calculateDuct?.(duct) ??
    calculateGenericDuctValues(duct);

  const calculated = pressureDropEngine
    ? {
        ...sized,
        frictionLoss: pressureDropEngine.calculateFrictionLoss({ duct }).frictionLoss,
      }
    : sized;

  return {
    calculated,
    engine,
    complianceWarnings: collectComplianceWarnings(engine, duct, profile),
  };
}

export function calculateFittingRuntime(
  fitting: Fitting,
  entitiesById: Record<string, Entity>
): FittingCalculationRuntime {
  const engineeringSystem = resolveEngineeringSystem(fitting.props.engineeringSystem);
  const engine = CalculationEngineRegistry.describe(engineeringSystem);
  const profile = resolveSystemProfile(engineeringSystem);
  const contextDuct = buildFittingContextDuct(fitting, entitiesById);
  const equivalentDiameter = contextDuct ? getEquivalentDiameter(contextDuct) : DEFAULT_FITTING_DIAMETER;
  const equivalentLength = EngineeringCalculator.calculateFittingEquivalentLength(
    fitting.props.fittingType,
    equivalentDiameter
  );

  const pressureDropPer100Ft =
    contextDuct && engine.engine?.getPressureDropEngine?.()
      ? engine.engine.getPressureDropEngine()?.calculatePressureDrop({ duct: contextDuct }).pressureDrop ?? 0
      : contextDuct
        ? calculateDuctRuntime(contextDuct).calculated.frictionLoss
        : 0;

  return {
    calculated: {
      equivalentLength,
      pressureLoss: pressureDropPer100Ft * (equivalentLength / 100),
    },
    engine,
    complianceWarnings: contextDuct
      ? collectComplianceWarnings(engine, contextDuct, profile)
      : buildDispatchWarnings(engine),
  };
}

export function calculateEquipmentRuntime(
  equipment: Equipment,
  entitiesById: Record<string, Entity>
): EquipmentCalculationRuntime {
  const engineeringSystem = resolveEngineeringSystem(equipment.props.engineeringSystem);
  const engine = CalculationEngineRegistry.describe(engineeringSystem);
  const profile = resolveSystemProfile(engineeringSystem);
  const contextDuct = buildEquipmentContextDuct(equipment, entitiesById, engine);
  const airflow = toEquipmentAirflow(equipment);
  const pressureDrop =
    contextDuct && engine.engine?.getPressureDropEngine?.()
      ? engine.engine.getPressureDropEngine()?.calculatePressureDrop({ duct: contextDuct }).pressureDrop
      : undefined;
  const loadRating =
    contextDuct && engine.engine?.getLoadEngine?.()
      ? engine.engine.getLoadEngine()?.calculateLoad({ duct: contextDuct }).load
      : undefined;
  const spacing =
    contextDuct && engine.engine?.getLoadEngine?.()
      ? engine.engine.getLoadEngine()?.calculateSpacing({ duct: contextDuct }).spacing
      : undefined;

  return {
    engineeringData: {
      airflow,
      ...(typeof pressureDrop === 'number' ? { pressureDrop } : {}),
      ...(typeof equipment.props.engineeringData?.efficiency === 'number'
        ? { efficiency: equipment.props.engineeringData.efficiency }
        : {}),
      ...(typeof equipment.props.engineeringData?.powerConsumption === 'number'
        ? { powerConsumption: equipment.props.engineeringData.powerConsumption }
        : {}),
    },
    engine,
    complianceWarnings: contextDuct
      ? collectComplianceWarnings(engine, contextDuct, profile)
      : buildDispatchWarnings(engine),
    ...(typeof loadRating === 'number' ? { loadRating } : {}),
    ...(typeof spacing === 'number' ? { spacing } : {}),
  };
}
