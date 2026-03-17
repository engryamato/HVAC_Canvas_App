import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyProject } from '@/core/schema/project-file.schema';
import { useHistoryStore } from '@/core/commands/historyStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectStore } from '@/core/store/project.store';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useThreeDViewStore, THREE_D_VIEW_INITIAL_STATE } from '@/features/canvas/store/threeDViewStore';
import { useViewModeStore, VIEW_MODE_INITIAL_STATE } from '@/features/canvas/store/viewModeStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import { hydrateToStores, snapshotFromStores } from '../ProjectStateOrchestrator';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

(global as any).localStorage = localStorageMock;

describe('ProjectStateOrchestrator', () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().clearProject();
    useSelectionStore.getState().clearSelection();
    useSelectionStore.getState().setHovered(null);
    useViewModeStore.getState().reset();
    useThreeDViewStore.getState().reset();
    useHistoryStore.setState({ past: [], future: [], maxSize: 100 });
    useViewportStore.setState((state) => ({
      ...state,
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 12,
      snapToGrid: true,
    }));
    usePreferencesStore.setState({ unitSystem: 'imperial', snapToGrid: true, gridSize: 12 });
  });

  it('hydrates canonical payload state into the stores', () => {
    const project = {
      ...createEmptyProject('Hydration Project', {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      }),
      settings: {
        unitSystem: 'metric',
        gridSize: 24,
        gridVisible: false,
        snapToGrid: false,
        activeViewMode: '3d' as const,
      },
      viewportState: {
        panX: 10,
        panY: 20,
        zoom: 1.5,
      },
      threeDViewState: {
        cameraTarget: { x: 100, y: 50, z: 200 },
        cameraPosition: { x: 560, y: 320, z: 560 },
        orbitRadius: 500,
        polarAngle: 0.9,
        azimuthAngle: 1.2,
        showGrid: false,
        showAxes: true,
        showPlanOverlay: false,
      },
    };

    hydrateToStores(project, {
      payload: {
        selection: { selectedIds: ['entity-1'], hoveredId: 'entity-1' },
        history: { past: [{ id: 'command-1' }], future: [], maxSize: 50 },
        viewport: {
          panX: 10,
          panY: 20,
          zoom: 1.5,
          gridVisible: false,
          gridSize: 24,
          snapToGrid: false,
        },
      },
    });

    expect(useProjectStore.getState().projectDetails?.projectId).toBe(project.projectId);
    expect(useProjectStore.getState().projectSettings?.unitSystem).toBe('metric');
    expect(useViewportStore.getState()).toMatchObject({
      panX: 10,
      panY: 20,
      zoom: 1.5,
      gridVisible: false,
      gridSize: 24,
      snapToGrid: false,
    });
    expect(useViewModeStore.getState().activeViewMode).toBe('3d');
    expect(useThreeDViewStore.getState().cameraTarget).toEqual(project.threeDViewState.cameraTarget);
    expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1']);
    expect(useHistoryStore.getState().past).toEqual([{ id: 'command-1' }]);
    expect(localStorage.getItem('lastActiveProjectId')).toBe(project.projectId);
  });

  it('resets legacy 3d state residue when view metadata is absent', () => {
    useViewModeStore.getState().setViewMode('3d');
    useThreeDViewStore.getState().setCameraTarget({ x: 999, y: 999, z: 999 });

    const project = {
      ...createEmptyProject('Legacy Project', {
        projectId: '550e8400-e29b-41d4-a716-446655440001',
      }),
      settings: {
        unitSystem: 'imperial',
        gridSize: 12,
        gridVisible: true,
      },
      threeDViewState: undefined,
    };

    hydrateToStores(project);

    expect(useViewModeStore.getState()).toMatchObject(VIEW_MODE_INITIAL_STATE);
    expect(useThreeDViewStore.getState()).toMatchObject(THREE_D_VIEW_INITIAL_STATE);
  });

  it('snapshots the live store state through the canonical snapshot builder', () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440002';
    useProjectStore.getState().setProject(projectId, {
      projectId,
      projectName: 'Snapshot Project',
      isArchived: false,
      createdAt: '2026-03-17T00:00:00.000Z',
      modifiedAt: '2026-03-17T00:00:00.000Z',
    });
    useProjectStore.getState().setProjectSettings({ unitSystem: 'metric' });
    useViewportStore.setState((state) => ({
      ...state,
      panX: 42,
      panY: 84,
      zoom: 1.25,
      gridVisible: false,
      gridSize: 18,
      snapToGrid: false,
    }));

    const snapshot = snapshotFromStores();

    expect(snapshot).not.toBeNull();
    expect(snapshot?.projectId).toBe(projectId);
    expect(snapshot?.settings).toMatchObject({
      unitSystem: 'metric',
      gridSize: 18,
      gridVisible: false,
      snapToGrid: false,
      activeViewMode: 'plan',
    });
    expect(snapshot?.viewportState).toEqual({
      panX: 42,
      panY: 84,
      zoom: 1.25,
    });
  });
});
