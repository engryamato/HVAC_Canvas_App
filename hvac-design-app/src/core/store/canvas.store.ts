import { create } from 'zustand'

interface CanvasStore {
  // State
  entities: Map<string, any>
  selectedIds: Set<string>
  currentTool: 'select' | 'duct' | 'equipment' | 'room'
  zoom: number
  pan: { x: number; y: number }

  // Actions
  setTool: (tool: 'select' | 'duct' | 'equipment' | 'room') => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  entities: new Map(),
  selectedIds: new Set(),
  currentTool: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },

  // Actions
  setTool: (tool) => set({ currentTool: tool }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
}))

