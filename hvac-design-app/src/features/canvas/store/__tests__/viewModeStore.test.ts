import { describe, it, expect, beforeEach } from 'vitest';
import { useViewModeStore, VIEW_MODE_INITIAL_STATE } from '../../store/viewModeStore';

describe('viewModeStore', () => {
    beforeEach(() => {
        useViewModeStore.getState().reset();
    });

    it('starts in plan view by default', () => {
        const { activeViewMode } = useViewModeStore.getState();
        expect(activeViewMode).toBe('plan');
    });

    it('has correct initial state', () => {
        const state = useViewModeStore.getState();
        expect(state.activeViewMode).toBe(VIEW_MODE_INITIAL_STATE.activeViewMode);
        expect(state.is3DInitialized).toBe(VIEW_MODE_INITIAL_STATE.is3DInitialized);
        expect(state.show3DGrid).toBe(VIEW_MODE_INITIAL_STATE.show3DGrid);
        expect(state.show3DAxes).toBe(VIEW_MODE_INITIAL_STATE.show3DAxes);
        expect(state.selectionSyncEnabled).toBe(VIEW_MODE_INITIAL_STATE.selectionSyncEnabled);
    });

    it('setViewMode switches to 3d', () => {
        useViewModeStore.getState().setViewMode('3d');
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
    });

    it('setViewMode records previousViewMode', () => {
        useViewModeStore.getState().setViewMode('3d');
        expect(useViewModeStore.getState().previousViewMode).toBe('plan');
    });

    it('setViewMode is idempotent when same mode is set', () => {
        useViewModeStore.getState().setViewMode('plan');
        expect(useViewModeStore.getState().previousViewMode).toBeNull();
    });

    it('toggleViewMode switches between plan and 3d', () => {
        useViewModeStore.getState().toggleViewMode();
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');

        useViewModeStore.getState().toggleViewMode();
        expect(useViewModeStore.getState().activeViewMode).toBe('plan');
    });

    it('set3DInitialized updates the flag', () => {
        useViewModeStore.getState().set3DInitialized(true);
        expect(useViewModeStore.getState().is3DInitialized).toBe(true);

        useViewModeStore.getState().set3DInitialized(false);
        expect(useViewModeStore.getState().is3DInitialized).toBe(false);
    });

    describe('hydrateViewMode', () => {
        it('hydrates only specified fields', () => {
            useViewModeStore.getState().hydrateViewMode({ activeViewMode: '3d' });
            expect(useViewModeStore.getState().activeViewMode).toBe('3d');
            // Other fields remain at initial state
            expect(useViewModeStore.getState().show3DGrid).toBe(true);
        });

        it('allows partial hydration', () => {
            useViewModeStore.getState().hydrateViewMode({ show3DGrid: false });
            expect(useViewModeStore.getState().show3DGrid).toBe(false);
            expect(useViewModeStore.getState().activeViewMode).toBe('plan');
        });
    });

    describe('reset', () => {
        it('restores all state to initial values', () => {
            useViewModeStore.getState().setViewMode('3d');
            useViewModeStore.getState().set3DInitialized(true);
            useViewModeStore.getState().set3DGridVisible(false);

            useViewModeStore.getState().reset();

            const state = useViewModeStore.getState();
            expect(state.activeViewMode).toBe('plan');
            expect(state.is3DInitialized).toBe(false);
            expect(state.show3DGrid).toBe(true);
        });
    });
});
