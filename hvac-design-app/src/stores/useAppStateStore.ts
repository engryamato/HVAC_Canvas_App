import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    hasLaunched: boolean;
    isFirstLaunch: boolean;
    isLoading: boolean;
    
    // Environment detection (UJ-GS-006)
    isTauri: boolean;
    environment: 'web' | 'desktop';

    // Actions
    setHasLaunched: (value: boolean) => void;
    setLoading: (value: boolean) => void;
    resetFirstLaunch: () => void;
    setEnvironment: (isTauri: boolean) => void;
}

export const useAppStateStore = create<AppState>()(
    persist(
        (set) => ({
            hasLaunched: false,
            isFirstLaunch: true,
            isLoading: true,
            
            // Default to web environment until detection runs
            isTauri: false,
            environment: 'web' as const,

            setHasLaunched: (value) => set({ hasLaunched: value, isFirstLaunch: !value }),
            setLoading: (value) => set({ isLoading: value }),
            resetFirstLaunch: () => set({ hasLaunched: false, isFirstLaunch: true }),
            setEnvironment: (isTauri) => set({ 
                isTauri, 
                environment: isTauri ? 'desktop' : 'web' 
            }),
        }),
        {
            name: 'hvac-app-storage',
            partialize: (state) => ({ hasLaunched: state.hasLaunched }),
            // Custom merge to ensure isFirstLaunch is derived from hasLaunched after rehydration
            merge: (persistedState: any, currentState) => {
                const persisted = persistedState as Partial<AppState>;
                const hasLaunched = persisted?.hasLaunched ?? currentState.hasLaunched;
                return {
                    ...currentState,
                    hasLaunched,
                    isFirstLaunch: !hasLaunched, // Derived from persistence
                    isLoading: false, // Hydration complete
                };
            },
        }
    )
);
