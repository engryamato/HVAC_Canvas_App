import type { Duct, DuctRun, Entity, Equipment, Fitting, Group } from '@/core/schema';
import type { Command, ReversibleCommand } from './types';
import { CommandType, generateCommandId } from './types';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from './historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useProjectStore } from '@/core/store/project.store';
import {
  useValidationStore,
  type ConstraintViolation,
} from '@/core/store/validationStore';
import { useSettingsStore } from '@/core/store/settingsStore';
import { ConstraintValidationService } from '@/core/services/constraintValidation';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';
import type { ValidationSeverity } from '@/core/schema/duct.schema';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import {
  calculateDuctRuntime,
  calculateEquipmentRuntime,
  calculateFittingRuntime,
} from '@/core/services/calculations/entityCalculationRuntime';
import { createDuct } from '@/features/canvas/entities/ductDefaults';
import { createDuctRun } from '@/features/canvas/entities/ductRunDefaults';
import { feetToPixels } from '@/core/constants/coordinates';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';

interface CommandOptions {
  selectionBefore?: string[];
  selectionAfter?: string[];
}

interface TransformChange {
  id: string;
  from: Entity['transform'];
  to: Entity['transform'];
}

interface TransformCommandPayload {
  transforms: Array<{ id: string; transform: Entity['transform'] }>;
  selection?: string[];
}

interface EntityReplacementPayload {
  createEntities: Entity[];
  removeEntityIds: string[];
  selection?: string[];
}

interface SplitDuctRunOptions extends CommandOptions {
  selectionAfter?: string[];
}

interface SplitDuctRunParams extends SplitDuctRunOptions {
  originalDuctId: string;
  splitPoint: { x: number; y: number };
  branchDuct: Duct | DuctRun;
}

function captureSelection(options?: CommandOptions): { before: string[]; after: string[] } {
  const selectionStore = useSelectionStore.getState();
  const before = options?.selectionBefore ?? [...selectionStore.selectedIds];
  const after = options?.selectionAfter ?? before;

  return { before, after };
}

function getSelectionSnapshot(): string[] {
  return [...useSelectionStore.getState().selectedIds];
}

function applySelection(selection?: string[]): void {
  if (!selection) {
    return;
  }
  useSelectionStore.getState().selectMultiple([...selection]);
}

function executeAndRecord(command: ReversibleCommand): void {
  executeCommand(command);
  useHistoryStore.getState().push(command);
}

function markCanvasWriteModified(modifiedAt = new Date().toISOString()): void {
  useProjectStore.getState().markProjectModified(modifiedAt);
}

function buildReplacementCommand(
  type: typeof CommandType.SPLIT_DUCT_RUN | typeof CommandType.MERGE_DUCT_RUNS,
  createEntities: Entity[],
  removeEntities: Entity[],
  selectionBefore: string[],
  selectionAfter: string[]
): ReversibleCommand {
  return {
    id: generateCommandId(),
    type,
    payload: {
      createEntities,
      removeEntityIds: removeEntities.map((entity) => entity.id),
      selection: selectionAfter,
    } satisfies EntityReplacementPayload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: type === CommandType.SPLIT_DUCT_RUN ? CommandType.MERGE_DUCT_RUNS : CommandType.SPLIT_DUCT_RUN,
      payload: {
        createEntities: removeEntities,
        removeEntityIds: createEntities.map((entity) => entity.id),
        selection: selectionBefore,
      } satisfies EntityReplacementPayload,
      timestamp: Date.now(),
    },
    selectionBefore,
    selectionAfter,
  };
}

function applyEntityReplacement(payload: EntityReplacementPayload): void {
  const entityStore = useEntityStore.getState();

  if (payload.removeEntityIds.length > 0) {
    entityStore.removeEntities(payload.removeEntityIds);
    payload.removeEntityIds.forEach((id) => useValidationStore.getState().clearValidation(id));
  }

  if (payload.createEntities.length > 0) {
    entityStore.addEntities(payload.createEntities);
    payload.createEntities.forEach((entity) => syncEntityValidation(entity));
  }

  applySelection(payload.selection);
}

function cloneDuctWithNewGeometry(
  source: Duct,
  overrides: {
    x: number;
    y: number;
    lengthFeet: number;
    connectedFrom?: string;
    connectedTo?: string;
  }
): Duct {
  const now = new Date().toISOString();
  const duct = createDuct({
    ...source.props,
    x: overrides.x,
    y: overrides.y,
    length: overrides.lengthFeet,
  });

  duct.props = {
    ...JSON.parse(JSON.stringify(source.props)),
    length: overrides.lengthFeet,
    connectedFrom: overrides.connectedFrom,
    connectedTo: overrides.connectedTo,
  };
  // The clone gets new geometry, so it must not inherit the source's authored centerline —
  // let it re-capture its own design fields lazily on first cutback (mirrors the duct_run
  // clone, which resets designStartPoint/designEndPoint/designLength to the split geometry).
  delete duct.props.designStartPoint;
  delete duct.props.designEndPoint;
  delete duct.props.designLength;
  duct.transform = {
    ...source.transform,
    x: overrides.x,
    y: overrides.y,
  };
  duct.createdAt = now;
  duct.modifiedAt = now;

  return duct;
}

function cloneDuctRunWithNewGeometry(
  source: DuctRun,
  overrides: {
    x: number;
    y: number;
    splitPoint?: { x: number; y: number };
    lengthFeet: number;
    connectedFrom?: string;
    connectedTo?: string;
  }
): DuctRun {
  const now = new Date().toISOString();
  const run = createDuctRun({
    x: overrides.x,
    y: overrides.y,
    shape: source.props.shape,
    installLength: overrides.lengthFeet,
    material: source.props.material,
    airflow: source.props.airflow,
    staticPressure: source.props.staticPressure,
    serviceId: source.props.serviceId,
    catalogItemId: source.props.catalogItemId,
    engineeringSystem: source.props.engineeringSystem,
    specialtyToolId: source.props.specialtyToolId,
    sectionLengthOverride: source.props.sectionLengthOverride,
    diameter: 'diameter' in source.props ? source.props.diameter : undefined,
    width: 'width' in source.props ? source.props.width : undefined,
    height: 'height' in source.props ? source.props.height : undefined,
  });

  const directionRadians = (source.transform.rotation * Math.PI) / 180;
  const endPoint = overrides.splitPoint ?? {
    x: overrides.x + feetToPixels(overrides.lengthFeet) * Math.cos(directionRadians),
    y: overrides.y + feetToPixels(overrides.lengthFeet) * Math.sin(directionRadians),
  };
  const sectionLength = getActiveSectionLength(source);

  run.props = {
    ...JSON.parse(JSON.stringify(source.props)),
    installLength: overrides.lengthFeet,
    startPoint: { x: overrides.x, y: overrides.y },
    endPoint,
    designStartPoint: { x: overrides.x, y: overrides.y },
    designEndPoint: { ...endPoint },
    designLength: overrides.lengthFeet,
    connectedFrom: overrides.connectedFrom,
    connectedTo: overrides.connectedTo,
    segments: recomputeDuctRunSegments(overrides.lengthFeet, sectionLength, {
      insulationType: source.props.insulationType,
      insulationThickness: source.props.insulationThickness,
      startEndType: source.props.startEndType,
      endEndType: source.props.endEndType,
    }),
  };
  run.transform = {
    ...source.transform,
    x: overrides.x,
    y: overrides.y,
  };
  run.createdAt = now;
  run.modifiedAt = now;

  return run;
}

export function splitDuctRunAtPoint(params: SplitDuctRunParams): boolean {
  const entities = useEntityStore.getState().byId as Record<string, Entity>;
  const original = entities[params.originalDuctId];
  if (!original || (original.type !== 'duct' && original.type !== 'duct_run')) {
    return false;
  }

  const startPoint = { x: original.transform.x, y: original.transform.y };
  const dx = params.splitPoint.x - startPoint.x;
  const dy = params.splitPoint.y - startPoint.y;
  const splitLengthPixels = Math.hypot(dx, dy);
  const totalLengthFeet = original.type === 'duct' ? original.props.length : original.props.installLength;
  const totalLengthPixels = feetToPixels(totalLengthFeet);
  if (totalLengthFeet <= 0) {
    return false;
  }

  const splitRatio = splitLengthPixels / totalLengthPixels;
  if (splitRatio <= 0 || splitRatio >= 1) {
    return false;
  }

  const upstreamLengthFeet = totalLengthFeet * splitRatio;
  const downstreamLengthFeet = totalLengthFeet - upstreamLengthFeet;
  if (upstreamLengthFeet <= 0 || downstreamLengthFeet <= 0) {
    return false;
  }

  const upstream =
    original.type === 'duct'
      ? cloneDuctWithNewGeometry(original as Duct, {
          x: original.transform.x,
          y: original.transform.y,
          lengthFeet: upstreamLengthFeet,
          connectedFrom: (original as Duct).props.connectedFrom,
          connectedTo: undefined,
        })
      : cloneDuctRunWithNewGeometry(original as DuctRun, {
          x: original.transform.x,
          y: original.transform.y,
          splitPoint: params.splitPoint,
          lengthFeet: upstreamLengthFeet,
          connectedFrom: (original as DuctRun).props.connectedFrom,
          connectedTo: undefined,
        });
  const downstream =
    original.type === 'duct'
      ? cloneDuctWithNewGeometry(original as Duct, {
          x: params.splitPoint.x,
          y: params.splitPoint.y,
          lengthFeet: downstreamLengthFeet,
          connectedFrom: undefined,
          connectedTo: (original as Duct).props.connectedTo,
        })
      : cloneDuctRunWithNewGeometry(original as DuctRun, {
          x: params.splitPoint.x,
          y: params.splitPoint.y,
          lengthFeet: downstreamLengthFeet,
          connectedFrom: undefined,
          connectedTo: (original as DuctRun).props.connectedTo,
        });

  const branch = params.branchDuct;

  if (upstream.type === 'duct' && downstream.type === 'duct') {
    upstream.props.connectedTo = downstream.id;
    downstream.props.connectedFrom = upstream.id;
  } else if (upstream.type === 'duct_run' && downstream.type === 'duct_run') {
    upstream.props.connectedTo = downstream.id;
    downstream.props.connectedFrom = upstream.id;
  }

  const workingEntities: Record<string, Entity> = {
    ...entities,
    [upstream.id]: upstream,
    [downstream.id]: downstream,
    [branch.id]: branch,
  };
  delete workingEntities[original.id];

  const insertionPlan = fittingInsertionService.planAutoInsertForDuct(branch.id, workingEntities);
  const createEntities = [upstream, downstream, branch, ...insertionPlan.insertions];
  const removeEntities = [original];
  const selection = captureSelection(params);
  const nextSelection = params.selectionAfter ?? [branch.id];
  const command = buildReplacementCommand(
    CommandType.SPLIT_DUCT_RUN,
    createEntities,
    removeEntities,
    selection.before,
    nextSelection
  );

  executeAndRecord(command);
  return true;
}

let isApplyingValidationMutation = false;

function toConstraintSeverity(severity: 'warning' | 'blocker'): ValidationSeverity {
  return severity === 'blocker' ? 'error' : 'warning';
}

function resolveServiceById(serviceId: string) {
  const component = useComponentLibraryStoreV2.getState().getComponent(serviceId);
  if (!component) {
    return null;
  }

  return adaptComponentToService(component);
}

function isConstraintCarrier(entity: Entity): entity is Duct | Equipment | Fitting {
  return entity.type === 'duct' || entity.type === 'equipment' || entity.type === 'fitting';
}

function getEntityServiceId(entity: Entity): string | undefined {
  if (!('props' in entity) || !entity.props || typeof entity.props !== 'object') {
    return undefined;
  }

  const serviceId = (entity.props as Record<string, unknown>).serviceId;
  return typeof serviceId === 'string' ? serviceId : undefined;
}

function buildRuntimeViolations(entity: Entity): ConstraintViolation[] {
  const entitiesById = useEntityStore.getState().byId;

  if (entity.type === 'duct') {
    const duct = entity as Duct;
    return calculateDuctRuntime(duct).complianceWarnings.map((message, index) => ({
      ruleId: `engine-runtime-duct-${index}`,
      type: 'engine-runtime',
      message,
      severity: 'warning',
    }));
  }

  if (entity.type === 'fitting') {
    const fitting = entity as Fitting;
    const runtime = calculateFittingRuntime(fitting, entitiesById);
    const violations: ConstraintViolation[] = runtime.complianceWarnings.map((message, index) => ({
      ruleId: `engine-runtime-fitting-${index}`,
      type: 'engine-runtime',
      message,
      severity: 'warning',
    }));

    return violations;
  }

  if (entity.type === 'equipment') {
    const equipment = entity as Equipment;
    const runtime = calculateEquipmentRuntime(equipment, entitiesById);
    const violations: ConstraintViolation[] = runtime.complianceWarnings.map((message, index) => ({
      ruleId: `engine-runtime-equipment-${index}`,
      type: 'engine-runtime',
      message,
      severity: 'warning',
    }));

    if (
      equipment.props.engineeringSystem === 'universal' &&
      typeof equipment.props.loadRating === 'number' &&
      typeof runtime.loadRating === 'number' &&
      runtime.loadRating > equipment.props.loadRating
    ) {
      violations.push({
        ruleId: 'support-load-rating',
        type: 'support-load-rating',
        message: `Calculated support load ${runtime.loadRating.toFixed(1)} exceeds rated load ${equipment.props.loadRating.toFixed(1)}.`,
        suggestedFix: 'Select a higher-capacity support assembly or reduce spacing.',
        severity: 'blocker',
      });
    }

    if (
      equipment.props.engineeringSystem === 'universal' &&
      typeof runtime.spacing === 'number' &&
      equipment.props.spacingRule
    ) {
      violations.push({
        ruleId: 'support-spacing-guidance',
        type: 'support-spacing-guidance',
        message: `Computed support spacing is ${runtime.spacing.toFixed(1)} ft for the connected run.`,
        suggestedFix: `Verify the configured spacing rule "${equipment.props.spacingRule}" matches this run.`,
        severity: 'warning',
      });
    }

    return violations;
  }

  return [];
}

function applyConstraintValidation(entity: Duct | Equipment | Fitting, violations: ConstraintViolation[]): void {
  const warningMessages = violations.map((violation) => violation.message);
  const currentWarnings = ((entity as { warnings?: Record<string, unknown> }).warnings ?? {}) as Record<string, unknown>;
  const nextWarnings = { ...currentWarnings };
  if (warningMessages.length > 0) {
    nextWarnings.constraintViolations = warningMessages;
  } else {
    delete nextWarnings.constraintViolations;
  }
  const constraintStatus = {
    isValid: violations.length === 0,
    violations: violations.map((violation) => ({
      type: violation.type ?? violation.ruleId,
      severity: toConstraintSeverity(violation.severity),
      message: violation.message,
      suggestedFix: violation.suggestedFix,
    })),
    lastValidated: new Date(),
  };

  isApplyingValidationMutation = true;
  try {
    useEntityStore.getState().updateEntity(entity.id, {
      props: {
        ...entity.props,
        constraintStatus,
      },
      warnings: Object.keys(nextWarnings).length > 0 ? nextWarnings : undefined,
      modifiedAt: new Date().toISOString(),
    } as Partial<Entity>);
  } finally {
    isApplyingValidationMutation = false;
  }
}

function validateGroupEntity(entity: Group): void {
  const childViolations = entity.props.childIds.flatMap((childId) => {
    const childResult = useValidationStore.getState().validationResults[childId];
    return childResult?.violations ?? [];
  });

  if (childViolations.length === 0) {
    useValidationStore.getState().clearValidation(entity.id);
    return;
  }

  useValidationStore.getState().setValidationResult(entity.id, {
    entityId: entity.id,
    violations: childViolations.map((violation, index) => ({
      ...violation,
      ruleId: `${violation.ruleId}-group-${index}`,
    })),
    catalogStatus: 'resolved',
    lastValidated: new Date(),
  });
}

export function validateAndRecord(entityId: string): void {
  const entity = useEntityStore.getState().byId[entityId];
  const validationStore = useValidationStore.getState();
  if (!entity) {
    validationStore.clearValidation(entityId);
    return;
  }

  if (entity.type === 'group') {
    validateGroupEntity(entity);
    return;
  }

  const serviceId = getEntityServiceId(entity);
  const runtimeViolations = buildRuntimeViolations(entity);

  if (entity.type !== 'duct') {
    if (!serviceId && runtimeViolations.length === 0) {
      validationStore.clearValidation(entity.id);
      return;
    }

    if (runtimeViolations.length === 0) {
      validationStore.setValidationResult(entity.id, {
        entityId: entity.id,
        serviceId,
        violations: [],
        catalogStatus: 'resolved',
        lastValidated: new Date(),
      });
    } else {
      validationStore.setValidationResult(entity.id, {
        entityId: entity.id,
        serviceId,
        violations: runtimeViolations,
        catalogStatus: 'resolved',
        lastValidated: new Date(),
      });
    }

    if (isConstraintCarrier(entity)) {
      applyConstraintValidation(entity, runtimeViolations);
    }
    return;
  }

  if (!serviceId && runtimeViolations.length === 0) {
    validationStore.clearValidation(entity.id);
    return;
  }

  const service = serviceId ? resolveServiceById(serviceId) : null;
  if (!service && runtimeViolations.length === 0) {
    validationStore.clearValidation(entity.id);
    return;
  }

  const engineeringLimits = useSettingsStore.getState().calculationSettings.engineeringLimits;
  const violations = service
    ? ConstraintValidationService.validateDuct(entity.props, service, { engineeringLimits })
    : [];

  const normalizedViolations = [
    ...violations.map((violation) => ({
      ...violation,
      severity: violation.severity ?? 'warning',
    })),
    ...runtimeViolations,
  ];

  if (normalizedViolations.length === 0) {
    validationStore.clearValidation(entity.id);
  } else {
    validationStore.setValidationResult(entity.id, {
      entityId: entity.id,
      serviceId,
      violations: normalizedViolations,
      catalogStatus: 'resolved',
      lastValidated: new Date(),
    });
  }

  applyConstraintValidation(entity as Duct, normalizedViolations);
}

function syncEntityValidation(entity: Entity): void {
  validateAndRecord(entity.id);
}

function syncEntityValidationById(entityId: string): void {
  const entity = useEntityStore.getState().byId[entityId];
  if (!entity) {
    useValidationStore.getState().clearValidation(entityId);
    return;
  }
  syncEntityValidation(entity);
}

/**
 * Create a new entity on the canvas
 * Pushes a reversible command to history for undo support
 */
export function createEntity(entity: Entity, options?: CommandOptions): void {
  const selection = captureSelection(options);

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.CREATE_ENTITY,
    payload: { entity, selection: [entity.id] },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.DELETE_ENTITY,
      payload: { entityId: entity.id, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    // After redo, the created entity should be selected
    selectionAfter: options?.selectionAfter ?? [entity.id],
  };

  // Execute command
  useEntityStore.getState().addEntity(entity);
  syncEntityValidation(entity);
  useSelectionStore.getState().select(entity.id);

  // Push to history
  useHistoryStore.getState().push(command);
  markCanvasWriteModified(entity.modifiedAt);
}

/**
 * Create multiple entities at once with a single history entry
 */
export function createEntities(entities: Entity[]): void {
  if (entities.length === 0) {
    return;
  }

  const selectionBefore = getSelectionSnapshot();
  const selectionAfter = entities.map((entity) => entity.id);

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.CREATE_ENTITIES,
    payload: { entities, selection: selectionAfter },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.DELETE_ENTITIES,
      payload: { entityIds: entities.map((entity) => entity.id), selection: selectionBefore },
      timestamp: Date.now(),
    },
  };

  useEntityStore.getState().addEntities(entities);
  entities.forEach((entity) => syncEntityValidation(entity));
  useSelectionStore.getState().selectMultiple(selectionAfter);
  useHistoryStore.getState().push(command);
  markCanvasWriteModified();
}

/**
 * Update an existing entity
 * Stores the previous state for undo support
 * Can be called with just the updated entity (will fetch previous state from store)
 */
export function updateEntity(
  entityOrId: Entity | string,
  updates?: Partial<Entity>,
  previousState?: Entity,
  options?: CommandOptions
): void {
  // Support both calling styles:
  // updateEntity(entity) - pass complete updated entity
  // updateEntity(id, updates, previousState) - legacy style
  let id: string;
  let actualUpdates: Partial<Entity>;
  let actualPreviousState: Entity;

  if (typeof entityOrId === 'string') {
    id = entityOrId;
    actualUpdates = updates!;
    actualPreviousState = previousState!;
  } else {
    id = entityOrId.id;
    const previous = useEntityStore.getState().byId[id];
    if (!previous) {
      return;
    }
    actualPreviousState = previous;
    actualUpdates = entityOrId;
  }

  const selection = captureSelection(options);

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.UPDATE_ENTITY,
    payload: { id, updates: actualUpdates, selection: selection.before },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.UPDATE_ENTITY,
      payload: { id, updates: actualPreviousState, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    selectionAfter: selection.after,
  };

  executeAndRecord(command);
}

/**
 * Update multiple entities in a single atomic command.
 */
export function updateEntities(
  updates: Array<{ id: string; updates: Partial<Entity>; previous: Entity }>,
  options?: CommandOptions
): void {
  if (updates.length === 0) {
    return;
  }

  const selection = captureSelection(options);

  const payload = {
    updates: updates.map((item) => ({ id: item.id, updates: item.updates })),
    selection: selection.before,
  };

  const inversePayload = {
    updates: updates.map((item) => ({ id: item.id, updates: item.previous })),
    selection: selection.before,
  };

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.UPDATE_ENTITIES,
    payload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.UPDATE_ENTITIES,
      payload: inversePayload,
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    selectionAfter: selection.after,
  };

  executeAndRecord(command);
}

/**
 * Delete an entity from the canvas
 * Stores the entity for undo support
 * Can be called with either entity ID (string) or Entity object
 */
export function deleteEntity(entityOrId: Entity | string, options?: CommandOptions): void {
  // Support both calling styles:
  // deleteEntity('entity-id') - pass string ID
  // deleteEntity(entity) - pass Entity object
  let entity: Entity;
  let entityId: string;

  if (typeof entityOrId === 'string') {
    entityId = entityOrId;
    const storedEntity = useEntityStore.getState().byId[entityId];
    if (!storedEntity) {
      return; // Entity doesn't exist
    }
    entity = storedEntity;
  } else {
    entity = entityOrId;
    entityId = entity.id;
  }

  const selection = captureSelection(options);
  const nextSelection = selection.after.filter((id) => id !== entityId);

  if (entity.type === 'duct') {
    const linkedAutoFittings = fittingInsertionService
      .getAutoInsertedFittingsForDuct(entityId)
      .filter((fitting) => fitting.id !== entityId);

    for (const fitting of linkedAutoFittings) {
      deleteEntity(fitting, { selectionBefore: selection.before, selectionAfter: nextSelection });
    }
  }

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITY,
    payload: { entityId, selection: nextSelection },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITY,
      payload: { entity, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    selectionAfter: nextSelection,
  };

  useEntityStore.getState().removeEntity(entityId);
  useValidationStore.getState().clearValidation(entityId);
  applySelection(nextSelection);
  useHistoryStore.getState().push(command);
  markCanvasWriteModified();
}

/**
 * Delete multiple entities at once
 * Creates a single undoable command for all deletions
 */
export function deleteEntities(entities: Entity[], options?: CommandOptions): void {
  if (entities.some((entity) => entity.type === 'duct')) {
    const selection = captureSelection(options);
    const remainingSelection = selection.after.filter((id) => !entities.some((entity) => entity.id === id));
    const sortedEntities = [...entities].sort((a, b) => a.id.localeCompare(b.id));

    for (const entity of sortedEntities) {
      deleteEntity(entity, { selectionBefore: selection.before, selectionAfter: remainingSelection });
    }
    return;
  }

  const selection = captureSelection(options);
  const entityIds = entities.map((e) => e.id);
  const remainingSelection = selection.after.filter((id) => !entityIds.includes(id));

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITIES,
    payload: { entityIds, selection: remainingSelection },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITIES,
      payload: { entities, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    selectionAfter: remainingSelection,
  };

  useEntityStore.getState().removeEntities(entityIds);
  entityIds.forEach((id) => useValidationStore.getState().clearValidation(id));
  applySelection(remainingSelection);
  useHistoryStore.getState().push(command);
  markCanvasWriteModified();
}

/**
 * Record a set of transform changes as a single move command
 * The entities are assumed to already be at their `to` position.
 */
export function moveEntities(changes: TransformChange[]): void {
  if (changes.length === 0) {
    return;
  }

  const selectionSnapshot = getSelectionSnapshot();

  const payload: TransformCommandPayload = {
    transforms: changes.map((change) => ({ id: change.id, transform: change.to })),
    selection: selectionSnapshot,
  };

  const inversePayload: TransformCommandPayload = {
    transforms: changes.map((change) => ({ id: change.id, transform: change.from })),
    selection: selectionSnapshot,
  };

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.MOVE_ENTITY,
    payload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.MOVE_ENTITY,
      payload: inversePayload,
      timestamp: Date.now(),
    },
  };

  const entityStore = useEntityStore.getState();
  payload.transforms.forEach(({ id, transform }) => {
    entityStore.updateEntity(id, { transform });
  });

  useHistoryStore.getState().push(command);
  markCanvasWriteModified();
}

/**
 * Execute undo operation
 * Returns true if undo was successful
 */
export function undo(): boolean {
  const command = useHistoryStore.getState().undo();
  if (!command) {
    return false;
  }

  executeCommand(command.inverse);
  applySelection(command.selectionBefore);
  return true;
}

/**
 * Execute redo operation
 * Returns true if redo was successful
 */
export function redo(): boolean {
  const command = useHistoryStore.getState().redo();
  if (!command) {
    return false;
  }

  executeCommand(command);
  applySelection(command.selectionAfter ?? command.selectionBefore);
  return true;
}

/**
 * Execute a command without pushing to history
 * Used for undo/redo operations
 */
function executeCommand(command: Command): void {
  const entityStore = useEntityStore.getState();

  switch (command.type) {
    case CommandType.CREATE_ENTITY:
      entityStore.addEntity((command.payload as { entity: Entity }).entity);
      syncEntityValidation((command.payload as { entity: Entity }).entity);
      applySelection((command.payload as { selection?: string[] }).selection);
      break;

    case CommandType.DELETE_ENTITY:
      entityStore.removeEntity((command.payload as { entityId: string }).entityId);
      useValidationStore.getState().clearValidation((command.payload as { entityId: string }).entityId);
      applySelection((command.payload as { selection?: string[] }).selection);
      break;

    case CommandType.UPDATE_ENTITY: {
      const { id, updates, selection } = command.payload as {
        id: string;
        updates: Partial<Entity>;
        selection?: string[];
      };
      entityStore.updateEntity(id, updates);
      syncEntityValidationById(id);
      applySelection(selection);
      break;
    }

    case CommandType.UPDATE_ENTITIES: {
      const { updates, selection } = command.payload as {
        updates: Array<{ id: string; updates: Partial<Entity> }>;
        selection?: string[];
      };

      updates.forEach(({ id, updates: entityUpdates }) => {
        entityStore.updateEntity(id, entityUpdates);
        syncEntityValidationById(id);
      });

      applySelection(selection);
      break;
    }

    case CommandType.CREATE_ENTITIES: {
      const { entities, selection } = command.payload as { entities: Entity[]; selection?: string[] };
      entityStore.addEntities(entities);
      entities.forEach((entity) => syncEntityValidation(entity));
      applySelection(selection);
      break;
    }

    case CommandType.DELETE_ENTITIES: {
      const { entityIds, selection } = command.payload as { entityIds: string[]; selection?: string[] };
      entityStore.removeEntities(entityIds);
      entityIds.forEach((id) => useValidationStore.getState().clearValidation(id));
      applySelection(selection);
      break;
    }

    case CommandType.SPLIT_DUCT_RUN:
    case CommandType.MERGE_DUCT_RUNS:
      applyEntityReplacement(command.payload as EntityReplacementPayload);
      break;

    case CommandType.MOVE_ENTITY:
    case CommandType.MOVE_ENTITIES: {
      const { transforms, selection } = command.payload as TransformCommandPayload;

      transforms.forEach(({ id, transform }) => {
        entityStore.updateEntity(id, { transform });
      });

      applySelection(selection);
      break;
    }
  }

  markCanvasWriteModified();
}

if (typeof window !== 'undefined') {
  let previousById = useEntityStore.getState().byId;
  useEntityStore.subscribe((state) => {
    if (isApplyingValidationMutation) {
      previousById = state.byId;
      return;
    }

    const changedEntityIds: string[] = [];
    const seen = new Set<string>([
      ...Object.keys(previousById),
      ...Object.keys(state.byId),
    ]);

    seen.forEach((entityId) => {
      if (previousById[entityId] !== state.byId[entityId]) {
        changedEntityIds.push(entityId);
      }
    });

    changedEntityIds.forEach((entityId) => {
      validateAndRecord(entityId);
    });

    previousById = state.byId;
  });
}
