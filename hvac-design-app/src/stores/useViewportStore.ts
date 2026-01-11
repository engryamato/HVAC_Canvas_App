import { create } from 'zustand';

interface ViewportStoreState {
    zoom: number;
    gridVisible: boolean;
    panOffset: { x: number; y: number };
    cursorPosition: { x: number; y: number };
    setZoom: (zoom: number) => void;
    toggleGrid: () => void;
    setPanOffset: (offset: { x: number; y: number }) => void;
    setCursorPosition: (position: { x: number; y: number }) => void;
    fitToScreen: () => void;
}

export const useViewportStore = create<ViewportStoreState>((set) => ({
    zoom: 100,
    gridVisible: true,
    panOffset: { x: 0, y: 0 },
    cursorPosition: { x: 0, y: 0 },

    setZoom: (zoom) => set({ zoom }),

    toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),

    setPanOffset: (offset) => set({ panOffset: offset }),

    setCursorPosition: (position) => set({ cursorPosition: position }),

    fitToScreen: () =>
        set({
            zoom: 100,
            panOffset: { x: 0, y: 0 },
        }),
}));
