import { Duct, DuctProps } from '../../schema/duct.schema';
import { EngineeringLimits } from '../../schema/calculation-settings.schema';
import { parametricUpdateService } from '../parametric/parametricUpdateService';
import { autoSizingService } from '../automation/autoSizingService';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { generateCommandId, CommandType, ReversibleCommand } from '@/core/commands/types';
import { Entity } from '@/core/schema';
import { ductValidator } from '../validation/constraintValidator';

/**
 * Bulk Operations Service
 * 
 * Performs batch operations on multiple entities efficiently.
 * Handles validation, rollback, and progress tracking.
 */

export interface BulkOperation<T> {
  entityId: string;
  operation: 'update' | 'delete' | 'validate' | 'autoSize';
  data?: Partial<T>;
}

export interface BulkOperationResult {
  successful: string[]; // Entity IDs
  failed: Array<{ entityId: string; error: string }>;
  totalProcessed: number;
  duration: number; // milliseconds
}

export class BulkOperationsService {
  /**
   * Bulk update duct properties
   */
  static async bulkUpdateDucts(
    operations: BulkOperation<DuctProps>[],
    limits: EngineeringLimits,
    options: { validateAfter?: boolean } = {}
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];
    const entityUpdates: Array<{ id: string; previous: Entity; updates: Partial<Entity> }> = [];

    const entityStore = useEntityStore.getState();

    for (const operation of operations) {
      try {
        const entity = entityStore.byId[operation.entityId];
        if (!entity) {
          failed.push({ entityId: operation.entityId, error: 'Entity not found' });
          continue;
        }

        if (operation.operation === 'update' && operation.data) {
          const updates = [{ ductId: operation.entityId, props: operation.data }];
          const result = parametricUpdateService.bulkUpdateDucts(updates, limits);

          if (result.entityUpdates && result.entityUpdates.length > 0) {
            for (const update of result.entityUpdates) {
              const existingEntity = entityStore.byId[update.id];
              if (existingEntity) {
                entityUpdates.push({
                  id: update.id,
                  previous: existingEntity,
                  updates: update.updates,
                });
              }
            }
          }

          if (result.violations.length > 0) {
            if (options.validateAfter) {
              failed.push({
                entityId: operation.entityId,
                error: result.violations[0]?.message ?? 'Validation failed',
              });
              continue;
            }
          }

          successful.push(operation.entityId);
        } else if (operation.operation === 'autoSize') {
          const duct = entity as Duct;
          const sizingResult = autoSizingService.autoSizeDuct(
            duct.props,
            { targetVelocity: 1500, roundToStandard: true },
            limits
          );

          if (sizingResult.success) {
            const updates: Partial<DuctProps> = {};
            if (sizingResult.newSize.diameter !== undefined) {
              updates.diameter = sizingResult.newSize.diameter;
            }
            if (sizingResult.newSize.width !== undefined) {
              updates.width = sizingResult.newSize.width;
            }
            if (sizingResult.newSize.height !== undefined) {
              updates.height = sizingResult.newSize.height;
            }
            updates.autoSized = true;

            const newEngineeringData = parametricUpdateService.updateDuctCalculations(
              { ...duct.props, ...updates },
              limits
            );

            entityUpdates.push({
              id: operation.entityId,
              previous: entity,
              updates: {
                props: {
                  ...(entity as Duct).props,
                  ...updates,
                  engineeringData: newEngineeringData,
                },
                modifiedAt: new Date().toISOString(),
              } as Partial<Entity>,
            });

            successful.push(operation.entityId);
          } else {
            failed.push({
              entityId: operation.entityId,
              error: sizingResult.warnings.join(', ') || 'Auto-sizing failed',
            });
          }
        }
      } catch (error) {
        failed.push({
          entityId: operation.entityId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (entityUpdates.length > 0) {
      BulkOperationsService.applyEntityUpdatesWithUndo(entityUpdates);
    }

    if (options.validateAfter && successful.length > 0) {
      await BulkOperationsService.validateEntitiesAfterUpdate(successful, limits);
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      totalProcessed: operations.length,
      duration,
    };
  }

  /**
   * Bulk auto-size ducts
   */
  static async bulkAutoSizeDucts(
    ductIds: string[],
    ducts: Map<string, Partial<DuctProps>>,
    targetVelocity: number,
    limits: EngineeringLimits
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];
    const entityUpdates: Array<{ id: string; previous: Entity; updates: Partial<Entity> }> = [];

    const entityStore = useEntityStore.getState();

    for (const ductId of ductIds) {
      try {
        const duct = ducts.get(ductId);
        if (!duct) {
          failed.push({ entityId: ductId, error: 'Duct not found' });
          continue;
        }

        const entity = entityStore.byId[ductId];
        if (!entity) {
          failed.push({ entityId: ductId, error: 'Entity not found in store' });
          continue;
        }

        const result = autoSizingService.autoSizeDuct(
          duct,
          { targetVelocity, roundToStandard: true },
          limits
        );

        if (result.success) {
          const updates: Partial<DuctProps> = {};
          if (result.newSize.diameter !== undefined) {
            updates.diameter = result.newSize.diameter;
          }
          if (result.newSize.width !== undefined) {
            updates.width = result.newSize.width;
          }
          if (result.newSize.height !== undefined) {
            updates.height = result.newSize.height;
          }
          updates.autoSized = true;

          const newEngineeringData = parametricUpdateService.updateDuctCalculations(
            { ...duct, ...updates },
            limits
          );

          entityUpdates.push({
            id: ductId,
            previous: entity,
            updates: {
              props: {
                ...(entity as Duct).props,
                ...updates,
                engineeringData: newEngineeringData,
              },
              modifiedAt: new Date().toISOString(),
            } as Partial<Entity>,
          });

          successful.push(ductId);
        } else {
          failed.push({
            entityId: ductId,
            error: result.warnings.join(', ') || 'Auto-sizing failed',
          });
        }
      } catch (error) {
        failed.push({
          entityId: ductId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (entityUpdates.length > 0) {
      BulkOperationsService.applyEntityUpdatesWithUndo(entityUpdates);
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      totalProcessed: ductIds.length,
      duration,
    };
  }

  /**
   * Bulk delete entities
   */
  static async bulkDelete(
    entityIds: string[],
    _options: { confirmationRequired?: boolean } = {}
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];

    const entityStore = useEntityStore.getState();
    const entitiesToDelete: Entity[] = [];

    for (const entityId of entityIds) {
      try {
        const entity = entityStore.byId[entityId];
        if (!entity) {
          failed.push({ entityId, error: 'Entity not found' });
          continue;
        }

        entitiesToDelete.push(entity);
      } catch (error) {
        failed.push({
          entityId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (entitiesToDelete.length > 0) {
      BulkOperationsService.applyEntityDeletionsWithUndo(entitiesToDelete);

      for (const entity of entitiesToDelete) {
        successful.push(entity.id);
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      totalProcessed: entityIds.length,
      duration,
    };
  }

  /**
   * Bulk validate entities
   */
  static async bulkValidate(
    entities: Array<{ id: string; type: 'duct' | 'fitting' | 'equipment' }>,
    limits: EngineeringLimits
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];

    const entityStore = useEntityStore.getState();

    for (const entity of entities) {
      try {
        const entityData = entityStore.byId[entity.id];
        if (!entityData) {
          failed.push({ entityId: entity.id, error: 'Entity not found' });
          continue;
        }

        if (entity.type === 'duct') {
          const duct = entityData as Duct;
          const engineeringData = duct.props.engineeringData;

          if (engineeringData) {
            const dataWithSystem = {
              ...engineeringData,
              systemType: duct.props.systemType,
            };
            const validationStatus = ductValidator.validate(dataWithSystem, limits);

            if (validationStatus.isValid) {
              successful.push(entity.id);
            } else {
              const errorMessages = validationStatus.violations
                .filter(v => v.severity === 'error')
                .map(v => v.message)
                .join('; ');
              failed.push({
                entityId: entity.id,
                error: errorMessages || 'Validation failed',
              });
            }
          } else {
            successful.push(entity.id);
          }
        } else {
          successful.push(entity.id);
        }
      } catch (error) {
        failed.push({
          entityId: entity.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      totalProcessed: entities.length,
      duration,
    };
  }

  /**
   * Bulk apply material
   */
  static async bulkApplyMaterial(
    ductIds: string[],
    material: string
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];

    const entityStore = useEntityStore.getState();
    const entityUpdates: Array<{ id: string; previous: Entity; updates: Partial<Entity> }> = [];

    for (const ductId of ductIds) {
      try {
        const entity = entityStore.byId[ductId];
        if (!entity) {
          failed.push({ entityId: ductId, error: 'Entity not found' });
          continue;
        }

        entityUpdates.push({
          id: ductId,
          previous: entity,
          updates: {
            props: {
              ...entity.props,
              material: material as DuctProps['material'],
            },
            modifiedAt: new Date().toISOString(),
          } as Partial<Entity>,
        });

        successful.push(ductId);
      } catch (error) {
        failed.push({
          entityId: ductId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (entityUpdates.length > 0) {
      BulkOperationsService.applyEntityUpdatesWithUndo(entityUpdates);
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      totalProcessed: ductIds.length,
      duration,
    };
  }

  /**
   * Batch operation with progress callback
   */
  static async bulkOperationWithProgress<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
    onProgress?: (current: number, total: number) => void
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        if (item === undefined) {
          failed.push({
            entityId: `item-${i}`,
            error: 'Item is undefined',
          });
          continue;
        }

        await operation(item);
        successful.push(`item-${i}`);

        if (onProgress) {
          onProgress(i + 1, items.length);
        }
      } catch (error) {
        failed.push({
          entityId: `item-${i}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      totalProcessed: items.length,
      duration,
    };
  }

  /**
   * Apply entity updates to store with undo grouping
   */
  private static applyEntityUpdatesWithUndo(
    updates: Array<{ id: string; previous: Entity; updates: Partial<Entity> }>
  ): void {
    const entityStore = useEntityStore.getState();
    const historyStore = useHistoryStore.getState();

    for (const update of updates) {
      entityStore.updateEntity(update.id, update.updates);
    }

    if (updates.length > 0) {
      const command: ReversibleCommand = {
        id: generateCommandId(),
        type: CommandType.UPDATE_ENTITIES,
        payload: {
          updates: updates.map(u => ({
            id: u.id,
            updates: u.updates,
          })),
        },
        timestamp: Date.now(),
        inverse: {
          id: generateCommandId(),
          type: CommandType.UPDATE_ENTITIES,
          payload: {
            updates: updates.map(u => ({
              id: u.id,
              updates: u.previous,
            })),
          },
          timestamp: Date.now(),
        },
      };

      historyStore.push(command);
    }
  }

  /**
   * Apply entity deletions to store with undo support
   */
  private static applyEntityDeletionsWithUndo(entities: Entity[]): void {
    const entityStore = useEntityStore.getState();
    const historyStore = useHistoryStore.getState();

    const ids = entities.map(e => e.id);
    entityStore.removeEntities(ids);

    if (entities.length > 0) {
      const command: ReversibleCommand = {
        id: generateCommandId(),
        type: CommandType.DELETE_ENTITIES,
        payload: {
          ids,
        },
        timestamp: Date.now(),
        inverse: {
          id: generateCommandId(),
          type: CommandType.CREATE_ENTITIES,
          payload: {
            entities,
          },
          timestamp: Date.now(),
        },
      };

      historyStore.push(command);
    }
  }

  /**
   * Validate entities after update and update their constraint status
   */
  private static async validateEntitiesAfterUpdate(
    entityIds: string[],
    limits: EngineeringLimits
  ): Promise<void> {
    const entityStore = useEntityStore.getState();

    for (const entityId of entityIds) {
      const entity = entityStore.byId[entityId];
      if (!entity || entity.type !== 'duct') {
        continue;
      }

      const duct = entity as Duct;
      const engineeringData = duct.props.engineeringData;

      if (engineeringData) {
        const dataWithSystem = {
          ...engineeringData,
          systemType: duct.props.systemType,
        };
        const validationStatus = ductValidator.validate(dataWithSystem, limits);

        entityStore.updateEntity(entityId, {
          props: {
            ...duct.props,
            constraintStatus: validationStatus,
          },
        } as Partial<Entity>);
      }
    }
  }
}

/**
 * Export singleton instance
 */
export const bulkOperationsService = BulkOperationsService;
