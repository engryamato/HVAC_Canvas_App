'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import {
  CatalogEntrySchema,
  ComponentCategorySchema,
  ComponentTemplateSchema,
  SystemProfileSchema,
  type ComponentCategory,
  type ComponentTemplate,
  type SystemProfile,
  type UnifiedComponentDefinition,
} from '@/core/schema/unified-component.schema';
import { useEntityStore } from '@/core/store/entityStore';
import SlideOverEditPanel from './SlideOverEditPanel';

function createBlankEntry(): UnifiedComponentDefinition {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name: 'New Custom Component',
    componentClass: 'accessory',
    category: 'accessory',
    categoryId: 'hangers_supports',
    typeId: 'custom_component',
    type: 'custom_component',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'custom',
    recommendedFittingEntryIds: [],
    recommendedAccessoryEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    pressureClass: 'low',
    engineeringProperties: {
      frictionFactor: 0,
      maxVelocity: 0,
      minVelocity: 0,
      maxPressureDrop: 0,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    tags: ['custom'],
    customFields: {},
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  };
}

function getCategoryColor(id: string): string {
  if (id === 'air_distribution' || id === 'standard_ductwork') {
    return '#2563eb';
  }
  if (id === 'universal_components' || id === 'hangers_supports') {
    return '#64748b';
  }
  return '#64748b';
}

function getCategoryGroups(categories: ComponentCategory[]) {
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

function buildCatalogExportPayload() {
  const store = useUnifiedCatalogStore.getState();

  return {
    version: 'traycer-catalog-export-v1',
    exportedAt: new Date().toISOString(),
    catalogEntries: store.catalogEntries,
    categories: store.categories,
    systemProfiles: store.systemProfiles,
    templates: store.templates,
  };
}

function flattenImportedCategories(categories: unknown[]): ComponentCategory[] {
  const flattened: ComponentCategory[] = [];
  const seen = new Set<string>();

  const visit = (category: unknown, parentId: string | null = null): void => {
    const parsed = ComponentCategorySchema.safeParse(category);
    if (!parsed.success) {
      return;
    }

    const normalized: ComponentCategory = {
      ...parsed.data,
      parentId: parsed.data.parentId ?? parentId,
      subcategories: undefined,
    };

    if (!seen.has(normalized.id)) {
      seen.add(normalized.id);
      flattened.push(normalized);
    }

    for (const child of parsed.data.subcategories ?? []) {
      visit(child, normalized.id);
    }
  };

  for (const category of categories) {
    visit(category);
  }

  return flattened;
}

async function hydrateCatalogImport(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<ReturnType<typeof buildCatalogExportPayload>>;
  const store = useUnifiedCatalogStore.getState();

  store.reset();
  store.setEnabled(true);

  for (const category of flattenImportedCategories(parsed.categories ?? [])) {
    store.addCategory(category);
  }

  for (const profile of parsed.systemProfiles ?? []) {
    const parsedProfile = SystemProfileSchema.safeParse(profile);
    if (parsedProfile.success) {
      store.addSystemProfile(parsedProfile.data as SystemProfile);
    }
  }

  for (const template of parsed.templates ?? []) {
    const parsedTemplate = ComponentTemplateSchema.safeParse(template);
    if (parsedTemplate.success) {
      store.addTemplate(parsedTemplate.data as ComponentTemplate);
    }
  }

  for (const entry of parsed.catalogEntries ?? []) {
    const parsedEntry = CatalogEntrySchema.safeParse(entry);
    if (parsedEntry.success) {
      store.addEntry(parsedEntry.data as UnifiedComponentDefinition);
    }
  }
}

function getEntryReferenceCount(entryId: string): number {
  const entities = useEntityStore.getState().byId;

  return Object.values(entities).filter((entity) => {
    const props = entity?.props as Record<string, unknown> | undefined;
    return props?.catalogItemId === entryId || props?.serviceId === entryId;
  }).length;
}

interface ManagePanelProps {
  activeTab?: 'catalog' | 'manage';
  onOpenCatalog?: () => void;
  onOpenManage?: () => void;
}

export function ManagePanel({ activeTab, onOpenCatalog, onOpenManage }: ManagePanelProps = {}) {
  const activeLeftTab = useLayoutStore((state) => state.activeLeftTab);
  const setActiveLeftTab = useLayoutStore((state) => state.setActiveLeftTab);

  const entries = useUnifiedCatalogStore((state) => state.catalogEntries);
  const categories = useUnifiedCatalogStore((state) => state.categories);
  const searchQuery = useUnifiedCatalogStore((state) => state.searchQuery);
  const setSearchQuery = useUnifiedCatalogStore((state) => state.setSearchQuery);
  const selectedCategoryId = useUnifiedCatalogStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useUnifiedCatalogStore((state) => state.setSelectedCategory);
  const selectEntry = useUnifiedCatalogStore((state) => state.selectEntry);
  const addEntry = useUnifiedCatalogStore((state) => state.addEntry);
  const updateEntry = useUnifiedCatalogStore((state) => state.updateEntry);
  const deleteEntry = useUnifiedCatalogStore((state) => state.deleteEntry);
  const cloneEntry = useUnifiedCatalogStore((state) => state.cloneEntry);
  const customizeEntry = useUnifiedCatalogStore((state) => state.customizeEntry);
  const pendingEditEntryId = useUnifiedCatalogStore((state) => state.pendingEditEntryId);
  const clearPendingEditEntry = useUnifiedCatalogStore((state) => state.clearPendingEditEntry);
  const activeEntryId = useUnifiedCatalogStore((state) => state.activeEntryId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorEntryId, setEditorEntryId] = useState<string | null>(null);
  const [expandedRootIds, setExpandedRootIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const currentTab = activeTab ?? activeLeftTab;
  const openCatalog = useMemo(() => onOpenCatalog ?? (() => setActiveLeftTab('catalog')), [onOpenCatalog, setActiveLeftTab]);
  const openManage = useMemo(() => onOpenManage ?? (() => setActiveLeftTab('manage')), [onOpenManage, setActiveLeftTab]);
  const importInputRef = useRef<HTMLInputElement>(null);

  const { roots, byParent } = useMemo(() => getCategoryGroups(categories), [categories]);

  useEffect(() => {
    if (expandedRootIds.length === 0 && roots.length > 0) {
      setExpandedRootIds(roots.map((category) => category.id));
    }
  }, [expandedRootIds.length, roots]);

  useEffect(() => {
    if (pendingEditEntryId) {
      setSelectedId(pendingEditEntryId);
      setEditorEntryId(pendingEditEntryId);
      openManage();
    }
  }, [openManage, pendingEditEntryId]);

  useEffect(() => {
    const activeEntry = entries.find((entry) => entry.id === activeEntryId);
    if (!selectedId && activeEntry) {
      setSelectedId(activeEntry.id);
    }
  }, [activeEntryId, entries, selectedId]);

  useEffect(() => {
    if (currentTab === 'manage' && selectedId && editorEntryId === null) {
      setEditorEntryId(selectedId);
    }
  }, [currentTab, editorEntryId, selectedId]);

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      if (selectedCategoryId && entry.categoryId !== selectedCategoryId) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        entry.name.toLowerCase().includes(query) ||
        entry.typeId.toLowerCase().includes(query) ||
        entry.categoryId.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query) === true ||
        entry.manufacturer?.toLowerCase().includes(query) === true ||
        entry.model?.toLowerCase().includes(query) === true ||
        entry.tags?.some((tag) => tag.toLowerCase().includes(query)) === true
      );
    });
  }, [entries, searchQuery, selectedCategoryId]);

  const selectedEntry = useMemo(
    () => visibleEntries.find((entry) => entry.id === selectedId) ?? entries.find((entry) => entry.id === selectedId),
    [entries, selectedId, visibleEntries]
  );

  const isEditing = Boolean(selectedEntry && editorEntryId === selectedEntry.id);

  const openEntry = (entry: UnifiedComponentDefinition) => {
    setSelectedId(entry.id);
    selectEntry(entry.id);
    setEditorEntryId(currentTab === 'manage' ? entry.id : null);
  };

  const handleCreate = () => {
    const next = createBlankEntry();
    addEntry(next);
    setSelectedId(next.id);
    selectEntry(next.id);
    openManage();
    setEditorEntryId(next.id);
  };

  const handleExport = () => {
    const payload = buildCatalogExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `traycer-catalog-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setIsImporting(true);
    try {
      await hydrateCatalogImport(file);
    } catch (error) {
      console.error('[ManagePanel] Failed to import catalog:', error);
      window.alert('Import failed. Please select a valid Traycer catalog JSON export.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClone = (entry: UnifiedComponentDefinition) => {
    const copyId = cloneEntry(entry.id);
    if (!copyId) {
      return;
    }
    setSelectedId(copyId);
    selectEntry(copyId);
    openManage();
    setEditorEntryId(copyId);
  };

  const handleCustomize = (entry: UnifiedComponentDefinition) => {
    const copyId = customizeEntry(entry.id);
    if (!copyId) {
      return;
    }
    setSelectedId(copyId);
    selectEntry(copyId);
    openManage();
    setEditorEntryId(copyId);
  };

  const handleDelete = (entry: UnifiedComponentDefinition) => {
    const fallbackEntry = visibleEntries.find((item) => item.id !== entry.id) ?? entries.find((item) => item.id !== entry.id);
    deleteEntry(entry.id);
    clearPendingEditEntry();
    setEditorEntryId(null);
    setSelectedId(fallbackEntry?.id ?? null);
    selectEntry(fallbackEntry?.id ?? null);
  };

  const handleSave = (updates: Partial<UnifiedComponentDefinition>) => {
    if (!selectedEntry) {
      return;
    }
    updateEntry(selectedEntry.id, updates);
    clearPendingEditEntry();
    setEditorEntryId(null);
  };

  const selectedEntryReferenceCount = selectedEntry ? getEntryReferenceCount(selectedEntry.id) : 0;

  return (
    <div className="relative flex h-full min-h-[480px] flex-col gap-3 rounded-2xl bg-gradient-to-b from-white via-slate-50 to-white p-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-4 text-white shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Manage Catalog</div>
        <div className="mt-1 text-sm font-semibold">Edit, clone, and organize catalog entries</div>
        <div className="mt-1 text-xs text-slate-300">Customization keeps the control surface inside the sidebar.</div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search entries..."
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isImporting ? 'Importing...' : 'Import'}
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Export
        </button>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Add
        </button>
      </div>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
        aria-label="Import Traycer catalog JSON"
      />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="mb-2 px-2 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Category tree</div>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`mt-2 w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                selectedCategoryId === null
                  ? 'border-sky-500 bg-sky-50 text-sky-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
              data-testid="manage-category-all"
            >
              All components
            </button>
          </div>

          <div className="space-y-2">
            {roots.map((root) => {
              const children = byParent.get(root.id) ?? [];
              const expanded = expandedRootIds.includes(root.id);

              return (
                <section
                  key={root.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2"
                  style={{ borderLeftColor: getCategoryColor(root.id), borderLeftWidth: '4px' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedRootIds((current) =>
                        current.includes(root.id) ? current.filter((id) => id !== root.id) : [...current, root.id]
                      );
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left"
                    data-testid={`manage-category-root-${root.id}`}
                  >
                    <span className="text-sm font-semibold text-slate-900">{root.name}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {children.length}
                    </span>
                  </button>

                  {expanded ? (
                    <div className="mt-1 space-y-1 pl-2">
                      {children.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setSelectedCategory(category.id)}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left text-sm transition ${
                            selectedCategoryId === category.id
                              ? 'bg-white text-sky-900 shadow-sm ring-1 ring-sky-200'
                              : 'text-slate-700 hover:bg-white hover:shadow-sm'
                          }`}
                          data-testid={`manage-category-leaf-${category.id}`}
                        >
                          <span className="min-w-0 truncate">{category.name}</span>
                          {selectedCategoryId === category.id ? (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                              Active
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </aside>

        <section className="min-h-0 space-y-3 overflow-hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {selectedEntry ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Selected entry</div>
                    <h4 className="truncate text-base font-semibold text-slate-900">{selectedEntry.name}</h4>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{selectedEntry.categoryId}</span>
                      <span>•</span>
                      <span>{selectedEntry.engineeringSystem}</span>
                      <span>•</span>
                      <span>{selectedEntry.source === 'custom' ? 'Custom' : 'System'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorEntryId(selectedEntry.id)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    {selectedEntry.source !== 'custom' ? (
                      <button
                        type="button"
                        onClick={() => handleCustomize(selectedEntry)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Customize
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleClone(selectedEntry)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Clone
                    </button>
                    <button
                      type="button"
                      onClick={openCatalog}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Open in Catalog
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Identity</div>
                    <div className="mt-1 text-sm text-slate-800">
                      {selectedEntry.componentClass} · {selectedEntry.typeId}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">System</div>
                    <div className="mt-1 text-sm text-slate-800">
                      {selectedEntry.engineeringSystem} · {selectedEntry.systemType ?? 'n/a'}
                    </div>
                  </div>
                </div>

                {selectedEntryReferenceCount > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    This component is referenced by {selectedEntryReferenceCount} canvas entity
                    {selectedEntryReferenceCount === 1 ? '' : 'ies'}. Deleting it will not update those placements.
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Description</div>
                  <p className="mt-1 text-sm text-slate-700">{selectedEntry.description || 'No description provided.'}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Select an entry to edit it.
              </div>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="mb-2 px-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Component list
            </div>
            <div className="space-y-2">
              {visibleEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => openEntry(entry)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    selectedEntry?.id === entry.id
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  data-testid={`manage-entry-${entry.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{entry.name}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {entry.categoryId.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {entry.componentClass}
                      </span>
                      {entry.source === 'custom' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Custom
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          System
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {visibleEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  No entries match the selected category and search.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {selectedEntry && isEditing ? (
        <SlideOverEditPanel
          entry={selectedEntry}
          onClose={() => {
            clearPendingEditEntry();
            setEditorEntryId(null);
          }}
          onSave={handleSave}
          onCustomize={() => handleCustomize(selectedEntry)}
          onDelete={() => handleDelete(selectedEntry)}
        />
      ) : null}
    </div>
  );
}

export default ManagePanel;
