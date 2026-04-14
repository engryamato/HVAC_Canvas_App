'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { useEntityStore } from '@/core/store/entityStore';
import type {
  CatalogSystemType,
  ComponentClass,
  ComponentCategory,
  SystemProfile,
  UnifiedComponentDefinition,
} from '@/core/schema/unified-component.schema';

const COMPONENT_CLASSES: Array<{ value: ComponentClass; label: string }> = [
  { value: 'duct', label: 'Routing' },
  { value: 'fitting', label: 'Fitting' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'accessory', label: 'Accessory' },
];

const SYSTEM_TYPES: Array<{ value: CatalogSystemType; label: string }> = [
  { value: 'supply', label: 'Supply' },
  { value: 'return', label: 'Return' },
  { value: 'exhaust', label: 'Exhaust' },
  { value: 'outside_air', label: 'Outside Air' },
];

function groupCategories(categories: ComponentCategory[]) {
  const roots = categories.filter((category) => !category.parentId);
  const byParent = new Map<string, ComponentCategory[]>();

  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }
    const siblings = byParent.get(category.parentId) ?? [];
    siblings.push(category);
    byParent.set(category.parentId, siblings);
  }

  return { roots, byParent };
}

function buildEditableSnapshot(entry: Partial<UnifiedComponentDefinition>): string {
  return JSON.stringify({
    name: entry.name ?? '',
    categoryId: entry.categoryId ?? '',
    componentClass: entry.componentClass ?? 'accessory',
    engineeringSystem: entry.engineeringSystem ?? 'standard_duct',
    typeId: entry.typeId ?? '',
    systemType: entry.systemType ?? 'supply',
    manufacturer: entry.manufacturer ?? '',
    model: entry.model ?? '',
    description: entry.description ?? '',
    keySpec: entry.keySpec ?? '',
    primaryMaterial: entry.materials?.[0]?.type ?? entry.materials?.[0]?.name ?? '',
    capacityRating:
      typeof entry.customFields?.capacityRating === 'string'
        ? entry.customFields.capacityRating
        : '',
    fireRating:
      typeof entry.customFields?.fireRating === 'string'
        ? entry.customFields.fireRating
        : '',
    temperatureRating:
      typeof entry.customFields?.temperatureRating === 'string'
        ? entry.customFields.temperatureRating
        : '',
    placeable: entry.placeable ?? true,
    source: entry.source ?? 'custom',
    pressureClass: entry.pressureClass ?? '',
  });
}

function getReferenceCount(entryId: string, byId: ReturnType<typeof useEntityStore.getState>['byId']): number {
  return Object.values(byId).filter((entity) => {
    const props = entity?.props as Record<string, unknown> | undefined;
    return props?.catalogItemId === entryId || props?.serviceId === entryId;
  }).length;
}

interface SlideOverEditPanelProps {
  entry: UnifiedComponentDefinition;
  onClose: () => void;
  onSave: (updates: Partial<UnifiedComponentDefinition>) => void;
  onCustomize: () => void;
  onDelete: () => void;
}

export function SlideOverEditPanel({ entry, onClose, onSave, onCustomize, onDelete }: SlideOverEditPanelProps) {
  const categories = useUnifiedCatalogStore((state) => state.categories);
  const systemProfiles = useUnifiedCatalogStore((state) => state.systemProfiles);
  const entityById = useEntityStore((state) => state.byId);
  const [draft, setDraft] = useState<Partial<UnifiedComponentDefinition>>(entry);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  useEffect(() => {
    setDraft(entry);
    setDeleteConfirmationOpen(false);
  }, [entry]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isReadOnly = entry.source !== 'custom' && !entry.isCustom;

  const selectedSystemProfile = useMemo<SystemProfile | undefined>(() => {
    return systemProfiles.find((profile) => profile.engineeringSystem === (draft.engineeringSystem ?? entry.engineeringSystem));
  }, [draft.engineeringSystem, entry.engineeringSystem, systemProfiles]);

  const archetypeOptions = useMemo(() => {
    const componentClass = (draft.componentClass ?? entry.componentClass) as ComponentClass;
    return selectedSystemProfile?.supportedArchetypes[componentClass] ?? [];
  }, [draft.componentClass, entry.componentClass, selectedSystemProfile]);

  const { roots, byParent } = useMemo(() => groupCategories(categories), [categories]);
  const referenceCount = useMemo(() => getReferenceCount(entry.id, entityById), [entityById, entry.id]);
  const hasUnsavedChanges = useMemo(
    () => !isReadOnly && buildEditableSnapshot(entry) !== buildEditableSnapshot(draft),
    [draft, entry, isReadOnly]
  );

  useEffect(() => {
    if (isReadOnly || archetypeOptions.length === 0) {
      return;
    }

    setDraft((current) => {
      const currentTypeId = current.typeId;
      if (typeof currentTypeId === 'string' && archetypeOptions.includes(currentTypeId)) {
        return current;
      }

      return {
        ...current,
        typeId: archetypeOptions[0],
      };
    });
  }, [archetypeOptions, isReadOnly]);

  const updateField = <K extends keyof UnifiedComponentDefinition>(
    field: K,
    value: UnifiedComponentDefinition[K]
  ) => {
    if (isReadOnly) {
      return;
    }
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateCustomField = (key: string, value: string) => {
    if (isReadOnly) {
      return;
    }

    setDraft((current) => ({
      ...current,
      customFields: {
        ...(current.customFields ?? {}),
        [key]: value,
      },
    }));
  };

  const updatePrimaryMaterial = (value: string) => {
    if (isReadOnly) {
      return;
    }

    setDraft((current) => ({
      ...current,
      materials: value
        ? [
            {
              id: current.materials?.[0]?.id ?? `${entry.id}-material`,
              name: value.replace(/_/g, ' '),
              type: value as NonNullable<UnifiedComponentDefinition['materials']>[number]['type'],
              cost: current.materials?.[0]?.cost ?? 0,
              costUnit: current.materials?.[0]?.costUnit ?? 'piece',
            },
          ]
        : [],
    }));
  };

  const selectedEngineeringSystem = draft.engineeringSystem ?? entry.engineeringSystem;
  const selectedComponentClass = (draft.componentClass ?? entry.componentClass) as ComponentClass;

  const handleSave = () => {
    onSave(draft);
  };

  return (
    <div className="absolute inset-0 z-30">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-over-title"
        className="absolute right-0 top-0 flex h-full w-[min(100%,420px)] flex-col border-l border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Component edit</div>
            <h4 id="slide-over-title" className="text-sm font-semibold text-slate-900">
              {entry.name}
            </h4>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>{entry.engineeringSystem}</span>
              <span>•</span>
              <span>{isReadOnly ? 'System component' : 'Custom component'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-white"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {isReadOnly ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              System components are read-only. Customize creates a custom copy that can be edited here.
            </div>
          ) : null}
          {!isReadOnly && referenceCount > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              This component is referenced by {referenceCount} canvas placement{referenceCount === 1 ? '' : 's'}. Deleting it will leave those placements pointing at a missing catalog item.
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Name</span>
            <input
              value={draft.name ?? ''}
              onChange={(event) => updateField('name', event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Category
            </span>
            <select
              value={draft.categoryId ?? ''}
              onChange={(event) => updateField('categoryId', event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="" disabled>
                Select a category
              </option>
              {roots.map((root) => (
                <optgroup key={root.id} label={root.name}>
                  {(byParent.get(root.id) ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Component class
            </span>
            <select
              value={selectedComponentClass}
              onChange={(event) => updateField('componentClass', event.target.value as ComponentClass)}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            >
              {COMPONENT_CLASSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Engineering system
            </span>
            <select
              value={selectedEngineeringSystem}
              onChange={(event) => updateField('engineeringSystem', event.target.value as UnifiedComponentDefinition['engineeringSystem'])}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            >
              {systemProfiles.map((profile) => (
                <option key={profile.id} value={profile.engineeringSystem}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Archetype / subtype
            </span>
            <select
              value={draft.typeId ?? ''}
              onChange={(event) => updateField('typeId', event.target.value)}
              disabled={isReadOnly || archetypeOptions.length === 0}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="" disabled>
                {archetypeOptions.length > 0 ? 'Select an archetype' : 'No archetypes available'}
              </option>
              {archetypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Populated from the active system profile for the selected component class.
            </p>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              System type
            </span>
            <select
              value={draft.systemType ?? 'supply'}
              onChange={(event) => updateField('systemType', event.target.value as CatalogSystemType)}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            >
              {SYSTEM_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Key spec
            </span>
            <input
              value={draft.keySpec ?? ''}
              onChange={(event) => updateField('keySpec', event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Capacity / load
              </span>
              <input
                value={
                  typeof draft.customFields?.capacityRating === 'string'
                    ? draft.customFields.capacityRating
                    : ''
                }
                onChange={(event) => updateCustomField('capacityRating', event.target.value)}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Material
              </span>
              <input
                value={draft.materials?.[0]?.type ?? draft.materials?.[0]?.name ?? ''}
                onChange={(event) => updatePrimaryMaterial(event.target.value)}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Pressure class
              </span>
              <select
                value={draft.pressureClass ?? 'low'}
                onChange={(event) =>
                  updateField(
                    'pressureClass',
                    event.target.value as UnifiedComponentDefinition['pressureClass']
                  )
                }
                disabled={isReadOnly}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Temperature rating
              </span>
              <input
                value={
                  typeof draft.customFields?.temperatureRating === 'string'
                    ? draft.customFields.temperatureRating
                    : ''
                }
                onChange={(event) => updateCustomField('temperatureRating', event.target.value)}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Fire rating
              </span>
              <input
                value={
                  typeof draft.customFields?.fireRating === 'string'
                    ? draft.customFields.fireRating
                    : ''
                }
                onChange={(event) => updateCustomField('fireRating', event.target.value)}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Manufacturer
            </span>
            <input
              value={draft.manufacturer ?? ''}
              onChange={(event) => updateField('manufacturer', event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Model</span>
            <input
              value={draft.model ?? ''}
              onChange={(event) => updateField('model', event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Description
            </span>
            <textarea
              value={draft.description ?? ''}
              onChange={(event) => updateField('description', event.target.value)}
              disabled={isReadOnly}
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          {deleteConfirmationOpen ? (
            <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2">
              <div className="text-sm font-semibold text-rose-900">Delete this custom component?</div>
              <div className="mt-1 text-xs text-rose-800">
                This removes the entry from the catalog immediately. It cannot be recovered from here.
                {referenceCount > 0 ? (
                  <>
                    {' '}
                    {referenceCount} canvas placement{referenceCount === 1 ? '' : 's'} still reference this component.
                  </>
                ) : null}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmationOpen(false)}
                  className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setDeleteConfirmationOpen(false);
                  }}
                  className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Delete permanently
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {isReadOnly ? (
                <button
                  type="button"
                  onClick={onCustomize}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Customize
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                      Unsaved changes
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmationOpen(true)}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlideOverEditPanel;
