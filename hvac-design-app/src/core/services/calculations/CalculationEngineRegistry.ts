import type { Duct } from '@/core/schema';
import type {
  EngineeringSystem,
  SystemProfile,
} from '@/core/schema/unified-component.schema';
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

export type CalculationCapability = 'sizing' | 'pressure_drop' | 'compliance' | 'load';

export interface SizingInput {
  duct: Duct;
}

export interface SizingResult {
  calculated: Duct['calculated'];
}

export interface PressureDropInput {
  duct: Duct;
}

export interface PressureDropResult {
  pressureDrop: number;
}

export interface FrictionResult {
  frictionLoss: number;
}

export interface ComplianceResult {
  valid: boolean;
  warnings: string[];
}

export interface LoadInput {
  duct: Duct;
}

export interface LoadResult {
  load: number;
}

export interface SpacingResult {
  spacing: number;
  warnings: string[];
}

export interface LoadAnalysisResult {
  load?: number;
  spacing?: number;
  warnings: string[];
}

export interface PressureAnalysisResult {
  pressureDrop?: number;
  frictionLoss?: number;
}

export interface ISizingEngine {
  calculateSize(params: SizingInput): SizingResult;
}

export interface IPressureDropEngine {
  calculatePressureDrop(params: PressureDropInput): PressureDropResult;
  calculateFrictionLoss(params: PressureDropInput): FrictionResult;
}

export interface IComplianceEngine {
  validate(entity: Duct, profile?: SystemProfile): ComplianceResult;
}

export interface ILoadEngine {
  calculateLoad(params: LoadInput): LoadResult;
  calculateSpacing(params: LoadInput): SpacingResult;
}

export interface ISystemEngine {
  readonly engineeringSystem: EngineeringSystem;
  readonly label: string;
  readonly capabilities: readonly CalculationCapability[];
  getSizingEngine?(): ISizingEngine;
  getPressureDropEngine?(): IPressureDropEngine;
  getComplianceEngine?(): IComplianceEngine;
  getLoadEngine?(): ILoadEngine;
  calculateDuct?(duct: Duct): Duct['calculated'];
  getWarnings?(duct: Duct, profile?: SystemProfile): string[];
}

function getEquivalentDiameter(duct: Duct): number {
  return duct.props.shape === 'round'
    ? (duct.props.diameter ?? 0)
    : calculateEquivalentDiameter(duct.props.width ?? 0, duct.props.height ?? 0);
}

function calculateBaseDuctValues(
  duct: Duct,
  overrides?: { roughness?: number; velocityMultiplier?: number }
): Duct['calculated'] {
  const area = calculateDuctArea(duct.props.shape, {
    diameter: duct.props.shape === 'round' ? duct.props.diameter : undefined,
    width: duct.props.shape === 'rectangular' ? duct.props.width : undefined,
    height: duct.props.shape === 'rectangular' ? duct.props.height : undefined,
  });

  const velocity =
    calculateVelocity(duct.props.airflow, area) * (overrides?.velocityMultiplier ?? 1);
  const equivalentDiameter = getEquivalentDiameter(duct) || 1;
  const frictionLoss = calculateFrictionLoss(
    velocity,
    equivalentDiameter,
    duct.props.length,
    overrides?.roughness ?? MATERIAL_ROUGHNESS[duct.props.material]
  );

  return {
    area,
    velocity,
    frictionLoss,
  };
}

function formatEngineeringSystemLabel(engineeringSystem: unknown): string {
  if (typeof engineeringSystem !== 'string' || engineeringSystem.trim().length === 0) {
    return 'Unknown Engineering System';
  }

  return engineeringSystem
    .split('_')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ') || 'Unknown Engineering System';
}

function describeUnsupportedEngine(engineeringSystem: EngineeringSystem | string | null | undefined): EngineResolution {
  const resolvedEngineeringSystem =
    typeof engineeringSystem === 'string' && engineeringSystem.trim().length > 0
      ? engineeringSystem
      : 'unknown';

  return {
    engineeringSystem: resolvedEngineeringSystem as EngineeringSystem,
    label: `${formatEngineeringSystemLabel(engineeringSystem)} (unsupported)`,
    capabilities: [],
    supported: false,
    engine: null,
  };
}

abstract class BaseSystemEngine implements ISystemEngine {
  abstract readonly engineeringSystem: EngineeringSystem;
  abstract readonly label: string;
  abstract readonly capabilities: readonly CalculationCapability[];

  getSizingEngine?(): ISizingEngine {
    return undefined;
  }

  getPressureDropEngine?(): IPressureDropEngine {
    return undefined;
  }

  getComplianceEngine?(): IComplianceEngine {
    return undefined;
  }

  getLoadEngine?(): ILoadEngine {
    return undefined;
  }

  calculateDuct?(duct: Duct): Duct['calculated'] {
    return this.getSizingEngine?.()?.calculateSize({ duct }).calculated;
  }

  getWarnings?(duct: Duct, profile?: SystemProfile): string[] {
    return this.getComplianceEngine?.()?.validate(duct, profile).warnings ?? [];
  }
}

class StandardDuctSizingEngine implements ISizingEngine {
  calculateSize({ duct }: SizingInput): SizingResult {
    return { calculated: calculateBaseDuctValues(duct) };
  }
}

class StandardDuctPressureDropEngine implements IPressureDropEngine {
  calculatePressureDrop({ duct }: PressureDropInput): PressureDropResult {
    return { pressureDrop: calculateBaseDuctValues(duct).frictionLoss };
  }

  calculateFrictionLoss({ duct }: PressureDropInput): FrictionResult {
    return { frictionLoss: calculateBaseDuctValues(duct).frictionLoss };
  }
}

class StandardDuctEngine extends BaseSystemEngine {
  readonly engineeringSystem = 'standard_duct' as const;
  readonly label = 'Standard Duct';
  readonly capabilities = ['sizing', 'pressure_drop'] as const;
  private readonly sizingEngine = new StandardDuctSizingEngine();
  private readonly pressureDropEngine = new StandardDuctPressureDropEngine();

  getSizingEngine(): ISizingEngine {
    return this.sizingEngine;
  }

  getPressureDropEngine(): IPressureDropEngine {
    return this.pressureDropEngine;
  }
}

class BoilerFlueSizingEngine implements ISizingEngine {
  calculateSize({ duct }: SizingInput): SizingResult {
    return {
      calculated: calculateBaseDuctValues(duct, {
        roughness: MATERIAL_ROUGHNESS.stainless,
      }),
    };
  }
}

class BoilerFlueComplianceEngine implements IComplianceEngine {
  validate(entity: Duct, profile?: SystemProfile): ComplianceResult {
    const warnings: string[] = [];
    const minimumSlope =
      typeof profile?.dimensionalConstraints?.minimumSlopePerFoot === 'number'
        ? profile.dimensionalConstraints.minimumSlopePerFoot
        : 0.25;
    const slope = entity.props.condensateSlope ?? 0;

    if (slope < minimumSlope) {
      warnings.push(
        `Condensate slope ${slope.toFixed(2)} in/ft is below the required ${minimumSlope.toFixed(2)} in/ft.`
      );
    }

    if (entity.props.venting === 'natural' && entity.props.wallType === 'single') {
      warnings.push('Verify single-wall natural vent runs remain within listed connector limitations.');
    }

    return { valid: warnings.length === 0, warnings };
  }
}

class BoilerFlueEngine extends BaseSystemEngine {
  readonly engineeringSystem = 'boiler_flue' as const;
  readonly label = 'Boiler & Water Heater Flue';
  readonly capabilities = ['sizing', 'compliance'] as const;
  private readonly sizingEngine = new BoilerFlueSizingEngine();
  private readonly complianceEngine = new BoilerFlueComplianceEngine();

  getSizingEngine(): ISizingEngine {
    return this.sizingEngine;
  }

  getComplianceEngine(): IComplianceEngine {
    return this.complianceEngine;
  }
}

class GreaseDuctSizingEngine implements ISizingEngine {
  calculateSize({ duct }: SizingInput): SizingResult {
    return {
      calculated: calculateBaseDuctValues(duct, {
        roughness: 0.00035,
        velocityMultiplier: 1.05,
      }),
    };
  }
}

class GreaseDuctComplianceEngine implements IComplianceEngine {
  validate(entity: Duct, profile?: SystemProfile): ComplianceResult {
    const warnings: string[] = [];
    const velocityLimit =
      profile?.velocityLimits?.max ??
      (typeof entity.props.engineeringData?.velocity === 'number'
        ? entity.props.engineeringData.velocity
        : 2500);
    const calculated = calculateBaseDuctValues(entity, {
      roughness: 0.00035,
      velocityMultiplier: 1.05,
    });

    if (calculated.velocity > velocityLimit) {
      warnings.push(
        `Velocity ${calculated.velocity.toFixed(0)} FPM exceeds the grease-duct limit of ${velocityLimit} FPM.`
      );
    }

    if (!entity.props.fireRating) {
      warnings.push('Grease duct runs require a fire-rating designation.');
    }

    if (entity.props.liquidTight === false) {
      warnings.push('Grease duct runs must remain liquid-tight per NFPA 96.');
    }

    return { valid: warnings.length === 0, warnings };
  }
}

class GreaseDuctEngine extends BaseSystemEngine {
  readonly engineeringSystem = 'grease_duct' as const;
  readonly label = 'Grease Duct';
  readonly capabilities = ['sizing', 'compliance'] as const;
  private readonly sizingEngine = new GreaseDuctSizingEngine();
  private readonly complianceEngine = new GreaseDuctComplianceEngine();

  getSizingEngine(): ISizingEngine {
    return this.sizingEngine;
  }

  getComplianceEngine(): IComplianceEngine {
    return this.complianceEngine;
  }
}

class GeneratorExhaustSizingEngine implements ISizingEngine {
  calculateSize({ duct }: SizingInput): SizingResult {
    return {
      calculated: calculateBaseDuctValues(duct, {
        roughness: MATERIAL_ROUGHNESS.stainless,
        velocityMultiplier: 1.08,
      }),
    };
  }
}

class GeneratorExhaustPressureDropEngine implements IPressureDropEngine {
  calculatePressureDrop({ duct }: PressureDropInput): PressureDropResult {
    return { pressureDrop: calculateBaseDuctValues(duct, {
      roughness: MATERIAL_ROUGHNESS.stainless,
      velocityMultiplier: 1.08,
    }).frictionLoss };
  }

  calculateFrictionLoss({ duct }: PressureDropInput): FrictionResult {
    return { frictionLoss: this.calculatePressureDrop({ duct }).pressureDrop };
  }
}

class GeneratorExhaustComplianceEngine implements IComplianceEngine {
  validate(entity: Duct): ComplianceResult {
    const warnings: string[] = [];
    const calculated = calculateBaseDuctValues(entity, {
      roughness: MATERIAL_ROUGHNESS.stainless,
      velocityMultiplier: 1.08,
    });

    if (
      typeof entity.props.backpressureLimit === 'number' &&
      calculated.frictionLoss > entity.props.backpressureLimit
    ) {
      warnings.push(
        `Calculated backpressure ${calculated.frictionLoss.toFixed(2)} exceeds the limit of ${entity.props.backpressureLimit.toFixed(2)}.`
      );
    }

    if (
      typeof entity.props.exhaustTempF === 'number' &&
      entity.props.exhaustTempF > 1200
    ) {
      warnings.push('Exhaust temperature exceeds the assumed insulated exhaust component range.');
    }

    return { valid: warnings.length === 0, warnings };
  }
}

class GeneratorExhaustEngine extends BaseSystemEngine {
  readonly engineeringSystem = 'generator_exhaust' as const;
  readonly label = 'Generator & Engine Exhaust';
  readonly capabilities = ['sizing', 'pressure_drop', 'compliance'] as const;
  private readonly sizingEngine = new GeneratorExhaustSizingEngine();
  private readonly pressureDropEngine = new GeneratorExhaustPressureDropEngine();
  private readonly complianceEngine = new GeneratorExhaustComplianceEngine();

  getSizingEngine(): ISizingEngine {
    return this.sizingEngine;
  }

  getPressureDropEngine(): IPressureDropEngine {
    return this.pressureDropEngine;
  }

  getComplianceEngine(): IComplianceEngine {
    return this.complianceEngine;
  }
}

class UniversalLoadEngine implements ILoadEngine {
  calculateLoad({ duct }: LoadInput): LoadResult {
    const calculated = calculateBaseDuctValues(duct);
    return {
      load: Math.max(25, calculated.area * Math.max(1, duct.props.length / 10)),
    };
  }

  calculateSpacing({ duct }: LoadInput): SpacingResult {
    const equivalentDiameter = getEquivalentDiameter(duct);
    const spacing = equivalentDiameter >= 36 ? 8 : equivalentDiameter >= 24 ? 10 : 12;
    const warnings =
      duct.props.systemType === 'exhaust'
        ? ['Verify seismic bracing intervals for exhaust runs with universal supports.']
        : [];

    return { spacing, warnings };
  }
}

class UniversalComplianceEngine implements IComplianceEngine {
  validate(entity: Duct): ComplianceResult {
    const warnings: string[] = [];
    const equivalentDiameter = getEquivalentDiameter(entity);

    if (equivalentDiameter >= 48) {
      warnings.push('Large duct runs should verify seismic support spacing against IBC/ASCE 7 tables.');
    }

    return { valid: warnings.length === 0, warnings };
  }
}

class UniversalEngine extends BaseSystemEngine {
  readonly engineeringSystem = 'universal' as const;
  readonly label = 'Universal Components';
  readonly capabilities = ['load', 'compliance'] as const;
  private readonly loadEngine = new UniversalLoadEngine();
  private readonly complianceEngine = new UniversalComplianceEngine();

  getLoadEngine(): ILoadEngine {
    return this.loadEngine;
  }

  getComplianceEngine(): IComplianceEngine {
    return this.complianceEngine;
  }
}

export interface EngineDescriptor {
  engineeringSystem: EngineeringSystem;
  label: string;
  capabilities: readonly CalculationCapability[];
  supported: boolean;
}

export interface EngineResolution extends EngineDescriptor {
  engine: ISystemEngine | null;
}

export class CalculationEngineRegistry {
  private static readonly registry = new Map<EngineeringSystem, ISystemEngine>([
    ['standard_duct', new StandardDuctEngine()],
    ['boiler_flue', new BoilerFlueEngine()],
    ['grease_duct', new GreaseDuctEngine()],
    ['generator_exhaust', new GeneratorExhaustEngine()],
    ['universal', new UniversalEngine()],
  ]);

  static get(engineeringSystem: EngineeringSystem): ISystemEngine | null {
    return this.registry.get(engineeringSystem) ?? null;
  }

  static has(engineeringSystem: EngineeringSystem): boolean {
    return this.registry.has(engineeringSystem);
  }

  static describe(engineeringSystem: EngineeringSystem | string | null | undefined): EngineResolution {
    const engine = this.registry.get(engineeringSystem);
    if (!engine) {
      return describeUnsupportedEngine(engineeringSystem);
    }

    return {
      engineeringSystem: engine.engineeringSystem,
      label: engine.label,
      capabilities: engine.capabilities,
      supported: true,
      engine,
    };
  }

  static list(): EngineDescriptor[] {
    return Array.from(this.registry.values(), (engine) => ({
      engineeringSystem: engine.engineeringSystem,
      label: engine.label,
      capabilities: engine.capabilities,
      supported: true,
    }));
  }

  static runCompliance(
    engineeringSystem: EngineeringSystem,
    duct: Duct,
    profile?: SystemProfile
  ): ComplianceResult {
    const engine = this.get(engineeringSystem);
    if (!engine) {
      return { valid: true, warnings: [] };
    }

    const complianceEngine = engine.getComplianceEngine?.();
    if (complianceEngine) {
      return complianceEngine.validate(duct, profile);
    }

    const warnings = engine.getWarnings?.(duct, profile) ?? [];
    return { valid: warnings.length === 0, warnings };
  }

  static runLoadAnalysis(
    engineeringSystem: EngineeringSystem,
    duct: Duct
  ): LoadAnalysisResult {
    const engine = this.get(engineeringSystem);
    const loadEngine = engine?.getLoadEngine?.();
    if (!loadEngine) {
      return { warnings: [] };
    }

    const load = loadEngine.calculateLoad({ duct }).load;
    const spacingResult = loadEngine.calculateSpacing({ duct });

    return {
      load,
      spacing: spacingResult.spacing,
      warnings: spacingResult.warnings,
    };
  }

  static runPressureAnalysis(
    engineeringSystem: EngineeringSystem,
    duct: Duct
  ): PressureAnalysisResult {
    const engine = this.get(engineeringSystem);
    const pressureDropEngine = engine?.getPressureDropEngine?.();
    if (!pressureDropEngine) {
      return {};
    }

    const pressureDrop = pressureDropEngine.calculatePressureDrop({ duct }).pressureDrop;
    const frictionLoss = pressureDropEngine.calculateFrictionLoss({ duct }).frictionLoss;

    return {
      pressureDrop,
      frictionLoss,
    };
  }
}
