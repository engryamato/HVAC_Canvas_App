/**
 * Catalog Store
 * 
 * Manages the product catalog for resolution workflows
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CatalogItem } from '../schema/catalog.schema';

interface CatalogState {
  items: Record<string, CatalogItem>;
  searchResults: string[];
}

interface CatalogActions {
  addItem: (item: CatalogItem) => void;
  findMatches: (criteria: {
    type?: string;
    material?: string;
    minSize?: number;
    maxSize?: number;
  }) => CatalogItem[];
  searchCatalog: (query: string) => void;
}

export const useCatalogStore = create<CatalogState & CatalogActions>()(
  immer((set, get) => ({
    items: {},
    searchResults: [],

    addItem: (item) =>
      set((state) => {
        state.items[item.id] = item;
      }),

    findMatches: (criteria) => {
      const { items } = get();
      return Object.values(items).filter((item) => {
        if (criteria.type && item.type !== criteria.type) return false;
        if (criteria.material && item.material !== criteria.material) return false;
        if (criteria.minSize !== undefined) {
          const maxDimension = Math.max(
            item.dimensions?.diameter ?? 0,
            item.dimensions?.width ?? 0,
            item.dimensions?.height ?? 0,
            item.dimensions?.length ?? 0
          );
          if (maxDimension < criteria.minSize) return false;
        }
        if (criteria.maxSize !== undefined) {
          const maxDimension = Math.max(
            item.dimensions?.diameter ?? 0,
            item.dimensions?.width ?? 0,
            item.dimensions?.height ?? 0,
            item.dimensions?.length ?? 0
          );
          if (maxDimension > criteria.maxSize) return false;
        }
        // Add more criteria as needed
        return true;
      });
    },

    searchCatalog: (query) =>
      set((state) => {
        const lowerQuery = query.toLowerCase();
        state.searchResults = Object.keys(state.items).filter((id) => {
          const item = state.items[id];
          if (!item) return false;
          return (
            item.partNumber?.toLowerCase().includes(lowerQuery) ||
            item.manufacturer?.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery)
          );
        });
      }),
  }))
);
