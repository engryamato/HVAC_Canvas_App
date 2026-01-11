import { create } from 'zustand';

type Tool = 'select' | 'line' | 'duct' | 'equipment' | 'text' | null;

interface ToolStoreState {
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
}

export const useToolStore = create<ToolStoreState>((set) => ({
    activeTool: 'select',
    setActiveTool: (tool) => set({ activeTool: tool }),
}));
