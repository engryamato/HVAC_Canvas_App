import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutStoreState {
    // Sidebar collapsed states
    leftSidebarCollapsed: boolean;
    rightSidebarCollapsed: boolean;

    // Active tab states
    activeLeftTab: string;
    activeRightTab: string;

    // Actions
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setActiveLeftTab: (tab: string) => void;
    setActiveRightTab: (tab: string) => void;
    resetLayout: () => void;
}

const defaultState = {
    leftSidebarCollapsed: false,
    rightSidebarCollapsed: false,
    activeLeftTab: 'equipment',
    activeRightTab: 'properties',
};

export const useLayoutStore = create<LayoutStoreState>()(
    persist(
        (set) => ({
            ...defaultState,

            toggleLeftSidebar: () =>
                set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),

            toggleRightSidebar: () =>
                set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed })),

            setActiveLeftTab: (tab) =>
                set({ activeLeftTab: tab }),

            setActiveRightTab: (tab) =>
                set({ activeRightTab: tab }),

            resetLayout: () =>
                set(defaultState),
        }),
        {
            name: 'hvac-layout-preferences',
            partialize: (state) => ({
                leftSidebarCollapsed: state.leftSidebarCollapsed,
                rightSidebarCollapsed: state.rightSidebarCollapsed,
                activeLeftTab: state.activeLeftTab,
                activeRightTab: state.activeRightTab,
            }),
        }
    )
);
