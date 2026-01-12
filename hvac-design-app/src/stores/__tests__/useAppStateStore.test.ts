import { describe, it, beforeEach, expect } from 'vitest';
import { useAppStateStore } from '../useAppStateStore';

describe('useAppStateStore', () => {
    const STORAGE_KEY = 'hvac-app-storage';

    beforeEach(() => {
        // Clear localStorage and reset store to initial state
        localStorage.clear();
        useAppStateStore.persist?.clearStorage?.();
        useAppStateStore.setState({
            hasLaunched: false,
            isFirstLaunch: true,
            isLoading: true,
        });
    });

    describe('initialization', () => {
        it('initializes with correct defaults', () => {
            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(false);
            expect(state.isFirstLaunch).toBe(true);
            expect(state.isLoading).toBe(true);
        });

        it('should have all required actions', () => {
            const state = useAppStateStore.getState();
            expect(typeof state.setHasLaunched).toBe('function');
            expect(typeof state.setLoading).toBe('function');
            expect(typeof state.resetFirstLaunch).toBe('function');
        });
    });

    describe('setHasLaunched', () => {
        it('updates hasLaunched to true and isFirstLaunch to false', () => {
            useAppStateStore.getState().setHasLaunched(true);
            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(true);
            expect(state.isFirstLaunch).toBe(false);
        });

        it('updates hasLaunched to false and isFirstLaunch to true', () => {
            // First set to true
            useAppStateStore.getState().setHasLaunched(true);
            // Then set back to false
            useAppStateStore.getState().setHasLaunched(false);
            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(false);
            expect(state.isFirstLaunch).toBe(true);
        });

        it('persists hasLaunched to localStorage', () => {
            useAppStateStore.getState().setHasLaunched(true);
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
            expect(stored.state.hasLaunched).toBe(true);
        });
    });

    describe('setLoading', () => {
        it('updates isLoading to false', () => {
            useAppStateStore.getState().setLoading(false);
            expect(useAppStateStore.getState().isLoading).toBe(false);
        });

        it('updates isLoading to true', () => {
            useAppStateStore.getState().setLoading(false);
            useAppStateStore.getState().setLoading(true);
            expect(useAppStateStore.getState().isLoading).toBe(true);
        });

        it('does NOT persist isLoading to localStorage', () => {
            useAppStateStore.getState().setLoading(false);
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
            expect(stored.state.isLoading).toBeUndefined();
        });
    });

    describe('resetFirstLaunch', () => {
        it('resets both hasLaunched and isFirstLaunch', () => {
            // First complete the launch
            useAppStateStore.getState().setHasLaunched(true);
            expect(useAppStateStore.getState().hasLaunched).toBe(true);
            expect(useAppStateStore.getState().isFirstLaunch).toBe(false);

            // Reset
            useAppStateStore.getState().resetFirstLaunch();
            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(false);
            expect(state.isFirstLaunch).toBe(true);
        });

        it('persists reset state to localStorage', () => {
            useAppStateStore.getState().setHasLaunched(true);
            useAppStateStore.getState().resetFirstLaunch();
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
            expect(stored.state.hasLaunched).toBe(false);
        });
    });

    describe('localStorage persistence (partialize)', () => {
        it('uses correct storage key', () => {
            useAppStateStore.getState().setHasLaunched(true);
            expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
        });

        it('only persists hasLaunched (not isFirstLaunch or isLoading)', () => {
            useAppStateStore.getState().setHasLaunched(true);
            useAppStateStore.getState().setLoading(false);

            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
            expect(stored.state).toEqual({ hasLaunched: true });
            expect(stored.state.isFirstLaunch).toBeUndefined();
            expect(stored.state.isLoading).toBeUndefined();
        });
    });

    describe('rehydration (onRehydrateStorage)', () => {
        it('restores isFirstLaunch correctly from persisted hasLaunched after rehydration', async () => {
            // Simulate a returning user: localStorage has hasLaunched: true
            const persistedState = {
                state: { hasLaunched: true },
                version: 0,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

            // Trigger rehydration and wait for it to complete
            await useAppStateStore.persist.rehydrate();

            const state = useAppStateStore.getState();
            // CRITICAL: isFirstLaunch should be false (derived from hasLaunched: true)
            expect(state.hasLaunched).toBe(true);
            expect(state.isFirstLaunch).toBe(false);
        });

        it('isFirstLaunch is true when hasLaunched is false after rehydration', async () => {
            // Simulate first launch user: localStorage has hasLaunched: false
            const persistedState = {
                state: { hasLaunched: false },
                version: 0,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

            // Trigger rehydration and wait for it to complete
            await useAppStateStore.persist.rehydrate();

            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(false);
            expect(state.isFirstLaunch).toBe(true);
        });

        it('uses default state when localStorage is empty', async () => {
            localStorage.clear();

            // Trigger rehydration and wait for it to complete
            await useAppStateStore.persist.rehydrate();

            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(false);
            expect(state.isFirstLaunch).toBe(true);
        });

        it('handles corrupted localStorage gracefully', async () => {
            // Set invalid JSON
            localStorage.setItem(STORAGE_KEY, 'not-valid-json');

            // Trigger rehydration - should not throw
            await expect(useAppStateStore.persist.rehydrate()).resolves.not.toThrow();

            // State should use defaults
            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(false);
            expect(state.isFirstLaunch).toBe(true);
        });
    });

    describe('full lifecycle simulation', () => {
        it('persists hasLaunched correctly after onboarding', () => {
            // 1. First launch - initial state
            let state = useAppStateStore.getState();
            expect(state.isFirstLaunch).toBe(true);
            expect(state.hasLaunched).toBe(false);

            // 2. User completes onboarding
            state.setHasLaunched(true);
            state = useAppStateStore.getState();
            expect(state.isFirstLaunch).toBe(false);
            expect(state.hasLaunched).toBe(true);

            // 3. Verify persisted to localStorage
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
            expect(stored.state.hasLaunched).toBe(true);
            // isFirstLaunch should NOT be persisted (partialize excludes it)
            expect(stored.state.isFirstLaunch).toBeUndefined();
        });

        it('rehydration correctly derives isFirstLaunch from persisted hasLaunched', async () => {
            // This test verifies the full reload scenario using the same pattern
            // as the rehydration tests but in a lifecycle context

            // Step 1: Simulate localStorage from a previous session where user completed onboarding
            const persistedState = {
                state: { hasLaunched: true },
                version: 0,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

            // Step 2: Rehydrate (simulating app load)
            await useAppStateStore.persist.rehydrate();

            // Step 3: Verify state is correctly restored with derived isFirstLaunch
            const state = useAppStateStore.getState();
            expect(state.hasLaunched).toBe(true);
            expect(state.isFirstLaunch).toBe(false); // CRITICAL: derived from hasLaunched
        });
    });
});
