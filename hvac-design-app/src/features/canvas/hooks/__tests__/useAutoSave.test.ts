import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAutoSave,
  saveProjectToStorage,
  saveBackupToStorage,
  loadProjectFromStorage,
  deleteProjectFromStorage,
  createLocalStoragePayloadFromProjectFileWithDefaults,
  type LocalStoragePayload,
} from '../useAutoSave';
import { DELETED_PROJECTS_STORAGE_ARCHIVE_KEY } from '@/utils/storageKeys';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useViewportStore } from '../../store/viewportStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useThreeDViewStore } from '../../store/threeDViewStore';
import { useViewModeStore } from '../../store/viewModeStore';
import type { Room } from '@/core/schema';

// Spec reference: docs/user-journeys/08-file-management/tauri-offline/UJ-FM-002-AutoSave.md

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
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

(global as any).localStorage = localStorageMock;

const createMockRoom = (id: string, name: string): Room => ({
  id,
  type: 'room',
  transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name,
    width: 120,
    length: 120,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

const basePayload = (projectId: string): LocalStoragePayload => ({
  project: {
    schemaVersion: '1.0.0',
    projectId,
    projectName: 'Test Project',
    projectNumber: 'TP-001',
    clientName: 'Test Client',
    scope: {
      details: [],
      materials: [],
      projectType: 'commercial',
    },
    siteConditions: {
      elevation: '',
      outdoorTemp: '',
      indoorTemp: '',
      windSpeed: '',
      humidity: '',
      localCodes: '',
    },
    isArchived: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    entities: { byId: {}, allIds: [] },
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true },
    commandHistory: { commands: [], currentIndex: 0 },
  },
  selection: { selectedIds: [], hoveredId: null },
  viewport: { panX: 0, panY: 0, zoom: 1, gridVisible: true, gridSize: 12, snapToGrid: true },
  preferences: {
    projectFolder: '/projects',
    unitSystem: 'imperial',
    autoSaveEnabled: true,
    autoSaveInterval: 300000,
    gridSize: 24,
    theme: 'light',
    compactMode: false,
    snapToGrid: true,
    showRulers: false,
  },
  settings: { autoOpenLastProject: false },
  projectIndex: { projects: [], recentProjectIds: [], loading: false },
  legacyProjects: { projects: [] },
  history: { past: [], future: [], maxSize: 100 },
  uiState: {
    app: { hasLaunched: false, isFirstLaunch: true, isLoading: false },
    layout: {
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      activeLeftTab: 'equipment',
      activeRightTab: 'properties',
    },
    tool: { activeTool: 'select' },
    viewport: { zoom: 100, gridVisible: true, panOffset: { x: 0, y: 0 }, cursorPosition: { x: 0, y: 0 } },
    tutorial: { isActive: false, currentStep: 1, totalSteps: 5, completedSteps: [], isCompleted: false },
  },
});

describe('useAutoSave - Storage Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save project to localStorage', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    const result = saveProjectToStorage(projectId, basePayload(projectId));

    expect(result.success).toBe(true);
    expect(localStorage.getItem(`hvac-project-${projectId}`)).toBeTruthy();
  });

  it('should load project from localStorage', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    saveProjectToStorage(projectId, basePayload(projectId));

    const loaded = loadProjectFromStorage(projectId);

    expect(loaded?.payload.project.projectId).toBe(projectId);
    expect(loaded?.source).toBe('primary');
  });

  it('does not load another project from a mismatched storage envelope', () => {
    const requestedProjectId = '11111111-1111-4111-8111-111111111111';
    const otherProjectId = '22222222-2222-4222-8222-222222222222';
    const result = saveProjectToStorage(otherProjectId, basePayload(otherProjectId));

    localStorage.setItem(
      `hvac-project-${requestedProjectId}`,
      localStorage.getItem(`hvac-project-${otherProjectId}`) ?? ''
    );

    expect(result.success).toBe(true);
    expect(loadProjectFromStorage(requestedProjectId)).toBeNull();
  });

  it('rejects saving a payload under a different project id', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    const otherProjectId = '22222222-2222-4222-8222-222222222222';

    const result = saveProjectToStorage(projectId, basePayload(otherProjectId));

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not match');
    expect(localStorage.getItem(`hvac-project-${projectId}`)).toBeNull();
  });

  it('should fall back to backup when primary is corrupted', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    saveProjectToStorage(projectId, basePayload(projectId));
    saveBackupToStorage(projectId, basePayload(projectId));
    localStorage.setItem(`hvac-project-${projectId}`, 'corrupted');

    const loaded = loadProjectFromStorage(projectId);

    expect(loaded?.source).toBe('backup');
  });

  it('falls back to backup when primary selection references missing entities', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    const stalePrimary = {
      ...basePayload(projectId),
      selection: { selectedIds: ['missing-entity'], hoveredId: 'missing-entity' },
    };
    const room = createMockRoom('550e8400-e29b-41d4-a716-446655440010', 'Visible Room');
    const validBackup = {
      ...basePayload(projectId),
      project: {
        ...basePayload(projectId).project,
        entities: {
          byId: { [room.id]: room },
          allIds: [room.id],
        },
      },
      selection: { selectedIds: [room.id], hoveredId: room.id },
    };

    saveProjectToStorage(projectId, stalePrimary);
    saveBackupToStorage(projectId, validBackup);

    const loaded = loadProjectFromStorage(projectId);

    expect(loaded?.source).toBe('backup');
    expect(loaded?.payload.project.entities?.allIds).toEqual([room.id]);
  });

  it('should delete project from localStorage', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    saveProjectToStorage(projectId, basePayload(projectId));

    const result = deleteProjectFromStorage(projectId);

    expect(result).toBe(true);
    expect(localStorage.getItem(`hvac-project-${projectId}`)).toBeNull();
  });

  it('archives deleted project storage with the rest of deleted project storage', () => {
    const firstProjectId = '11111111-1111-4111-8111-111111111111';
    const secondProjectId = '22222222-2222-4222-8222-222222222222';
    saveProjectToStorage(firstProjectId, basePayload(firstProjectId));
    saveBackupToStorage(secondProjectId, basePayload(secondProjectId));

    deleteProjectFromStorage(firstProjectId);
    deleteProjectFromStorage(secondProjectId);

    const archive = JSON.parse(localStorage.getItem(DELETED_PROJECTS_STORAGE_ARCHIVE_KEY) ?? '[]');
    expect(archive).toHaveLength(2);
    expect(archive.map((entry: { projectId: string }) => entry.projectId)).toEqual([
      firstProjectId,
      secondProjectId,
    ]);
    expect(archive[0].primary).toContain(firstProjectId);
    expect(archive[1].backup).toContain(secondProjectId);
  });
});

describe('useAutoSave - Payload helpers', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ snapToGrid: true });
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 12,
      snapToGrid: true,
    });
  });

  it('hydrates snapToGrid from global preferences', () => {
    const projectId = '33333333-3333-4333-8333-333333333333';

    usePreferencesStore.setState({ snapToGrid: false });

    const payload = createLocalStoragePayloadFromProjectFileWithDefaults({
      ...basePayload(projectId).project,
      settings: {
        unitSystem: 'imperial',
        gridSize: 12,
        gridVisible: true,
        snapToGrid: false,
      },
    } as any);

    expect(payload.viewport.snapToGrid).toBe(false);
  });
});

describe('useAutoSave - Hook Behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.setState({ autoSaveEnabled: true });
    useEntityStore.getState().clearAllEntities();
    useViewModeStore.getState().reset();
    useThreeDViewStore.getState().reset();
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 12,
      snapToGrid: true,
    });
    useProjectStore.setState({
      currentProjectId: '22222222-2222-4222-8222-222222222222',
      projectDetails: {
        projectId: '22222222-2222-4222-8222-222222222222',
        projectName: 'Test Project',
        projectNumber: 'TP-001',
        clientName: 'Test Client',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
      },
      isDirty: false,
    });
    useHistoryStore.setState({ past: [], future: [], maxSize: 100 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should save when saveNow() is called', () => {
    const { result } = renderHook(() => useAutoSave({ enabled: false }));

    act(() => {
      result.current.saveNow();
    });

    const saved = loadProjectFromStorage('22222222-2222-4222-8222-222222222222');
    expect(saved).toBeTruthy();
    expect(saved?.payload.project.projectName).toBe('Test Project');
  });

  it('should auto-save at interval', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({ enabled: true, interval: 5000, onSave }));

    act(() => {
      const room = createMockRoom('room-1', 'Room 1');
      useEntityStore.getState().addEntity(room);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ source: 'auto', success: true }));
  });

  it('should not auto-save when disabled', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({ enabled: false, interval: 5000, onSave }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('useAutoSave — view/camera debounced persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.setState({ autoSaveEnabled: true });
    useEntityStore.getState().clearAllEntities();
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 12,
      snapToGrid: true,
    });
    useProjectStore.setState({
      currentProjectId: '44444444-4444-4444-8444-444444444444',
      projectDetails: {
        projectId: '44444444-4444-4444-8444-444444444444',
        projectName: 'View Camera Test',
        projectNumber: 'VC-001',
        clientName: 'Test Client',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
      },
      isDirty: false,
    });
    useHistoryStore.setState({ past: [], future: [], maxSize: 100 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('saves after viewModeStore changes within debounce window (1500ms)', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({ enabled: true, onSave }));

    act(() => {
      // Trigger a view mode change (no entity mutation)
      const { setViewMode } = useViewModeStore.getState();
      setViewMode('3d');
    });

    // Before debounce fires — no save yet
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Within debounce window (<= 1500ms total) — save fires
    act(() => {
      vi.advanceTimersByTime(500); // total elapsed: 1500ms
    });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ source: 'auto', success: true }));
  });

  it('saves after threeDViewStore changes within debounce window (1500ms)', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({ enabled: true, onSave }));

    act(() => {
      // Simulate camera orbit change (no entity mutation)
      useThreeDViewStore.getState().setOrbitState({
        orbitRadius: 600,
        polarAngle: 1.0,
        azimuthAngle: 0.5,
      });
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ source: 'auto', success: true }));
  });

  it('debounces rapid successive camera changes into a single save', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({ enabled: true, onSave }));

    // Rapid orbit changes
    act(() => {
      for (let i = 0; i < 10; i++) {
        useThreeDViewStore.getState().setOrbitState({
          orbitRadius: 600 + i * 10,
          polarAngle: 1.0,
          azimuthAngle: 0.5,
        });
      }
    });

    // Before debounce window — no save
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(onSave).not.toHaveBeenCalled();

    // After debounce window — exactly one save
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it.skip('flushes a pending viewMode-only save synchronously on beforeunload before the debounce fires', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({ enabled: true, onSave }));

    act(() => {
      // View-mode-only change, no entity or camera mutation
      useViewModeStore.getState().setViewMode('3d');
    });

    // Debounce window not yet elapsed — nothing saved
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onSave).toHaveBeenCalledTimes(0);

    // Simulate browser close — pending debounce should flush immediately
    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(loadProjectFromStorage('44444444-4444-4444-8444-444444444444')).toBeTruthy();

    // Debounce timer should be cleared; advancing time should not trigger another save
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(loadProjectFromStorage('44444444-4444-4444-8444-444444444444')).toBeTruthy();
  });

  it('flushes a pending view/camera save synchronously on beforeunload before the debounce fires', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({ enabled: true, onSave }));

    act(() => {
      useThreeDViewStore.getState().setOrbitState({
        orbitRadius: 600,
        polarAngle: 1.0,
        azimuthAngle: 0.5,
      });
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onSave).toHaveBeenCalledTimes(0);

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ source: 'auto', success: true }));
    expect(loadProjectFromStorage('44444444-4444-4444-8444-444444444444')).toBeTruthy();
  });
});
