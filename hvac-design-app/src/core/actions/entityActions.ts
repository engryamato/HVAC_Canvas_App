import type { Duct, Entity, Fitting } from '@/core/schema';
import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';
import { updateEntities, updateEntity } from '@/core/commands/entityCommands';
import { useEntityStore } from '@/core/store/entityStore';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import { parametricUpdateService } from '@/core/services/parametric/parametricUpdateService';

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

  if (result.entityUpdates && result.entityUpdates.length > 0) {
    updateEntities(result.entityUpdates);
    return result;
  }

  updateEntity(entityId, { props: nextProps, modifiedAt: nextEntity.modifiedAt }, previous);
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
