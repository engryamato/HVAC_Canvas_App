import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ActivationIntent,
  CatalogEntry,
  ComponentClass,
  ComponentCategory,
  ComponentTemplate,
  EngineeringSystem,
  SystemProfile,
  UnifiedComponentDefinition,
} from '../schema/unified-component.schema';
import {
  ActivationIntentSchema,
  CatalogEntrySchema,
  ComponentCategorySchema,
  ComponentTemplateSchema,
  SystemProfileSchema,
} from '../schema/unified-component.schema';
import type { SystemType } from '../schema/duct.schema';

export const UNIFIED_CATALOG_STORAGE_KEY = 'sws.unifiedCatalog.v1';
export const UNIFIED_CATALOG_STORE_VERSION = 4;

export interface ImportPreview {
  format: 'csv' | 'json';
  headers: string[];
  rows: ImportRow[];
  mapping: Record<string, string>;
}

export interface ImportRow {
  id?: string;
  name: string;
  type: 'duct' | 'fitting' | 'equipment' | 'accessory';
  category: string;
  subtype?: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  sku?: string;
  tags?: string[];
}

type StoreShape = {
  catalogEntries: CatalogEntry[];
  categories: ComponentCategory[];
  systemProfiles: SystemProfile[];
  templates: ComponentTemplate[];
  activeEntryId: string | null;
  activeSystemType: SystemType;
  selectedCategoryId: string | null;
  searchQuery: string;
  filterTags: string[];
  hoverEntryId: string | null;
  pendingEditEntryId: string | null;
  importPreview: ImportPreview | null;
  isLoading: boolean;
  error: string | null;
  isEnabled: boolean;
};

export interface UnifiedCatalogState extends StoreShape {
  // Compatibility aliases
  components: CatalogEntry[];
  activeComponentId: string | null;
  hoverComponentId: string | null;

  addEntry: (entry: CatalogEntry) => void;
  updateEntry: (id: string, updates: Partial<CatalogEntry>) => void;
  deleteEntry: (id: string) => void;
  cloneEntry: (id: string) => string | null;
  customizeEntry: (id: string) => string | null;
  getEntry: (id: string) => CatalogEntry | undefined;

  addSystemProfile: (profile: SystemProfile) => void;
  updateSystemProfile: (id: string, updates: Partial<SystemProfile>) => void;
  getSystemProfile: (engineeringSystem: EngineeringSystem) => SystemProfile | undefined;

  addCategory: (category: ComponentCategory) => void;
  updateCategory: (id: string, updates: Partial<ComponentCategory>) => void;
  deleteCategory: (id: string) => void;
  getCategoryTree: () => ComponentCategory[];

  addTemplate: (template: ComponentTemplate) => void;
  updateTemplate: (id: string, updates: Partial<ComponentTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplatesForEntry: (entryId: string) => ComponentTemplate[];

  selectEntry: (entryId: string | null) => void;
  setSystemType: (systemType: SystemType) => void;
  clearPendingEditEntryId: () => void;
  clearPendingEditEntry: () => void;
  setSearchQuery: (query: string) => void;
  setFilterTags: (tags: string[]) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setHoverEntry: (entryId: string | null) => void;
  search: (query: string) => CatalogEntry[];
  getByCategoryTree: (categoryId: string) => CatalogEntry[];

  getFilteredEntries: () => CatalogEntry[];
  getActiveEntry: () => CatalogEntry | undefined;
  getActiveSystemProfile: () => SystemProfile | undefined;
  getAvailableArchetypes: () => string[];
  getServiceConflictWarning: () => string | null;
  getActivationIntent: () => ActivationIntent | null;

  // Legacy callers
  addComponent: (component: UnifiedComponentDefinition) => void;
  updateComponent: (id: string, updates: Partial<UnifiedComponentDefinition>) => void;
  deleteComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  getComponent: (id: string) => UnifiedComponentDefinition | undefined;
  activateComponent: (componentId: string) => void;
  deactivateComponent: () => void;
  getActiveComponent: () => UnifiedComponentDefinition | undefined;
  setHoverComponent: (componentId: string | null) => void;
  getFilteredComponents: () => UnifiedComponentDefinition[];
  getTemplatesForComponent: (componentId: string) => ComponentTemplate[];

  setEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const defaultState: StoreShape = {
  catalogEntries: [],
  categories: [],
  systemProfiles: [],
  templates: [],
  activeEntryId: null,
  activeSystemType: 'supply',
  selectedCategoryId: null,
  searchQuery: '',
  filterTags: [],
  hoverEntryId: null,
  pendingEditEntryId: null,
  importPreview: null,
  isLoading: false,
  error: null,
  isEnabled: false,
};

const CATEGORY_ID_BY_ENGINEERING_SYSTEM: Record<EngineeringSystem, string> = {
  standard_duct: 'standard_ductwork',
  universal: 'hangers_supports',
};

const FALLBACK_TYPE_ID_BY_COMPONENT_CLASS: Record<ComponentClass, string> = {
  duct: 'straight',
  fitting: 'elbow_90',
  equipment: 'fan',
  accessory: 'accessory',
};

function getDefaultSystemType(engineeringSystem: unknown): SystemType {
  return engineeringSystem === 'standard_duct' || engineeringSystem === 'universal' ? 'supply' : 'supply';
}

function inferComponentClass(input: Record<string, unknown>): ComponentClass {
  const explicit = input.componentClass ?? input.category;
  if (
    explicit === 'duct' ||
    explicit === 'fitting' ||
    explicit === 'equipment' ||
    explicit === 'accessory'
  ) {
    return explicit;
  }

  return 'duct';
}

function inferEngineeringSystem(input: Record<string, unknown>): EngineeringSystem {
  if (
    input.engineeringSystem === 'standard_duct' ||
    input.engineeringSystem === 'universal'
  ) {
    return input.engineeringSystem;
  }

  if (
    input.categoryId === 'hangers_supports' ||
    input.categoryId === 'universal_components'
  ) {
    return 'universal';
  }

  return 'standard_duct';
}

function inferCategoryId(input: Record<string, unknown>, engineeringSystem: EngineeringSystem): string {
  if (typeof input.categoryId === 'string' && input.categoryId.length > 0) {
    return input.categoryId;
  }

  return CATEGORY_ID_BY_ENGINEERING_SYSTEM[engineeringSystem];
}

function inferTypeId(input: Record<string, unknown>, componentClass: ComponentClass): string {
  if (typeof input.typeId === 'string' && input.typeId.length > 0) {
    return input.typeId;
  }

  if (typeof input.type === 'string' && input.type.length > 0) {
    return input.type;
  }

  if (typeof input.subtype === 'string' && input.subtype.length > 0) {
    return input.subtype;
  }

  return FALLBACK_TYPE_ID_BY_COMPONENT_CLASS[componentClass];
}

function parseCanonicalEntry(entry: CatalogEntry): CatalogEntry {
  return CatalogEntrySchema.parse(entry);
}

export function normalizeLegacyEntry(input: Partial<CatalogEntry> & Record<string, unknown>): CatalogEntry {
  const componentClass = inferComponentClass(input);
  const engineeringSystem = inferEngineeringSystem(input);
  const categoryId = inferCategoryId(input, engineeringSystem);
  const typeId = inferTypeId(input, componentClass);
  const parsed = CatalogEntrySchema.parse({
    ...input,
    componentClass,
    categoryId,
    typeId,
    engineeringSystem,
    source: input.source ?? (input.isCustom ? 'custom' : 'system'),
    placeable: input.placeable ?? true,
    systemType: input.systemType ?? getDefaultSystemType(engineeringSystem),
    pricing: input.pricing ?? {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    engineeringProperties: input.engineeringProperties ?? {
      frictionFactor: 0.02,
      maxVelocity: 2500,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    materials: input.materials ?? [],
  });

  return parsed;
}

function syncCompatibilityFields(state: UnifiedCatalogState): void {
  state.components = state.catalogEntries;
  state.activeComponentId = state.activeEntryId;
  state.hoverComponentId = state.hoverEntryId;
}

function cloneEntryData(entry: CatalogEntry, suffix: string): CatalogEntry {
  const now = new Date();
  return parseCanonicalEntry({
    ...entry,
    id: `${entry.id}-${suffix}-${Date.now()}`,
    name: `${entry.name} (${suffix === 'customize' ? 'Custom' : 'Copy'})`,
    source: 'custom',
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  });
}

function includesQuery(entry: CatalogEntry, lowered: string): boolean {
  return (
    entry.name.toLowerCase().includes(lowered) ||
    entry.description?.toLowerCase().includes(lowered) === true ||
    entry.tags?.some((tag) => tag.toLowerCase().includes(lowered)) === true ||
    entry.typeId.toLowerCase().includes(lowered) ||
    entry.categoryId.toLowerCase().includes(lowered)
  );
}

function resolveDefaultSystemType(entry: CatalogEntry, profile?: SystemProfile): SystemType | undefined {
  return profile?.defaultSystemType ?? entry.systemType;
}

function resolveSpecialtyToolId(entry: CatalogEntry): string | null {
  if (entry.componentClass !== 'duct') {
    return null;
  }

  if (entry.engineeringSystem === 'standard_duct' || entry.engineeringSystem === 'universal') {
    return null;
  }

  return entry.specialtyToolId ?? entry.id;
}

function shouldAutoApplySystemType(entry: CatalogEntry): boolean {
  return false;
}

export function dedupeEntries(entries: CatalogEntry[]): CatalogEntry[] {
  const seen = new Map<string, number>();

  return entries.map((entry) => {
    const count = seen.get(entry.id) ?? 0;
    seen.set(entry.id, count + 1);
    if (count === 0) {
      return entry;
    }

    return parseCanonicalEntry({
      ...entry,
      id: `${entry.id}-dedupe-${count}`,
    });
  });
}

function dedupeProfiles(profiles: SystemProfile[]): SystemProfile[] {
  const byId = new Map<string, SystemProfile>();

  for (const profile of profiles) {
    byId.set(profile.id, profile);
  }

  return [...byId.values()];
}

export function normalizeCategories(categories: unknown[]): ComponentCategory[] {
  const flattened: ComponentCategory[] = [];
  const seen = new Set<string>();

  const visit = (rawCategory: unknown, parentId?: string | null): void => {
    const parsed = ComponentCategorySchema.safeParse(rawCategory);
    if (!parsed.success) {
      return;
    }

    const category = parsed.data;
    const normalized: ComponentCategory = {
      ...category,
      parentId: category.parentId ?? parentId ?? null,
      subcategories: undefined,
    };

    if (!seen.has(normalized.id)) {
      seen.add(normalized.id);
      flattened.push(normalized);
    }

    for (const child of category.subcategories ?? []) {
      visit(child, category.id);
    }
  };

  for (const category of categories) {
    visit(category);
  }

  return flattened;
}

export function migrateLegacyState(persisted: unknown): StoreShape {
  if (!persisted || typeof persisted !== 'object') {
    return defaultState;
  }

  const persistedRoot = persisted as Record<string, unknown>;
  const raw =
    persistedRoot.state && typeof persistedRoot.state === 'object'
      ? (persistedRoot.state as Record<string, unknown>)
      : persistedRoot;
  const sourceEntries = Array.isArray(raw.catalogEntries)
    ? raw.catalogEntries
    : Array.isArray(raw.components)
      ? raw.components
      : [];
  const sourceCategories = Array.isArray(raw.categories) ? raw.categories : [];
  const sourceTemplates = Array.isArray(raw.templates) ? raw.templates : [];
  const sourceProfiles = Array.isArray(raw.systemProfiles) ? raw.systemProfiles : [];

  return {
    ...defaultState,
    catalogEntries: dedupeEntries(
      sourceEntries.map((entry) => normalizeLegacyEntry(entry as Record<string, unknown>))
    ),
    categories: normalizeCategories(sourceCategories),
    templates: sourceTemplates
      .map((template) => ComponentTemplateSchema.safeParse(template))
      .flatMap((result) => (result.success ? [result.data] : [])),
    systemProfiles: dedupeProfiles(
      sourceProfiles
      .map((profile) => SystemProfileSchema.safeParse(profile))
      .flatMap((result) => (result.success ? [result.data] : []))
    ),
    activeEntryId:
      typeof raw.activeEntryId === 'string'
        ? raw.activeEntryId
        : typeof raw.activeComponentId === 'string'
          ? raw.activeComponentId
          : null,
    activeSystemType:
      raw.activeSystemType === 'return' ||
      raw.activeSystemType === 'exhaust' ||
      raw.activeSystemType === 'outside_air'
        ? raw.activeSystemType
        : 'supply',
    selectedCategoryId: typeof raw.selectedCategoryId === 'string' ? raw.selectedCategoryId : null,
    searchQuery: typeof raw.searchQuery === 'string' ? raw.searchQuery : '',
    filterTags: Array.isArray(raw.filterTags) ? raw.filterTags.filter((tag): tag is string => typeof tag === 'string') : [],
    hoverEntryId:
      typeof raw.hoverEntryId === 'string'
        ? raw.hoverEntryId
        : typeof raw.hoverComponentId === 'string'
          ? raw.hoverComponentId
          : null,
    pendingEditEntryId: typeof raw.pendingEditEntryId === 'string' ? raw.pendingEditEntryId : null,
    importPreview: null,
    isLoading: false,
    error: null,
    isEnabled: typeof raw.isEnabled === 'boolean' ? raw.isEnabled : true,
  };
}

export const useUnifiedCatalogStore = create<UnifiedCatalogState>()(
  persist(
    immer((set, get) => ({
      ...defaultState,
      components: [],
      activeComponentId: null,
      hoverComponentId: null,

      addEntry: (entry) =>
        set((state) => {
          state.catalogEntries = dedupeEntries([...state.catalogEntries, parseCanonicalEntry(entry)]);
          syncCompatibilityFields(state);
        }),

      updateEntry: (id, updates) =>
        set((state) => {
          const entry = state.catalogEntries.find((item) => item.id === id);
          if (!entry) {
            return;
          }
          Object.assign(entry, parseCanonicalEntry({ ...entry, ...updates, updatedAt: new Date() }));
          syncCompatibilityFields(state);
        }),

      deleteEntry: (id) =>
        set((state) => {
          state.catalogEntries = state.catalogEntries.filter((item) => item.id !== id);
          if (state.activeEntryId === id) {
            state.activeEntryId = null;
          }
          if (state.pendingEditEntryId === id) {
            state.pendingEditEntryId = null;
          }
          syncCompatibilityFields(state);
        }),

      cloneEntry: (id) => {
        const entry = get().catalogEntries.find((item) => item.id === id);
        if (!entry) {
          return null;
        }
        const cloned = cloneEntryData(entry, 'copy');
        set((state) => {
          state.catalogEntries.push(cloned);
          syncCompatibilityFields(state);
        });
        return cloned.id;
      },

      customizeEntry: (id) => {
        const entry = get().catalogEntries.find((item) => item.id === id);
        if (!entry) {
          return null;
        }
        const customized = cloneEntryData(entry, 'customize');
        set((state) => {
          state.catalogEntries.push(customized);
          state.pendingEditEntryId = customized.id;
          state.activeEntryId = customized.id;
          syncCompatibilityFields(state);
        });
        return customized.id;
      },

      getEntry: (id) => get().catalogEntries.find((item) => item.id === id),

      addSystemProfile: (profile) =>
        set((state) => {
          const parsed = SystemProfileSchema.parse(profile);
          const existing = state.systemProfiles.findIndex((item) => item.id === parsed.id);
          if (existing >= 0) {
            state.systemProfiles[existing] = parsed;
            return;
          }
          state.systemProfiles.push(parsed);
        }),

      updateSystemProfile: (id, updates) =>
        set((state) => {
          const profile = state.systemProfiles.find((item) => item.id === id);
          if (!profile) {
            return;
          }
          Object.assign(profile, SystemProfileSchema.parse({ ...profile, ...updates }));
        }),

      getSystemProfile: (engineeringSystem) =>
        get().systemProfiles.find((profile) => profile.engineeringSystem === engineeringSystem),

      addCategory: (category) =>
        set((state) => {
          const parsed = ComponentCategorySchema.parse(category);
          if (state.categories.some((item) => item.id === parsed.id)) {
            return;
          }
          state.categories.push(parsed);
        }),

      updateCategory: (id, updates) =>
        set((state) => {
          const visit = (nodes: ComponentCategory[]): boolean => {
            for (const node of nodes) {
              if (node.id === id) {
                Object.assign(node, updates);
                return true;
              }
              if (node.subcategories && visit(node.subcategories)) {
                return true;
              }
            }
            return false;
          };

          visit(state.categories);
        }),

      deleteCategory: (id) =>
        set((state) => {
          const prune = (nodes: ComponentCategory[]): ComponentCategory[] =>
            nodes
              .filter((node) => node.id !== id)
              .map((node) => ({
                ...node,
                subcategories: node.subcategories ? prune(node.subcategories) : undefined,
              }));

          state.categories = prune(state.categories);
        }),

      getCategoryTree: () => get().categories,

      addTemplate: (template) =>
        set((state) => {
          state.templates.push(ComponentTemplateSchema.parse(template));
        }),

      updateTemplate: (id, updates) =>
        set((state) => {
          const template = state.templates.find((item) => item.id === id);
          if (!template) {
            return;
          }
          Object.assign(template, ComponentTemplateSchema.parse({ ...template, ...updates }));
        }),

      deleteTemplate: (id) =>
        set((state) => {
          state.templates = state.templates.filter((item) => item.id !== id);
        }),

      getTemplatesForEntry: (entryId) => get().templates.filter((template) => template.componentId === entryId),

      selectEntry: (entryId) =>
        set((state) => {
          state.activeEntryId = entryId;
          const entry = entryId ? state.catalogEntries.find((item) => item.id === entryId) : undefined;
          if (entry && shouldAutoApplySystemType(entry)) {
            state.activeSystemType = resolveDefaultSystemType(
              entry,
              state.systemProfiles.find((profile) => profile.engineeringSystem === entry.engineeringSystem)
            ) ?? state.activeSystemType;
          }
          syncCompatibilityFields(state);
        }),

      setSystemType: (systemType) =>
        set((state) => {
          state.activeSystemType = systemType;
        }),

      clearPendingEditEntryId: () =>
        set((state) => {
          state.pendingEditEntryId = null;
        }),

      clearPendingEditEntry: () => {
        get().clearPendingEditEntryId();
      },

      setSearchQuery: (query) =>
        set((state) => {
          state.searchQuery = query;
        }),

      setFilterTags: (tags) =>
        set((state) => {
          state.filterTags = tags;
        }),

      setSelectedCategory: (categoryId) =>
        set((state) => {
          state.selectedCategoryId = categoryId;
        }),

      setHoverEntry: (entryId) =>
        set((state) => {
          state.hoverEntryId = entryId;
          syncCompatibilityFields(state);
        }),

      search: (query) => {
        const lowered = query.toLowerCase();
        return get().catalogEntries.filter((entry) => includesQuery(entry, lowered));
      },

      getByCategoryTree: (categoryId) =>
        get().catalogEntries.filter((entry) => entry.categoryId === categoryId),

      getFilteredEntries: () => {
        const { catalogEntries, selectedCategoryId, searchQuery, filterTags } = get();

        return catalogEntries.filter((entry) => {
          if (!entry.placeable) {
            return false;
          }
          if (selectedCategoryId && entry.categoryId !== selectedCategoryId) {
            return false;
          }
          if (searchQuery && !includesQuery(entry, searchQuery.toLowerCase())) {
            return false;
          }
          if (filterTags.length > 0 && !filterTags.every((tag) => entry.tags?.includes(tag))) {
            return false;
          }
          return true;
        });
      },

      getActiveEntry: () => {
        const { activeEntryId, catalogEntries } = get();
        return catalogEntries.find((entry) => entry.id === activeEntryId);
      },

      getActiveSystemProfile: () => {
        const entry = get().getActiveEntry();
        return entry ? get().getSystemProfile(entry.engineeringSystem) : undefined;
      },

      getAvailableArchetypes: () => {
        const entry = get().getActiveEntry();
        const profile = get().getActiveSystemProfile();
        if (!entry || !profile) {
          return [];
        }
        return profile.supportedArchetypes[entry.componentClass];
      },

      getServiceConflictWarning: () => {
        const entry = get().getActiveEntry();
        const profile = get().getActiveSystemProfile();
        if (!entry || !profile) {
          return null;
        }
        if (get().activeSystemType === profile.defaultSystemType) {
          return null;
        }
        return `Service override is set to ${get().activeSystemType.replace('_', ' ')}, but ${entry.name} still follows ${profile.name} engineering rules.`;
      },

      getActivationIntent: () => {
        const entry = get().getActiveEntry();
        const profile = get().getActiveSystemProfile();
        if (!entry) {
          return null;
        }

        return ActivationIntentSchema.parse({
          entryId: entry.id,
          componentClass: entry.componentClass,
          specialtyToolId: resolveSpecialtyToolId(entry),
          engineeringSystem: entry.engineeringSystem,
          systemType: get().activeSystemType,
          defaultSystemType: resolveDefaultSystemType(entry, profile),
        });
      },

      addComponent: (component) => get().addEntry(component),
      updateComponent: (id, updates) => get().updateEntry(id, updates),
      deleteComponent: (id) => get().deleteEntry(id),
      duplicateComponent: (id) => {
        void get().cloneEntry(id);
      },
      getComponent: (id) => get().getEntry(id),
      activateComponent: (componentId) => get().selectEntry(componentId),
      deactivateComponent: () => get().selectEntry(null),
      getActiveComponent: () => get().getActiveEntry(),
      setHoverComponent: (componentId) => get().setHoverEntry(componentId),
      getFilteredComponents: () => get().getFilteredEntries(),
      getTemplatesForComponent: (componentId) => get().getTemplatesForEntry(componentId),

      setEnabled: (enabled) =>
        set((state) => {
          state.isEnabled = enabled;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      reset: () =>
        set((state) => {
          Object.assign(state, defaultState);
          syncCompatibilityFields(state);
        }),
    })),
    {
      name: UNIFIED_CATALOG_STORAGE_KEY,
      version: UNIFIED_CATALOG_STORE_VERSION,
      migrate: (persistedState) => migrateLegacyState(persistedState),
      partialize: (state) => ({
        catalogEntries: state.catalogEntries,
        categories: state.categories,
        systemProfiles: state.systemProfiles,
        templates: state.templates,
        activeEntryId: state.activeEntryId,
        activeSystemType: state.activeSystemType,
        selectedCategoryId: state.selectedCategoryId,
        searchQuery: state.searchQuery,
        filterTags: state.filterTags,
        pendingEditEntryId: state.pendingEditEntryId,
        isEnabled: state.isEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        syncCompatibilityFields(state);
      },
    }
  )
);

export const useComponentLibraryStoreV2 = useUnifiedCatalogStore;
export const ENABLE_UNIFIED_COMPONENT_LIBRARY =
  process.env.NEXT_PUBLIC_ENABLE_UNIFIED_COMPONENT_LIBRARY !== 'false';
