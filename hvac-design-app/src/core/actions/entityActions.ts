import type { Duct, Entity, Fitting } from '@/core/schema';
import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';
import { updateEntities, updateEntity } from '@/core/commands/entityCommands';
import { useEntityStore } from '@/core/store/entityStore';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import {
  parametricUpdateService,
  type ParametricUpdateResult,
} from '@/core/services/parametric/parametricUpdateService';
import {
  applyUserSizeEdit,
  isSizingProvenanceEnabled,
  type SizeField,
} from '@/core/services/sizing/sizingProvenance';

type EntityCommandOptions = Parameters<typeof updateEntity>[3];

export interface EntityActionContext {
  validateField: (field: string, draft: Entity) => boolean;
  engineeringLimits: EngineeringLimits;
}

export interface EntityRegistryActionRunContext {
  entityId: string;
  entitiesById?: Record<string, Entity>;
  options?: EntityCommandOptions;
}

export interface EntityRegistryAction {
  id: string;
  label: string;
  appliesTo(entityType: Entity['type']): boolean;
  isGlobal: false;
  run(ctx: EntityRegistryActionRunContext): void;
}

function cloneEntity<T extends Entity>(entity: T): T {
  return JSON.parse(JSON.stringify(entity)) as T;
}

function getChangedField(changedProps: Partial<Duct['props']>): string | null {
  return Object.keys(changedProps)[0] ?? null;
}

/**
 * Apply a debounced parametric result behind a stale-guard. `baseline` is the
 * entity reference captured BEFORE the (possibly long-debounced) schedule call.
 * entityStore updates entities immutably (entityStore.ts:259-268), so if the
 * live reference is no longer === baseline (or is gone), the duct was
 * moved/edited/deleted by a newer action during the debounce window: the result
 * is built from a stale snapshot and is dropped to avoid clobbering that newer
 * state. A `superseded` result (a newer same-duct edit coalesced this one) is
 * dropped for the same reason — the newer edit owns the write.
 */
function applyGuardedParametricResult(
  entityId: string,
  baseline: Entity,
  result: ParametricUpdateResult,
  fallback: { nextProps: Duct['props']; modifiedAt: string; previous: Entity }
): void {
  if (result.superseded) {
    return;
  }
  if (useEntityStore.getState().byId[entityId] !== baseline) {
    return;
  }
  if (result.entityUpdates && result.entityUpdates.length > 0) {
    updateEntities(result.entityUpdates);
    return;
  }
  updateEntity(
    entityId,
    { props: fallback.nextProps, modifiedAt: fallback.modifiedAt },
    fallback.previous
  );
}

export function validateAndGate(field: string, draft: Entity, ctx: EntityActionContext): boolean {
  return ctx.validateField(field, draft);
}

export async function commitDuctProperty(
  entityId: string,
  changedProps: Partial<Duct['props']>,
  ctx: EntityActionContext,
  opts: { debounceMs?: number } = {}
): Promise<Awaited<ReturnType<typeof parametricUpdateService.scheduleDuctPropertyChange>> | null> {
  const { byId } = useEntityStore.getState();
  const current = byId[entityId];
  if (!current || current.type !== 'duct') {
    return null;
  }

  const previous = cloneEntity(current);
  const nextProps = { ...current.props, ...changedProps } as Duct['props'];
  const nextEntity: Duct = {
    ...current,
    props: nextProps,
    modifiedAt: new Date().toISOString(),
  };

  const changedField = getChangedField(changedProps);
  if (changedField && !validateAndGate(changedField, nextEntity, ctx)) {
    return null;
  }

  const ducts = Object.values(byId).filter((item): item is Duct => item?.type === 'duct');
  const fittings = Object.values(byId).filter((item): item is Fitting => item?.type === 'fitting');
  const result = await parametricUpdateService.scheduleDuctPropertyChange(
    entityId,
    changedProps,
    { ducts, fittings },
    ctx.engineeringLimits,
    'input',
    opts.debounceMs ?? 500
  );

  applyGuardedParametricResult(entityId, current, result, {
    nextProps,
    modifiedAt: nextEntity.modifiedAt,
    previous,
  });
  return result;
}

export async function setSize(
  entityId: string,
  field: SizeField,
  value: number | string | null | undefined,
  ctx: EntityActionContext,
  opts: { debounceMs?: number } = {}
): Promise<Awaited<ReturnType<typeof parametricUpdateService.scheduleDuctPropertyChange>> | null> {
  const normalizedValue =
    value === '' || value === null || value === undefined ? undefined : Number(value);

  if (!isSizingProvenanceEnabled()) {
    return commitDuctProperty(
      entityId,
      { [field]: normalizedValue } as Partial<Duct['props']>,
      ctx,
      opts
    );
  }

  const { byId } = useEntityStore.getState();
  const current = byId[entityId];
  if (!current || current.type !== 'duct') {
    return null;
  }

  if (normalizedValue !== undefined && !Number.isFinite(normalizedValue)) {
    return null;
  }

  const previous = cloneEntity(current);
  const nextProps = applyUserSizeEdit(
    current.props,
    field,
    normalizedValue,
    { limits: ctx.engineeringLimits }
  );
  const nextEntity: Duct = {
    ...current,
    props: nextProps,
    modifiedAt: new Date().toISOString(),
  };

  if (!validateAndGate(field, nextEntity, ctx)) {
    return null;
  }

  const ducts = Object.values(byId).filter((item): item is Duct => item?.type === 'duct');
  const fittings = Object.values(byId).filter((item): item is Fitting => item?.type === 'fitting');
  const result = await parametricUpdateService.scheduleDuctPropertyChange(
    entityId,
    nextProps,
    { ducts, fittings },
    ctx.engineeringLimits,
    'input',
    opts.debounceMs ?? 0
  );

  applyGuardedParametricResult(entityId, current, result, {
    nextProps,
    modifiedAt: nextEntity.modifiedAt,
    previous,
  });
  return result;
}

export function commitEntityProps<T extends Entity>(
  entityId: string,
  nextProps: T extends { props: infer TProps } ? TProps : never,
  previous: T,
  opts?: EntityCommandOptions
): void {
  updateEntity(
    entityId,
    { props: nextProps, modifiedAt: new Date().toISOString() } as Partial<Entity>,
    previous,
    opts
  );
}

export function resetFittingToAuto(
  fittingId: string,
  entitiesById?: Record<string, Entity>,
  options?: EntityCommandOptions
): boolean {
  const reset = fittingInsertionService.planManualOverrideReset(fittingId, entitiesById);
  if (!reset) {
    return false;
  }

  updateEntity(
    reset.next.id,
    {
      props: reset.next.props,
      transform: reset.next.transform,
      modifiedAt: reset.next.modifiedAt,
    },
    reset.previous,
    options ?? {
      selectionBefore: [fittingId],
      selectionAfter: [fittingId],
    }
  );

  return true;
}

export const entityActionRegistry: EntityRegistryAction[] = [
  {
    id: 'reset-fitting-to-auto',
    label: 'Reset to Auto',
    appliesTo: (entityType) => entityType === 'fitting',
    isGlobal: false,
    run: ({ entityId, entitiesById, options }) => {
      resetFittingToAuto(entityId, entitiesById, options);
    },
  },
];
