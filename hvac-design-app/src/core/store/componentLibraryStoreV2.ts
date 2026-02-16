import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { UnifiedComponentDefinition } from '../schema/unified-component.schema';
import { ComponentCategory, ComponentTemplate } from '../schema/component-library.schema';

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

interface ComponentLibraryState {
  components: UnifiedComponentDefinition[];
  categories: ComponentCategory[];
  templates: ComponentTemplate[];
  activeComponentId: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  filterTags: string[];
  hoverComponentId: string | null;
  importPreview: ImportPreview | null;
  isLoading: boolean;
  error: string | null;
  isEnabled: boolean;

  addComponent: (component: UnifiedComponentDefinition) => void;
  updateComponent: (id: string, updates: Partial<UnifiedComponentDefinition>) => void;
  deleteComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  getComponent: (id: string) => UnifiedComponentDefinition | undefined;

  addCategory: (category: ComponentCategory) => void;
  updateCategory: (id: string, updates: Partial<ComponentCategory>) => void;
  deleteCategory: (id: string) => void;
  getCategoryTree: () => ComponentCategory[];

  addTemplate: (template: ComponentTemplate) => void;
  updateTemplate: (id: string, updates: Partial<ComponentTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplatesForComponent: (componentId: string) => ComponentTemplate[];

  setSearchQuery: (query: string) => void;
  setFilterTags: (tags: string[]) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  search: (query: string) => UnifiedComponentDefinition[];
  getByCategoryTree: (categoryId: string) => UnifiedComponentDefinition[];
  activateComponent: (componentId: string) => void;
  deactivateComponent: () => void;
  getActiveComponent: () => UnifiedComponentDefinition | undefined;
  setHoverComponent: (componentId: string | null) => void;
  getFilteredComponents: () => UnifiedComponentDefinition[];

  setEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  components: [],
  categories: [],
  templates: [],
  activeComponentId: null,
  selectedCategoryId: null,
  searchQuery: '',
  filterTags: [],
  hoverComponentId: null,
  importPreview: null,
  isLoading: false,
  error: null,
  isEnabled: false,
};

export const useComponentLibraryStoreV2 = create<ComponentLibraryState>()(
  persist(
    immer((set, get) => ({
      ...initialState,

    addComponent: (component) =>
      set((state) => {
        state.components.push(component);
      }),

    updateComponent: (id, updates) =>
      set((state) => {
        const component = state.components.find((c) => c.id === id);
        if (component) {
          Object.assign(component, updates, { updatedAt: new Date() });
        }
      }),

    deleteComponent: (id) =>
      set((state) => {
        state.components = state.components.filter((c) => c.id !== id);
        if (state.activeComponentId === id) {
          state.activeComponentId = null;
        }
      }),

    duplicateComponent: (id) =>
      set((state) => {
        const component = state.components.find((c) => c.id === id);
        if (component) {
          state.components.push({
            ...component,
            id: `${component.id}-copy-${Date.now()}`,
            name: `${component.name} (Copy)`,
            isCustom: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }),

    getComponent: (id) => {
      return get().components.find((c) => c.id === id);
    },

    addCategory: (category) =>
      set((state) => {
        state.categories.push(category);
      }),

    updateCategory: (id, updates) =>
      set((state) => {
        const updateRecursive = (categories: ComponentCategory[]): boolean => {
          for (const category of categories) {
            if (category.id === id) {
              Object.assign(category, updates);
              return true;
            }
            if (category.subcategories && updateRecursive(category.subcategories)) {
              return true;
            }
          }
          return false;
        };
        updateRecursive(state.categories);
      }),

    deleteCategory: (id) =>
      set((state) => {
        const deleteRecursive = (categories: ComponentCategory[]): ComponentCategory[] => {
          return categories.filter((cat) => {
            if (cat.id === id) return false;
            if (cat.subcategories) {
              cat.subcategories = deleteRecursive(cat.subcategories);
            }
            return true;
          });
        };
        state.categories = deleteRecursive(state.categories);
      }),

    getCategoryTree: () => {
      return get().categories;
    },

    addTemplate: (template) =>
      set((state) => {
        state.templates.push(template);
      }),

    updateTemplate: (id, updates) =>
      set((state) => {
        const template = state.templates.find((t) => t.id === id);
        if (!template) return;
        Object.assign(template, updates);
      }),

    deleteTemplate: (id) =>
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id);
      }),

    getTemplatesForComponent: (componentId) => {
      return get().templates.filter((t) => t.componentId === componentId);
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

    search: (query) => {
      const lowered = query.toLowerCase();
      return get().components.filter((c) =>
        c.name.toLowerCase().includes(lowered) ||
        c.description?.toLowerCase().includes(lowered) ||
        c.tags?.some((t) => t.toLowerCase().includes(lowered))
      );
    },

    getByCategoryTree: (categoryId) => {
      const categories = get().categories;
      const components = get().components;
      const categoryIds = new Set<string>();

      const visitBranch = (node: ComponentCategory) => {
        categoryIds.add(node.id);
        for (const child of node.subcategories ?? []) {
          visitBranch(child);
        }
      };

      const findCategory = (nodes: ComponentCategory[]): boolean => {
        for (const node of nodes) {
          if (node.id === categoryId) {
            visitBranch(node);
            return true;
          }
          if (node.subcategories && findCategory(node.subcategories)) {
            return true;
          }
        }
        return false;
      };

      if (!findCategory(categories)) {
        categoryIds.add(categoryId);
      }

      return components.filter((component) => categoryIds.has(component.category));
    },

    activateComponent: (componentId) =>
      set((state) => {
        state.activeComponentId = componentId;
      }),

    deactivateComponent: () =>
      set((state) => {
        state.activeComponentId = null;
      }),

    getActiveComponent: () => {
      const { activeComponentId, components } = get();
      return components.find((c) => c.id === activeComponentId);
    },

    setHoverComponent: (componentId) =>
      set((state) => {
        state.hoverComponentId = componentId;
      }),

    getFilteredComponents: () => {
      const { components, searchQuery, filterTags, selectedCategoryId } = get();
      return components.filter((c) => {
        if (selectedCategoryId && c.category !== selectedCategoryId) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!c.name.toLowerCase().includes(q) &&
              !c.description?.toLowerCase().includes(q) &&
              !c.tags?.some((t) => t.toLowerCase().includes(q))) {
            return false;
          }
        }
        if (filterTags.length > 0) {
          if (!filterTags.every((tag) => c.tags?.includes(tag))) return false;
        }
        return true;
      });
    },

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

      reset: () => set(initialState),
    })),
    {
      name: 'sws.componentLibrary.v2',
      partialize: (state) => ({
        components: state.components,
        categories: state.categories,
        templates: state.templates,
        activeComponentId: state.activeComponentId,
      }),
    }
  )
);

// V2 is now the default and only component library store
// This export is kept for backward compatibility but always returns true
export const ENABLE_UNIFIED_COMPONENT_LIBRARY = true;
