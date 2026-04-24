'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import type {
  CatalogSystemType,
  ComponentCategory,
  UnifiedComponentDefinition,
} from '@/core/schema/unified-component.schema';
import { HvacCatalogIcon, resolveCatalogEntryIconKey } from './catalogIcons';

const SYSTEM_TYPE_OPTIONS: Array<{ value: CatalogSystemType; label: string; color: string }> = [
  { value: 'supply', label: 'Supply', color: '#2563eb' },
  { value: 'return', label: 'Return', color: '#16a34a' },
  { value: 'exhaust', label: 'Exhaust', color: '#ea580c' },
  { value: 'outside_air', label: 'Outside Air', color: '#0f766e' },
];

const COMPONENT_CLASS_LABELS: Record<UnifiedComponentDefinition['componentClass'], string> = {
  duct: 'Routing',
  fitting: 'Fitting',
  equipment: 'Equipment',
  accessory: 'Accessory',
};

function summarizeCompatibility(
  ids: string[] | undefined,
  catalogEntries: UnifiedComponentDefinition[],
  limit = 3
): string | null {
  if (!ids || ids.length === 0) {
    return null;
  }

  const names = ids
    .map((id) => catalogEntries.find((entry) => entry.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) {
    return null;
  }

  const visible = names.slice(0, limit);
  const remaining = names.length - visible.length;
  return remaining > 0 ? `${visible.join(', ')} +${remaining} more` : visible.join(', ');
}

function getCategoryColor(id: string): string {
  if (id === 'air_distribution' || id === 'standard_ductwork') {
    return '#2563eb';
  }
  if (
    id === 'specialty_exhaust' ||
    id === 'boiler_flue' ||
    id === 'grease_duct' ||
    id === 'generator_exhaust'
  ) {
    return '#ea580c';
  }
  if (id === 'universal_components' || id === 'hangers_supports') {
    return '#64748b';
  }
  return '#0f766e';
}

function CatalogCard({
  entry,
  active,
  onSelect,
  onClone,
  onCustomize,
  onEdit,
  onDelete,
}: {
  entry: UnifiedComponentDefinition;
  active: boolean;
  onSelect: () => void;
  onClone: () => void;
  onCustomize: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const iconKey = resolveCatalogEntryIconKey(entry);
  const specPreview = entry.keySpec ?? entry.description ?? entry.typeId;
  const detailPreview =
    [entry.systemType, entry.manufacturer, entry.model].filter(Boolean).join(' · ') ||
    entry.categoryId.replace(/_/g, ' ');

  const closeMenu = () => {
    setMenuOpen(false);
    setDeleteConfirmOpen(false);
  };

  return (
    <article
      className={`group relative rounded-2xl border p-3 transition-all ${
        active ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 text-left">
        <span
          className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: getCategoryColor(entry.categoryId) }}
        >
          <HvacCatalogIcon
            iconKey={iconKey}
            size={18}
            strokeWidth={2.25}
            aria-hidden
            data-testid={`catalog-card-icon-${entry.id}`}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900">{entry.name}</span>
          <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {entry.categoryId.replace(/_/g, ' ')}
          </span>
          <span className="mt-2 inline-flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
              {COMPONENT_CLASS_LABELS[entry.componentClass]}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {entry.placeable ? 'Placeable' : 'Managed'}
            </span>
          </span>
          <span className="mt-2 block text-xs font-medium text-slate-700">{specPreview}</span>
          <span className="mt-1 block text-[11px] text-slate-500">{detailPreview}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setMenuOpen((value) => !value);
          setDeleteConfirmOpen(false);
        }}
        className="absolute right-2 top-2 rounded-md px-2 py-1 text-slate-500 opacity-0 transition hover:bg-slate-100 hover:text-slate-900 group-hover:opacity-100"
        aria-label={`Open actions for ${entry.name}`}
      >
        ⋮
      </button>

      {menuOpen ? (
        <div className="absolute right-2 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            onClick={() => {
              onClone();
              closeMenu();
            }}
          >
            Clone
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            onClick={() => {
              onCustomize();
              closeMenu();
            }}
          >
            Customize
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            onClick={() => {
              onEdit();
              closeMenu();
            }}
          >
            Edit in Manage
          </button>
          {entry.source === 'custom' ? (
            deleteConfirmOpen ? (
              <div className="border-t border-rose-100 bg-rose-50 px-3 py-2">
                <div className="text-xs font-semibold text-rose-900">Delete this entry?</div>
                <div className="mt-1 text-[11px] text-rose-800">This removes the custom catalog item immediately.</div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-white"
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
                    onClick={() => {
                      onDelete();
                      closeMenu();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

interface CatalogPanelProps {
  onOpenManage?: () => void;
}

export function CatalogPanel({ onOpenManage }: CatalogPanelProps = {}) {
  const setActiveLeftTab = useLayoutStore((state) => state.setActiveLeftTab);

  const categories = useUnifiedCatalogStore((state) => state.categories);
  const catalogEntries = useUnifiedCatalogStore((state) => state.catalogEntries);
  const activeEntryId = useUnifiedCatalogStore((state) => state.activeEntryId);
  const systemProfiles = useUnifiedCatalogStore((state) => state.systemProfiles);
  const activeSystemType = useUnifiedCatalogStore((state) => state.activeSystemType);
  const selectEntry = useUnifiedCatalogStore((state) => state.selectEntry);
  const cloneEntry = useUnifiedCatalogStore((state) => state.cloneEntry);
  const customizeEntry = useUnifiedCatalogStore((state) => state.customizeEntry);
  const deleteEntry = useUnifiedCatalogStore((state) => state.deleteEntry);
  const setSearchQuery = useUnifiedCatalogStore((state) => state.setSearchQuery);
  const setSystemType = useUnifiedCatalogStore((state) => state.setSystemType);
  const setSelectedCategory = useUnifiedCatalogStore((state) => state.setSelectedCategory);
  const searchQuery = useUnifiedCatalogStore((state) => state.searchQuery);
  const selectedCategoryId = useUnifiedCatalogStore((state) => state.selectedCategoryId);
  const openManage = onOpenManage ?? (() => setActiveLeftTab('manage'));
  const query = searchQuery.trim().toLowerCase();
  const [expandedRootIds, setExpandedRootIds] = useState<string[]>(() =>
    categories.filter((category) => !category.parentId).map((category) => category.id)
  );

  const rootCategories = useMemo(() => categories.filter((category) => !category.parentId), [categories]);
  const categoriesByParent = useMemo(() => {
    const groups = new Map<string, ComponentCategory[]>();
    categories.forEach((category) => {
      if (!category.parentId) {
        return;
      }
      const bucket = groups.get(category.parentId) ?? [];
      bucket.push(category);
      groups.set(category.parentId, bucket);
    });
    return groups;
  }, [categories]);
  const matchesQuery = useMemo(() => {
    if (!query) {
      return () => true;
    }

    return (entry: UnifiedComponentDefinition) =>
      entry.name.toLowerCase().includes(query) ||
      entry.description?.toLowerCase().includes(query) === true ||
      entry.tags?.some((tag) => tag.toLowerCase().includes(query)) === true ||
      entry.typeId.toLowerCase().includes(query) ||
      entry.categoryId.toLowerCase().includes(query) ||
      entry.keySpec?.toLowerCase().includes(query) === true ||
      entry.manufacturer?.toLowerCase().includes(query) === true ||
      entry.model?.toLowerCase().includes(query) === true;
  }, [query]);

  const matchingEntries = useMemo(() => {
    return catalogEntries.filter((entry) => {
      if (!entry.placeable) {
        return false;
      }
      return matchesQuery(entry);
    });
  }, [catalogEntries, matchesQuery]);
  const matchingCategoryIds = useMemo(() => {
    if (!query) {
      return new Set<string>();
    }

    const matchedCategories = new Set<string>();

    categories.forEach((category) => {
      if (!category.parentId) {
        return;
      }

      const categoryMatches = category.name.toLowerCase().includes(query);
      const hasMatchingEntry = matchingEntries.some((entry) => entry.categoryId === category.id);
      if (categoryMatches || hasMatchingEntry) {
        matchedCategories.add(category.id);
      }
    });

    return matchedCategories;
  }, [categories, matchingEntries, query]);
  const filteredEntries = useMemo(() => {
    return catalogEntries.filter((entry) => {
      if (!entry.placeable) {
        return false;
      }
      if (selectedCategoryId && entry.categoryId !== selectedCategoryId) {
        return false;
      }
      return matchesQuery(entry);
    });
  }, [catalogEntries, matchesQuery, selectedCategoryId]);
  const activeEntry = useMemo(
    () => catalogEntries.find((entry) => entry.id === activeEntryId),
    [activeEntryId, catalogEntries]
  );
  const activeSystemProfile = useMemo(
    () =>
      activeEntry
        ? systemProfiles.find((profile) => profile.engineeringSystem === activeEntry.engineeringSystem)
        : undefined,
    [activeEntry, systemProfiles]
  );
  const activeCompatibility = useMemo(() => {
    if (!activeEntry) {
      return null;
    }

    return {
      fittings: summarizeCompatibility(activeEntry.recommendedFittingEntryIds, catalogEntries),
      accessories: summarizeCompatibility(activeEntry.recommendedAccessoryEntryIds, catalogEntries),
      equipment: summarizeCompatibility(activeEntry.recommendedEquipmentEntryIds, catalogEntries),
      notes: activeEntry.connectionNotes ?? [],
    };
  }, [activeEntry, catalogEntries]);

  useEffect(() => {
    if (expandedRootIds.length === 0 && rootCategories.length > 0) {
      setExpandedRootIds(rootCategories.map((category) => category.id));
    }
  }, [expandedRootIds.length, rootCategories]);

  const systemConflictWarning = useMemo(() => {
    if (!activeEntry || !activeSystemProfile) {
      return null;
    }
    if (activeSystemType === activeSystemProfile.defaultSystemType) {
      return null;
    }
    return `System override is set to ${activeSystemType.replace('_', ' ')}, but ${activeEntry.name} still follows ${activeSystemProfile.name} engineering rules.`;
  }, [activeEntry, activeSystemProfile, activeSystemType]);
  const visibleEntries = useMemo(() => {
    if (!selectedCategoryId) {
      return filteredEntries;
    }
    return filteredEntries.filter((entry) => entry.categoryId === selectedCategoryId);
  }, [filteredEntries, selectedCategoryId]);
  const treeEntries = query ? matchingEntries : catalogEntries.filter((entry) => entry.placeable);

  const visibleRoots = useMemo(() => {
    if (!query) {
      return rootCategories;
    }

    return rootCategories.filter((root) => {
      const children = categoriesByParent.get(root.id) ?? [];
      return children.some((subcategory) => matchingCategoryIds.has(subcategory.id));
    });
  }, [categoriesByParent, matchingCategoryIds, query, rootCategories]);

  const visibleChildrenByRoot = useMemo(() => {
    return new Map(
      visibleRoots.map((root) => {
        const children = categoriesByParent.get(root.id) ?? [];
        const visibleChildren = query
          ? children.filter(
              (subcategory) =>
                matchingCategoryIds.has(subcategory.id) || subcategory.name.toLowerCase().includes(query)
            )
          : children;
        return [root.id, visibleChildren];
      })
    );
  }, [categoriesByParent, matchingCategoryIds, query, visibleRoots]);

  const selectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleEditInManage = (entry: UnifiedComponentDefinition) => {
    selectEntry(entry.id);
    openManage();
  };

  const handleDelete = (entry: UnifiedComponentDefinition) => {
    deleteEntry(entry.id);
  };

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-gradient-to-b from-slate-50 via-white to-slate-50 p-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Image
              src="/branding/hvac-library/hvac-library-symbol.svg"
              alt="HVAC Library"
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl border border-slate-200 bg-slate-950/95 p-1 shadow-sm"
            />
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">HVAC Library</div>
              <h3 className="text-sm font-semibold text-slate-900">Browse placeable components</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              selectCategory(null);
              setSearchQuery('');
            }}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, manufacturer, tags..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
          />
        </label>
      </div>

      <div className="grid flex-1 gap-3 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-2 shadow-sm">
          <div className="mb-2 px-2 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Domains</div>
          </div>
          <div className="space-y-2">
            {visibleRoots.map((root) => {
              const children = visibleChildrenByRoot.get(root.id) ?? [];
              const isExpanded = query.length > 0 || expandedRootIds.includes(root.id);
              const rootCount = children.reduce(
                (total, child) => total + treeEntries.filter((entry) => entry.categoryId === child.id).length,
                0
              );

              return (
                <div
                  key={root.id}
                  className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                  style={{ borderLeftColor: getCategoryColor(root.id), borderLeftWidth: '4px' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (query.length > 0) {
                        return;
                      }
                      setExpandedRootIds((current) =>
                        current.includes(root.id) ? current.filter((id) => id !== root.id) : [...current, root.id]
                      );
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left"
                    aria-expanded={isExpanded}
                    data-testid={`catalog-root-${root.id}`}
                  >
                    <span className="text-sm font-semibold text-slate-900">{root.name}</span>
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {query.length === 0 ? (
                        isExpanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />
                      ) : null}
                      {rootCount}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="space-y-2">
                      {children.map((subcategory) => {
                        const count = treeEntries.filter((entry) => entry.categoryId === subcategory.id).length;
                        return (
                          <button
                            key={subcategory.id}
                            type="button"
                            onClick={() => selectCategory(selectedCategoryId === subcategory.id ? null : subcategory.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                              selectedCategoryId === subcategory.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                            data-testid={`catalog-category-${subcategory.id}`}
                          >
                            <span className="text-sm font-medium">{subcategory.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                selectedCategoryId === subcategory.id ? 'bg-white/15 text-white' : 'bg-white text-slate-500'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {visibleEntries.length} placeable entries
              </div>
              <div className="text-sm text-slate-600">
                {selectedCategoryId ? `Filtered by ${selectedCategoryId.replace(/_/g, ' ')}` : 'All categories'}
              </div>
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No placeable entries match this filter.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              {visibleEntries.map((entry) => (
                <CatalogCard
                  key={entry.id}
                  entry={entry}
                  active={activeEntry?.id === entry.id}
                  onSelect={() => selectEntry(entry.id)}
                  onClone={() => cloneEntry(entry.id)}
                  onCustomize={() => {
                    customizeEntry(entry.id);
                    openManage();
                  }}
                  onEdit={() => handleEditInManage(entry)}
                  onDelete={() => handleDelete(entry)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-10 w-1 rounded-full bg-sky-500" />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Active component</div>
              <div className="text-sm font-semibold text-slate-900">{activeEntry?.name ?? 'None selected'}</div>
              {activeSystemProfile ? (
                <div className="text-xs text-slate-500">
                  {activeSystemProfile.name} · {activeSystemProfile.engineeringSystem}
                </div>
              ) : null}
            </div>
          </div>

          <label className="min-w-[220px]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Service context
            </span>
            <select
              value={activeSystemType ?? 'supply'}
              onChange={(event) => setSystemType(event.target.value as CatalogSystemType)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white"
            >
              {SYSTEM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {systemConflictWarning ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {systemConflictWarning}
          </div>
        ) : null}

        {activeEntry && activeCompatibility ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Works with</div>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              {activeCompatibility.fittings ? (
                <div data-testid="catalog-active-fittings">
                  <span className="font-semibold text-slate-900">Fittings:</span> {activeCompatibility.fittings}
                </div>
              ) : null}
              {activeCompatibility.accessories ? (
                <div data-testid="catalog-active-accessories">
                  <span className="font-semibold text-slate-900">Accessories:</span> {activeCompatibility.accessories}
                </div>
              ) : null}
              {activeCompatibility.equipment ? (
                <div data-testid="catalog-active-equipment">
                  <span className="font-semibold text-slate-900">Equipment:</span> {activeCompatibility.equipment}
                </div>
              ) : null}
            </div>
            {activeCompatibility.notes.length > 0 ? (
              <div className="mt-2 text-[11px] text-slate-500">{activeCompatibility.notes[0]}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CatalogPanel;
