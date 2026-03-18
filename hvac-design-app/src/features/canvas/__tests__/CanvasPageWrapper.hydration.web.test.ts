/**
 * CanvasPageWrapper — Web (localStorage) hydration path tests
 *
 * Tests cover the deterministic hybrid-reset policy:
 * - If both activeViewMode + threeDViewState are present, hydrate directly
 * - If either is missing, reset both stores first, then hydrate present fields
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useViewModeStore } from '../store/viewModeStore';
import { useThreeDViewStore } from '../store/threeDViewStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../store/selectionStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import type { LocalStoragePayload } from '../hooks/useAutoSave';
import { hydrateToStores } from '@/core/persistence/ProjectStateOrchestrator';

describe('CanvasPageWrapper hydration — web/localStorage path', () => {
    beforeEach(() => {
        useViewModeStore.getState().reset();
        useThreeDViewStore.getState().reset();
        useEntityStore.getState().clearAllEntities();
        usePreferencesStore.setState({ snapToGrid: true });
    });

    it('hydrates viewModeStore from activeViewMode field', () => {
        hydrateToStores({
            project: {
                settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
                threeDViewState: {
                    cameraTarget: { x: 0, y: 0, z: 0 },
                    cameraPosition: { x: 560, y: 320, z: 560 },
                    orbitRadius: 860,
                    polarAngle: 1.12,
                    azimuthAngle: 0.78,
                    cameraRestored: false,
                    showGrid: true,
                    showAxes: true,
                    showPlanOverlay: false,
                },
            } as any,
        } as Partial<LocalStoragePayload> as LocalStoragePayload);
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
    });

    it('hydrates threeDViewStore camera state', () => {
        hydrateToStores({
            project: {
                settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
                threeDViewState: {
                    cameraTarget: { x: 100, y: 50, z: 200 },
                    cameraPosition: { x: 560, y: 320, z: 560 },
                    orbitRadius: 500,
                    polarAngle: 0.9,
                    azimuthAngle: 1.2,
                    cameraRestored: false,
                    showGrid: false,
                    showAxes: true,
                    showPlanOverlay: false,
                },
            } as any,
        } as Partial<LocalStoragePayload> as LocalStoragePayload);
        expect(useThreeDViewStore.getState().cameraTarget).toEqual({ x: 100, y: 50, z: 200 });
        expect(useThreeDViewStore.getState().orbitRadius).toBe(500);
    });

    it('hydrates selection state', () => {
        hydrateToStores({
            project: {
                settings: { activeViewMode: '3d', unitSystem: 'imperial', gridSize: 12, gridVisible: true },
                threeDViewState: {
                    cameraTarget: { x: 0, y: 0, z: 0 },
                    cameraPosition: { x: 560, y: 320, z: 560 },
                    orbitRadius: 860,
                    polarAngle: 1.12,
                    azimuthAngle: 0.78,
                    cameraRestored: false,
                    showGrid: true,
                    showAxes: true,
                    showPlanOverlay: false,
                },
            } as any,
            selection: { selectedIds: ['entity-1'], hoveredId: null },
        } as Partial<LocalStoragePayload> as LocalStoragePayload);
        expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1']);
    });
});
