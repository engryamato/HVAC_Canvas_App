import { describe, it, expect, beforeEach } from 'vitest';
import { useThreeDViewStore, THREE_D_VIEW_INITIAL_STATE } from '../../store/threeDViewStore';

describe('threeDViewStore', () => {
    beforeEach(() => {
        useThreeDViewStore.getState().reset();
    });

    it('has correct camera defaults', () => {
        const state = useThreeDViewStore.getState();
        expect(state.cameraTarget).toEqual({ x: 0, y: 0, z: 0 });
        expect(state.orbitRadius).toBe(THREE_D_VIEW_INITIAL_STATE.orbitRadius);
        expect(state.polarAngle).toBe(THREE_D_VIEW_INITIAL_STATE.polarAngle);
        expect(state.azimuthAngle).toBe(THREE_D_VIEW_INITIAL_STATE.azimuthAngle);
    });

    it('has correct display option defaults', () => {
        const state = useThreeDViewStore.getState();
        expect(state.cameraRestored).toBe(false);
        expect(state.showGrid).toBe(true);
        expect(state.showAxes).toBe(true);
        expect(state.showPlanOverlay).toBe(false);
    });

    it('setCameraTarget updates target', () => {
        useThreeDViewStore.getState().setCameraTarget({ x: 100, y: 50, z: 200 });
        expect(useThreeDViewStore.getState().cameraTarget).toEqual({ x: 100, y: 50, z: 200 });
    });

    it('setCameraPosition updates position', () => {
        useThreeDViewStore.getState().setCameraPosition({ x: 300, y: 150, z: 300 });
        expect(useThreeDViewStore.getState().cameraPosition).toEqual({ x: 300, y: 150, z: 300 });
    });

    it('setOrbitState updates all orbit fields', () => {
        useThreeDViewStore.getState().setOrbitState({
            orbitRadius: 500,
            polarAngle: 0.9,
            azimuthAngle: 1.2,
        });
        const state = useThreeDViewStore.getState();
        expect(state.orbitRadius).toBe(500);
        expect(state.polarAngle).toBe(0.9);
        expect(state.azimuthAngle).toBe(1.2);
    });

    it('setDisplayOptions toggles grid visibility', () => {
        useThreeDViewStore.getState().setDisplayOptions({ showGrid: false });
        expect(useThreeDViewStore.getState().showGrid).toBe(false);
        expect(useThreeDViewStore.getState().showAxes).toBe(true); // unchanged
    });

    describe('hydrateThreeDView', () => {
        it('hydrates camera target', () => {
            useThreeDViewStore.getState().hydrateThreeDView({ cameraTarget: { x: 50, y: 20, z: 80 } });
            expect(useThreeDViewStore.getState().cameraTarget).toEqual({ x: 50, y: 20, z: 80 });
            expect(useThreeDViewStore.getState().cameraRestored).toBe(true);
        });

        it('hydrates orbit radius and angles', () => {
            useThreeDViewStore.getState().hydrateThreeDView({
                orbitRadius: 700,
                polarAngle: 1.0,
                azimuthAngle: 0.5,
            });
            const state = useThreeDViewStore.getState();
            expect(state.orbitRadius).toBe(700);
            expect(state.polarAngle).toBe(1.0);
            expect(state.cameraRestored).toBe(true);
        });

        it('allows partial hydration without clobbering other fields', () => {
            useThreeDViewStore.getState().hydrateThreeDView({ showGrid: false });
            expect(useThreeDViewStore.getState().showGrid).toBe(false);
            expect(useThreeDViewStore.getState().showAxes).toBe(true); // untouched
        });
    });

    describe('reset', () => {
        it('restores all state to initial values', () => {
            useThreeDViewStore.getState().setCameraTarget({ x: 999, y: 999, z: 999 });
            useThreeDViewStore.getState().setDisplayOptions({ showGrid: false, showAxes: false });

            useThreeDViewStore.getState().reset();

            const state = useThreeDViewStore.getState();
            expect(state.cameraTarget).toEqual({ x: 0, y: 0, z: 0 });
            expect(state.cameraRestored).toBe(false);
            expect(state.showGrid).toBe(true);
            expect(state.showAxes).toBe(true);
        });
    });
});
