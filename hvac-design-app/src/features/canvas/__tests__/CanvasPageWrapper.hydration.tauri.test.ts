/**
 * CanvasPageWrapper — Tauri (.sws file) hydration path tests
 *
 * Mirrors the hydration contract in the Tauri branch of CanvasPageWrapper,
 * which reads from ProjectFile (parsed from .sws) instead of localStorage.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useViewModeStore, VIEW_MODE_INITIAL_STATE } from '../store/viewModeStore';
import { useThreeDViewStore, THREE_D_VIEW_INITIAL_STATE } from '../store/threeDViewStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { ProjectFile } from '@/core/schema/project-file.schema';

// Simplified inline of the Tauri hydration branch logic from CanvasPageWrapper
function hydrateTauriProject(project: Partial<ProjectFile>) {
    const hasTauriViewMode = Boolean(project.settings?.activeViewMode);
    const hasTauriThreeDState = Boolean(project.threeDViewState);

    if (!hasTauriViewMode || !hasTauriThreeDState) {
        useViewModeStore.getState().reset();
        useThreeDViewStore.getState().reset();
    }

    if (hasTauriViewMode) {
        useViewModeStore.getState().hydrateViewMode({
            activeViewMode: project.settings!.activeViewMode,
        });
    }

    if (hasTauriThreeDState) {
        useThreeDViewStore.getState().hydrateThreeDView(project.threeDViewState!);
    }

    if (project.entities) {
        useEntityStore.getState().hydrate(project.entities);
    }
}

describe('CanvasPageWrapper hydration — Tauri file path', () => {
    beforeEach(() => {
        useViewModeStore.getState().reset();
        useThreeDViewStore.getState().reset();
        useEntityStore.getState().clearAllEntities();
    });

    it('hydrates viewMode from settings.activeViewMode', () => {
        hydrateTauriProject({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: THREE_D_VIEW_INITIAL_STATE,
        });
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
    });

    it('hydrates threeDViewStore camera from file payload', () => {
        hydrateTauriProject({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: {
                ...THREE_D_VIEW_INITIAL_STATE,
                orbitRadius: 650,
                polarAngle: 1.0,
                cameraTarget: { x: 300, y: 0, z: 150 },
            },
        });
        expect(useThreeDViewStore.getState().orbitRadius).toBe(650);
        expect(useThreeDViewStore.getState().cameraTarget).toEqual({ x: 300, y: 0, z: 150 });
    });

    it('restores plan view when settings.activeViewMode is plan', () => {
        hydrateTauriProject({
            settings: { activeViewMode: 'plan', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: THREE_D_VIEW_INITIAL_STATE,
        });
        expect(useViewModeStore.getState().activeViewMode).toBe('plan');
    });

    it('resets then hydrates threeDViewState when activeViewMode is absent (Tauri path)', () => {
        useViewModeStore.setState({
            activeViewMode: '3d',
            previousViewMode: 'plan',
            is3DInitialized: true,
            show3DGrid: false,
            show3DAxes: false,
            showPlanOverlayIn3D: true,
            selectionSyncEnabled: false,
        });

        useThreeDViewStore.setState({
            cameraTarget: { x: 999, y: 999, z: 999 },
            cameraPosition: { x: 999, y: 999, z: 999 },
            orbitRadius: 999,
            polarAngle: 9,
            azimuthAngle: 9,
            cameraRestored: true,
            showGrid: false,
            showAxes: false,
            showPlanOverlay: true,
        });

        const payloadThreeDState: NonNullable<ProjectFile['threeDViewState']> = {
            cameraTarget: { x: 100, y: 50, z: 200 },
            cameraPosition: { x: 560, y: 320, z: 560 },
            orbitRadius: 500,
            polarAngle: 0.9,
            azimuthAngle: 1.2,
            showGrid: false,
            showAxes: true,
            showPlanOverlay: false,
        };

        hydrateTauriProject({
            settings: {
                // activeViewMode intentionally omitted
                unitSystem: 'imperial',
                gridSize: 12,
                gridVisible: true,
            },
            threeDViewState: payloadThreeDState,
        });

        expect(useViewModeStore.getState()).toMatchObject(VIEW_MODE_INITIAL_STATE);
        expect(useThreeDViewStore.getState()).toMatchObject({
            ...THREE_D_VIEW_INITIAL_STATE,
            ...payloadThreeDState,
            cameraRestored: true,
        });
    });

    it('resets then hydrates viewMode when threeDViewState is absent (Tauri path)', () => {
        useViewModeStore.setState({
            activeViewMode: '3d',
            previousViewMode: 'plan',
            is3DInitialized: true,
            show3DGrid: false,
            show3DAxes: false,
            showPlanOverlayIn3D: true,
            selectionSyncEnabled: false,
        });

        useThreeDViewStore.setState({
            cameraTarget: { x: 10, y: 20, z: 30 },
            cameraPosition: { x: 1, y: 2, z: 3 },
            orbitRadius: 123,
            polarAngle: 0.5,
            azimuthAngle: 0.25,
            cameraRestored: true,
            showGrid: false,
            showAxes: false,
            showPlanOverlay: true,
        });

        hydrateTauriProject({
            settings: {
                activeViewMode: 'plan',
                unitSystem: 'imperial',
                gridSize: 12,
                gridVisible: true,
            },
            // threeDViewState intentionally omitted
        });

        expect(useViewModeStore.getState()).toMatchObject({
            ...VIEW_MODE_INITIAL_STATE,
            activeViewMode: 'plan',
        });
        expect(useThreeDViewStore.getState()).toMatchObject(THREE_D_VIEW_INITIAL_STATE);
    });

    it('keeps both stores at initial defaults when neither activeViewMode nor threeDViewState are present (Tauri path)', () => {
        useViewModeStore.setState({
            activeViewMode: '3d',
            previousViewMode: 'plan',
            is3DInitialized: true,
            show3DGrid: false,
            show3DAxes: false,
            showPlanOverlayIn3D: true,
            selectionSyncEnabled: false,
        });

        useThreeDViewStore.setState({
            cameraTarget: { x: 10, y: 20, z: 30 },
            cameraPosition: { x: 1, y: 2, z: 3 },
            orbitRadius: 123,
            polarAngle: 0.5,
            azimuthAngle: 0.25,
            cameraRestored: true,
            showGrid: false,
            showAxes: false,
            showPlanOverlay: true,
        });

        hydrateTauriProject({
            settings: {
                // activeViewMode intentionally omitted
                unitSystem: 'imperial',
                gridSize: 12,
                gridVisible: true,
            },
            // threeDViewState intentionally omitted
        });

        expect(useViewModeStore.getState()).toMatchObject(VIEW_MODE_INITIAL_STATE);
        expect(useThreeDViewStore.getState()).toMatchObject(THREE_D_VIEW_INITIAL_STATE);
    });
});
