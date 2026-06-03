import { create } from 'zustand';

export interface CasAnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CasState {
  open: boolean;
  anchorEntityId: string | null;
  anchorRect?: CasAnchorRect;
  openCas: (anchorEntityId: string, anchorRect?: CasAnchorRect) => void;
  closeCas: () => void;
}

export const useCasStore = create<CasState>((set) => ({
  open: false,
  anchorEntityId: null,
  anchorRect: undefined,
  openCas: (anchorEntityId, anchorRect) => set({ open: true, anchorEntityId, anchorRect }),
  closeCas: () => set({ open: false, anchorEntityId: null, anchorRect: undefined }),
}));
