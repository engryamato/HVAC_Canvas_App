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
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useViewportStore } from '../../store/viewportStore';
import { useHistoryStore } from '@/core/commands/historyStore';
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
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name,
    width: 120,
    length: 120,
    height: 96,
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
    autoSaveInterval: 300000,
    gridSize: 24,
    theme: 'light',
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

  it('should fall back to backup when primary is corrupted', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    saveProjectToStorage(projectId, basePayload(projectId));
    saveBackupToStorage(projectId, basePayload(projectId));
    localStorage.setItem(`hvac-project-${projectId}`, 'corrupted');

    const loaded = loadProjectFromStorage(projectId);

    expect(loaded?.source).toBe('backup');
  });

  it('should delete project from localStorage', () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    saveProjectToStorage(projectId, basePayload(projectId));

    const result = deleteProjectFromStorage(projectId);

    expect(result).toBe(true);
    expect(localStorage.getItem(`hvac-project-${projectId}`)).toBeNull();
  });
});

describe('useAutoSave - Payload helpers', () => {
  beforeEach(() => {
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 12,
      snapToGrid: true,
    });
  });

  it('hydrates snapToGrid from project settings when available', () => {
    const projectId = '33333333-3333-4333-8333-333333333333';
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
      currentProjectId: '22222222-2222-4222-8222-222222222222',
      projectDetails: {
        projectId: '22222222-2222-4222-8222-222222222222',
        projectName: 'Test Project',
        projectNumber: 'TP-001',
        clientName: 'Test Client',
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
