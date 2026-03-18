import { create } from 'zustand';

interface BomHighlightState {
  highlightedEntityId: string | null;
  setHighlightedEntityId: (entityId: string | null) => void;
  clearHighlightedEntityId: () => void;
}

export const useBomHighlightStore = create<BomHighlightState>((set) => ({
  highlightedEntityId: null,
  setHighlightedEntityId: (entityId) => set({ highlightedEntityId: entityId }),
  clearHighlightedEntityId: () => set({ highlightedEntityId: null }),
}));
