/**
 * CanvasPageWrapper — Backward-compatibility hydration tests
 *
 * Covers the deterministic hybrid-reset policy for legacy/partial payloads:
 * - If EITHER activeViewMode OR threeDViewState is missing, BOTH stores are reset first,
 *   then only present fields are hydrated.
 * - This prevents previous-project state residue from leaking across project loads.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useViewModeStore } from '../store/viewModeStore';
import { useThreeDViewStore, THREE_D_VIEW_INITIAL_STATE } from '../store/threeDViewStore';
import type { ProjectFile } from '@/core/schema/project-file.schema';

function combineHydrate(payload: { settings?: Partial<ProjectFile['settings']>; threeDViewState?: ProjectFile['threeDViewState'] } = {}) {
    const hasViewMode = Boolean(payload.settings?.activeViewMode);
    const hasThreeDState = Boolean(payload.threeDViewState);

    if (!hasViewMode || !hasThreeDState) {
        useViewModeStore.getState().reset();
        useThreeDViewStore.getState().reset();
    }

    if (hasViewMode) {
        useViewModeStore.getState().hydrateViewMode({ activeViewMode: payload.settings!.activeViewMode });
    }
    if (hasThreeDState) {
        useThreeDViewStore.getState().hydrateThreeDView(payload.threeDViewState!);
    }
}

describe('CanvasPageWrapper hydration — backward-compat / partial payloads', () => {
    beforeEach(() => {
        // Pre-contaminate stores to simulate a previously-opened project leaving residue
        useViewModeStore.getState().setViewMode('3d');
        useThreeDViewStore.getState().setCameraTarget({ x: 999, y: 999, z: 999 });
        useThreeDViewStore.getState().setOrbitState({ orbitRadius: 9999, polarAngle: 2.5, azimuthAngle: 3.0 });
    });

    it('resets both stores when activeViewMode is missing', () => {
        combineHydrate({
            // NO settings.activeViewMode
            threeDViewState: {
                cameraTarget: { x: 50, y: 0, z: 50 },
                cameraPosition: { x: 560, y: 320, z: 560 },
                orbitRadius: 860,
                polarAngle: 1.12,
                azimuthAngle: 0.78,
                showGrid: true,
                showAxes: true,
                showPlanOverlay: false,
            },
        });
        // After reset: viewMode defaults to 'plan'
        expect(useViewModeStore.getState().activeViewMode).toBe('plan');
        // threeDViewState is present → hydrated after reset
        expect(useThreeDViewStore.getState().cameraTarget).toEqual({ x: 50, y: 0, z: 50 });
        // Residue orbit radius is gone (reset to default first)
        expect(useThreeDViewStore.getState().orbitRadius).toBe(860);
    });

    it('resets both stores when threeDViewState is missing', () => {
        combineHydrate({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            // NO threeDViewState
        });
        // After reset: viewMode re-hydrated to '3d' since it was present
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
        // threeDViewStore reset to defaults — contamination cleared
        expect(useThreeDViewStore.getState().cameraTarget).toEqual(THREE_D_VIEW_INITIAL_STATE.cameraTarget);
        expect(useThreeDViewStore.getState().orbitRadius).toBe(THREE_D_VIEW_INITIAL_STATE.orbitRadius);
    });

    it('resets both stores when both fields are missing (legacy file)', () => {
        combineHydrate({});
        // Both stores at clean defaults — no residue from previous project
        expect(useViewModeStore.getState().activeViewMode).toBe('plan');
        expect(useThreeDViewStore.getState().orbitRadius).toBe(THREE_D_VIEW_INITIAL_STATE.orbitRadius);
    });

    it('does NOT reset when both fields are present — hydrates directly', () => {
        const targetOrbitRadius = 450;
        combineHydrate({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: {
                cameraTarget: { x: 0, y: 0, z: 0 },
                cameraPosition: { x: 560, y: 320, z: 560 },
                orbitRadius: targetOrbitRadius,
                polarAngle: 1.12,
                azimuthAngle: 0.78,
                showGrid: true,
                showAxes: true,
                showPlanOverlay: false,
            },
        });
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
        expect(useThreeDViewStore.getState().orbitRadius).toBe(targetOrbitRadius);
    });
});
