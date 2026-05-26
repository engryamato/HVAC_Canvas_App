import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutStoreState {
    // Sidebar collapsed states
    leftSidebarCollapsed: boolean;
    rightSidebarCollapsed: boolean;
    rightSidebarWidth: number;

    // Active tab states
    activeLeftTab: string;
    activeRightTab: string;

    // Dock state
    activeDockPanel: 'none' | 'library' | 'services';

    // Actions
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setRightSidebarWidth: (width: number) => void;
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
    rightSidebarWidth: 320,
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

            setRightSidebarWidth: (width) =>
                set({ rightSidebarWidth: Math.min(640, Math.max(280, Math.round(width))) }),

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
                rightSidebarWidth: state.rightSidebarWidth,
                activeLeftTab: state.activeLeftTab,
                activeRightTab: state.activeRightTab,
                activeDockPanel: state.activeDockPanel,
            }),
        }
    )
);
