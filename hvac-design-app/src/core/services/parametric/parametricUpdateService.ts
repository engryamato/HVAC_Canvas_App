import { Duct, DuctProps, DuctEngineeringData } from '../../schema/duct.schema';
import { Fitting } from '../../schema/fitting.schema';
import { Entity } from '../../schema';
import { EngineeringLimits } from '../../schema/calculation-settings.schema';
import { 
  engineeringCalculator,
  DuctSizingParams 
} from '../calculations/engineeringCalculator';
import { ductValidator } from '../validation/constraintValidator';
import { FittingGenerationService } from '../fittingGeneration';

/**
 * Parametric Update Service
 * 
 * Handles automatic recalculation and constraint propagation when entity properties change.
 * Implements dependency tracking and cascading updates across connected entities.
 */

export interface UpdateDependency {
  entityId: string;
  entityType: 'duct' | 'fitting' | 'equipment';
  updateType: 'recalculate' | 'validate' | 'propagate';
}

export interface ParametricUpdateResult {
  updatedEntities: string[]; // IDs of entities that were updated
  violations: Array<{ entityId: string; message: string }>;
  requiresUserAction: boolean;
  entityUpdates?: Array<{ id: string; updates: Partial<Entity>; previous: Entity }>;
  engineeringData?: DuctEngineeringData;
}

export type ParametricUpdateMode = 'input' | 'drag';

interface PendingDuctUpdate {
  args: Parameters<typeof ParametricUpdateService.handleDuctPropertyChange>;
  resolve: (result: ParametricUpdateResult) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class ParametricUpdateService {
  private static pendingDuctUpdates = new Map<string, PendingDuctUpdate>();

  /**
   * Update duct engineering data based on property changes
   */
  static updateDuctCalculations(
    duct: Partial<DuctProps>,
    limits: EngineeringLimits
  ): DuctEngineeringData {
    // Build sizing params from duct properties
    const params: DuctSizingParams = {
      airflow: duct.airflow || 0,
      shape: duct.shape || 'round',
      material: this.mapMaterialForEngineeringCalculator(duct.material),
      length: duct.length || 0,
      diameter: duct.diameter,
      width: duct.width,
      height: duct.height,
    };

    // Perform engineering calculations
    const result = engineeringCalculator.calculateDuct(params, limits);

    // Return engineering data
    return {
      airflow: params.airflow,
      velocity: result.velocity,
      pressureDrop: result.pressureDrop,
      friction: result.friction,
      equivalentDiameter: result.equivalentDiameter,
      reynoldsNumber: result.reynoldsNumber,
    };
  }

  /**
   * Validate duct after update
   */
  static validateDuct(
    engineeringData: DuctEngineeringData,
    limits: EngineeringLimits
  ) {
    return ductValidator.validate(engineeringData, limits);
  }

  /**
   * Handle duct property change with cascading updates
   * 
   * When a duct property changes:
   * 1. Recalculate engineering data
   * 2. Validate against constraints
   * 3. Propagate to connected ducts/fittings if needed
   */
  static handleDuctPropertyChange(
    ductId: string,
    changedProps: Partial<DuctProps>,
    connectedEntities: { ducts: Duct[]; fittings: Fitting[] },
    limits: EngineeringLimits
  ): ParametricUpdateResult {
    const sourceDuct = connectedEntities.ducts.find((duct) => duct.id === ductId);
    if (!sourceDuct) {
      return {
        updatedEntities: [],
        violations: [],
        requiresUserAction: false,
        entityUpdates: [],
      };
    }

    const updatedEntities: string[] = [];
    const violations: Array<{ entityId: string; message: string }> = [];

    const mergedProps: DuctProps = {
      ...sourceDuct.props,
      ...changedProps,
    };

    // Step 1: Recalculate engineering data for changed duct
    const newEngineeringData = this.updateDuctCalculations(mergedProps, limits);

    // Step 2: Validate
    const validationStatus = this.validateDuct(newEngineeringData, limits);

    // Track violations
    if (!validationStatus.isValid) {
      for (const violation of validationStatus.violations) {
        if (violation.severity === 'error') {
          violations.push({
            entityId: ductId,
            message: violation.message,
          });
        }
      }
    }

    updatedEntities.push(ductId);

    const timestamp = new Date().toISOString();
    const primaryDuctUpdate: { id: string; updates: Partial<Entity>; previous: Entity } = {
      id: sourceDuct.id,
      previous: sourceDuct,
      updates: {
        props: {
          ...mergedProps,
          engineeringData: newEngineeringData,
          constraintStatus: validationStatus,
        },
        modifiedAt: timestamp,
      },
    };

    const entityUpdates: Array<{ id: string; updates: Partial<Entity>; previous: Entity }> = [
      primaryDuctUpdate,
    ];

    // Step 3: Propagate airflow to connected downstream ducts
    if (changedProps.airflow !== undefined) {
      const connectedDownstreamDucts = connectedEntities.ducts.filter(
        d => d.props.connectedFrom === ductId
      );

      for (const downstreamDuct of connectedDownstreamDucts) {
        // Propagate airflow (in real implementation, consider splits/joins)
        updatedEntities.push(downstreamDuct.id);
      }
    }

    // Step 4: Update connected fittings
    const connectedFittings = connectedEntities.fittings.filter(
      f =>
        f.props.inletDuctId === ductId || f.props.outletDuctId === ductId
    );

    const effectiveDiameter = this.getEffectiveDiameter(mergedProps);
    for (const fitting of connectedFittings) {
      updatedEntities.push(fitting.id);

      const equivalentLength = engineeringCalculator.calculateFittingEquivalentLength(
        fitting.props.fittingType,
        effectiveDiameter
      );

      const pressureLoss = equivalentLength > 0
        ? (equivalentLength / 100) * newEngineeringData.pressureDrop
        : 0;

      entityUpdates.push({
        id: fitting.id,
        previous: fitting,
        updates: {
          calculated: {
            ...fitting.calculated,
            equivalentLength,
            pressureLoss,
          },
          modifiedAt: timestamp,
        },
      });
    }

    return {
      updatedEntities,
      violations,
      requiresUserAction: violations.length > 0,
      entityUpdates,
      engineeringData: newEngineeringData,
    };
  }

  static scheduleDuctPropertyChange(
    ductId: string,
    changedProps: Partial<DuctProps>,
    connectedEntities: { ducts: Duct[]; fittings: Fitting[] },
    limits: EngineeringLimits,
    mode: ParametricUpdateMode = 'input',
    debounceMs: number = 500
  ): Promise<ParametricUpdateResult> {
    if (mode === 'drag') {
      return Promise.resolve(
        this.handleDuctPropertyChange(ductId, changedProps, connectedEntities, limits)
      );
    }

    const pending = this.pendingDuctUpdates.get(ductId);
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve({
        updatedEntities: [],
        violations: [],
        requiresUserAction: false,
        entityUpdates: [],
      });
      this.pendingDuctUpdates.delete(ductId);
    }

    return new Promise((resolve) => {
      const args: Parameters<typeof ParametricUpdateService.handleDuctPropertyChange> = [
        ductId,
        changedProps,
        connectedEntities,
        limits,
      ];

      const timer = setTimeout(() => {
        this.pendingDuctUpdates.delete(ductId);
        resolve(this.handleDuctPropertyChange(...args));
      }, debounceMs);

      this.pendingDuctUpdates.set(ductId, {
        args,
        resolve,
        timer,
      });
    });
  }

  static flushPendingDuctPropertyChange(ductId: string): ParametricUpdateResult | null {
    const pending = this.pendingDuctUpdates.get(ductId);
    if (!pending) {
      return null;
    }

    clearTimeout(pending.timer);
    this.pendingDuctUpdates.delete(ductId);
    const result = this.handleDuctPropertyChange(...pending.args);
    pending.resolve(result);
    return result;
  }

  static cancelPendingDuctPropertyChange(ductId: string): void {
    const pending = this.pendingDuctUpdates.get(ductId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    this.pendingDuctUpdates.delete(ductId);
    pending.resolve({
      updatedEntities: [],
      violations: [],
      requiresUserAction: false,
      entityUpdates: [],
    });
  }

  /**
   * Auto-size duct to meet velocity target
   */
  static autoSizeDuctToVelocity(
    duct: Partial<DuctProps>,
    targetVelocity: number,
    limits: EngineeringLimits
  ): Partial<DuctProps> {
    if (!duct.airflow) {
      throw new Error('Airflow is required for auto-sizing');
    }

    const sized = engineeringCalculator.autoSizeDuct(
      duct.airflow,
      targetVelocity,
      duct.shape || 'round',
      duct.material || 'galvanized',
      limits
    );

    // Return updated dimensions
    if (sized.shape === 'round') {
      return {
        ...duct,
        diameter: sized.diameter,
        autoSized: true,
      };
    } else {
      return {
        ...duct,
        width: sized.width,
        height: sized.height,
        autoSized: true,
      };
    }
  }

  /**
   * Bulk update multiple ducts with validation
   */
  static bulkUpdateDucts(
    updates: Array<{ ductId: string; props: Partial<DuctProps> }>,
    limits: EngineeringLimits
  ): ParametricUpdateResult {
    const updatedEntities: string[] = [];
    const violations: Array<{ entityId: string; message: string }> = [];

    for (const update of updates) {
      try {
        const engineeringData = this.updateDuctCalculations(update.props, limits);
        const validationStatus = this.validateDuct(engineeringData, limits);

        updatedEntities.push(update.ductId);

        if (!validationStatus.isValid) {
          for (const violation of validationStatus.violations) {
            if (violation.severity === 'error') {
              violations.push({
                entityId: update.ductId,
                message: violation.message,
              });
            }
          }
        }
      } catch (error) {
        violations.push({
          entityId: update.ductId,
          message: error instanceof Error ? error.message : 'Update failed',
        });
      }
    }

    return {
      updatedEntities,
      violations,
      requiresUserAction: violations.length > 0,
    };
  }

  /**
   * Propagate airflow changes through duct network
   * 
   * This implements a simplified propagation - in production would need:
   * - Junction handling (splits/merges)
   * - Loop detection
   * - Conservation of mass validation
   */
  static propagateAirflowChanges(
    startDuctId: string,
    _newAirflow: number,
    ductNetwork: Duct[]
  ): string[] {
    const affectedDuctIds: string[] = [startDuctId];
    const visited = new Set<string>([startDuctId]);

    // Simple forward propagation (no loops, no complex junctions)
    let currentDuctId = startDuctId;
    let foundDownstream = true;

    while (foundDownstream) {
      const downstreamDuct = ductNetwork.find(
        d => d.props.connectedFrom === currentDuctId && !visited.has(d.id)
      );

      if (downstreamDuct) {
        affectedDuctIds.push(downstreamDuct.id);
        visited.add(downstreamDuct.id);
        currentDuctId = downstreamDuct.id;
      } else {
        foundDownstream = false;
      }
    }

    return affectedDuctIds;
  }

  /**
   * Auto-insert fittings based on newly created duct connections.
   * Returns inserted fitting entity IDs.
   */
  static autoInsertFittingsForDuct(ductId: string): string[] {
    const fittings = FittingGenerationService.autoGenerateFittings(ductId);
    return fittings.map((fitting) => fitting.id);
  }

  /**
   * Calculate total system pressure drop
   */
  static calculateSystemPressureDrop(
    ducts: Array<{ length: number; pressureDrop: number }>,
    fittings: Array<{ equivalentLength: number }>
  ): number {
    const ductLengths = ducts.map(d => d.length);
    const ductPressureDrops = ducts.map(d => d.pressureDrop);
    const fittingLengths = fittings.map(f => f.equivalentLength);

    return engineeringCalculator.calculateSystemPressureDrop(
      ductLengths,
      ductPressureDrops,
      fittingLengths
    );
  }

  private static mapMaterialForEngineeringCalculator(
    material: DuctProps['material'] | undefined
  ): DuctSizingParams['material'] {
    if (material === 'stainless') {
      return 'stainless';
    }
    if (material === 'flex') {
      return 'flexible';
    }
    return 'galvanized';
  }

  private static getEffectiveDiameter(duct: Partial<DuctProps>): number {
    if (duct.shape === 'round') {
      return duct.diameter ?? 12;
    }

    if (duct.width && duct.height) {
      return engineeringCalculator.calculateEquivalentDiameter(duct.width, duct.height);
    }

    return 12;
  }
}

/**
 * Export singleton instance
 */
export const parametricUpdateService = ParametricUpdateService;
