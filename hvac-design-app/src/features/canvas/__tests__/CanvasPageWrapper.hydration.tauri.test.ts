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
import { hydrateToStores } from '@/core/persistence/ProjectStateOrchestrator';

const defaultThreeDViewState: ProjectFile['threeDViewState'] = {
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraPosition: { x: 560, y: 320, z: 560 },
    orbitRadius: 860,
    polarAngle: 1.12,
    azimuthAngle: 0.78,
    cameraRestored: false,
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
        hydrateToStores({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: defaultThreeDViewState,
        } as Partial<ProjectFile> as ProjectFile);
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
    });

    it('hydrates threeDViewStore camera from file payload', () => {
        hydrateToStores({
            settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: {
                ...defaultThreeDViewState,
                orbitRadius: 650,
                polarAngle: 1.0,
                cameraTarget: { x: 300, y: 0, z: 150 },
            },
        } as Partial<ProjectFile> as ProjectFile);
        expect(useThreeDViewStore.getState().orbitRadius).toBe(650);
        expect(useThreeDViewStore.getState().cameraTarget).toEqual({ x: 300, y: 0, z: 150 });
    });

    it('restores plan view when settings.activeViewMode is plan', () => {
        hydrateToStores({
            settings: { activeViewMode: 'plan', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
            threeDViewState: defaultThreeDViewState,
        } as Partial<ProjectFile> as ProjectFile);
        expect(useViewModeStore.getState().activeViewMode).toBe('plan');
    });
});
