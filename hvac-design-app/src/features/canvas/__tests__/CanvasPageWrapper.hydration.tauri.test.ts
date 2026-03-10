/**
 * CanvasPageWrapper — Tauri (.sws file) hydration path tests
 *
 * Mirrors the hydration contract in the Tauri branch of CanvasPageWrapper,
 * which reads from ProjectFile (parsed from .sws) instead of localStorage.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useViewModeStore } from '../store/viewModeStore';
import { useThreeDViewStore } from '../store/threeDViewStore';
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

const defaultThreeDViewState: ProjectFile['threeDViewState'] = {
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraPosition: { x: 560, y: 320, z: 560 },
    orbitRadius: 860,
    polarAngle: 1.12,
    azimuthAngle: 0.78,
    showGrid: true,
    showAxes: true,
    showPlanOverlay: false,
};

describe('CanvasPageWrapper hydration — Tauri file path', () => {
    beforeEach(() => {
        useViewModeStore.getState().reset();
        useThreeDViewStore.getState().reset();
        useEntityStore.getState().clearAllEntities();
    });

    it('hydrates viewMode from settings.activeViewMode', () => {
        hydrateTauriProject({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: defaultThreeDViewState,
        });
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
    });

    it('hydrates threeDViewStore camera from file payload', () => {
        hydrateTauriProject({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: {
                ...defaultThreeDViewState,
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
            threeDViewState: defaultThreeDViewState,
        });
        expect(useViewModeStore.getState().activeViewMode).toBe('plan');
    });
});
