import { create } from 'zustand';

interface LayoutStoreState {
    leftSidebarCollapsed: boolean;
    rightSidebarCollapsed: boolean;
    activeRightTab: string;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setActiveRightTab: (tab: string) => void;
}

export const useLayoutStore = create<LayoutStoreState>((set) => ({
    leftSidebarCollapsed: false,
    rightSidebarCollapsed: false,
    activeRightTab: 'properties',

    toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),

    toggleRightSidebar: () =>
        set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed })),

    setActiveRightTab: (tab) =>
        set({ activeRightTab: tab }),
}));
