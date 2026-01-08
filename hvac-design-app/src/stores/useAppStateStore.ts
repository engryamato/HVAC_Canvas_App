import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    hasLaunched: boolean;
    isFirstLaunch: boolean;
    isLoading: boolean;

    // Actions
    setHasLaunched: (value: boolean) => void;
    setLoading: (value: boolean) => void;
    resetFirstLaunch: () => void;
}

export const useAppStateStore = create<AppState>()(
    persist(
        (set) => ({
            hasLaunched: false,
            isFirstLaunch: true,
            isLoading: true,

            setHasLaunched: (value) => set({ hasLaunched: value, isFirstLaunch: !value }),
            setLoading: (value) => set({ isLoading: value }),
            resetFirstLaunch: () => set({ hasLaunched: false, isFirstLaunch: true }),
        }),
        {
            name: 'hvac-app-storage',
            partialize: (state) => ({ hasLaunched: state.hasLaunched }),
        }
    )
);
