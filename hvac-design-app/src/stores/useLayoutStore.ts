import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutStoreState {
    // Sidebar collapsed states
    leftSidebarCollapsed: boolean;
    rightSidebarCollapsed: boolean;

    // Active tab states
    activeLeftTab: string;
    activeRightTab: string;

    // Dock state
    activeDockPanel: 'none' | 'library' | 'services';

    // Actions
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setActiveLeftTab: (tab: string) => void;
    setActiveRightTab: (tab: string) => void;
    
    // Dock actions
    setActiveDockPanel: (panel: 'none' | 'library' | 'services') => void;
    toggleDockPanel: (panel: 'library' | 'services') => void;
    closeDockPanel: () => void;

    resetLayout: () => void;
}

const defaultState = {
    leftSidebarCollapsed: false,
    rightSidebarCollapsed: false,
    activeLeftTab: 'library',
    activeRightTab: 'properties',
    activeDockPanel: 'none' as const,
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

            setActiveDockPanel: (panel) => 
                set({ activeDockPanel: panel }),

            toggleDockPanel: (panel) =>
                set((state) => ({
                    activeDockPanel: state.activeDockPanel === panel ? 'none' : panel
                })),

            closeDockPanel: () =>
                set({ activeDockPanel: 'none' }),

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
                activeDockPanel: state.activeDockPanel,
            }),
        }
    )
);
