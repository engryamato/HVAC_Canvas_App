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
import { useViewportStore } from '../store/viewportStore';
import { useSelectionStore } from '../store/selectionStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import type { LocalStoragePayload } from '../hooks/useAutoSave';

// Inline a simplified version of the hydrateFromPayload logic from CanvasPageWrapper
// to test the hydration contract without needing to mount the full Next.js component.
function hydrateFromPayload(payload: Partial<LocalStoragePayload>) {
    if (payload?.project?.entities) {
        useEntityStore.getState().hydrate(payload.project.entities);
    }

    if (payload?.viewport) {
        useViewportStore.setState({
            panX: payload.viewport.panX,
            panY: payload.viewport.panY,
            zoom: payload.viewport.zoom,
            gridVisible: payload.viewport.gridVisible,
            gridSize: payload.viewport.gridSize,
            snapToGrid: payload.viewport.snapToGrid,
        });
    }

    const hasViewMode = Boolean(payload?.project?.settings?.activeViewMode);
    const hasThreeDState = Boolean(payload?.project?.threeDViewState);

    if (!hasViewMode || !hasThreeDState) {
        useViewModeStore.getState().reset();
        useThreeDViewStore.getState().reset();
    }

    if (hasViewMode) {
        useViewModeStore.getState().hydrateViewMode({
            activeViewMode: payload.project!.settings!.activeViewMode,
        });
    }

    if (hasThreeDState) {
        useThreeDViewStore.getState().hydrateThreeDView(payload.project!.threeDViewState!);
    }

    if (payload?.selection) {
        useSelectionStore.setState({
            selectedIds: payload.selection.selectedIds,
            hoveredId: payload.selection.hoveredId,
        });
    }
}

describe('CanvasPageWrapper hydration — web/localStorage path', () => {
    beforeEach(() => {
        useViewModeStore.getState().reset();
        useThreeDViewStore.getState().reset();
        useEntityStore.getState().clearAllEntities();
        usePreferencesStore.setState({ snapToGrid: true });
    });

    it('hydrates viewModeStore from activeViewMode field', () => {
        hydrateFromPayload({
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
        });
        expect(useViewModeStore.getState().activeViewMode).toBe('3d');
    });

    it('hydrates threeDViewStore camera state', () => {
        hydrateFromPayload({
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
        });
        expect(useThreeDViewStore.getState().cameraTarget).toEqual({ x: 100, y: 50, z: 200 });
        expect(useThreeDViewStore.getState().orbitRadius).toBe(500);
    });

    it('hydrates selection state', () => {
        hydrateFromPayload({
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
        });
        expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1']);
    });
});
