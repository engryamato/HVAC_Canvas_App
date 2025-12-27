import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave, saveProjectToStorage, loadProjectFromStorage, deleteProjectFromStorage } from '../useAutoSave';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useViewportStore } from '../../store/viewportStore';
import type { Room } from '@/core/schema';

// Mock localStorage
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

global.localStorage = localStorageMock as Storage;

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

describe('useAutoSave - Storage Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveProjectToStorage', () => {
    it('should save project to localStorage', () => {
      const projectId = 'project-1';
      const project = {
        projectId,
        projectName: 'Test Project',
        projectNumber: 'TP-001',
        clientName: 'Test Client',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        entities: { byId: {}, allIds: [] },
        viewportState: { panX: 0, panY: 0, zoom: 1 },
        settings: { unitSystem: 'imperial' as const, gridSize: 12, gridVisible: true },
      };

      const result = saveProjectToStorage(projectId, project);

      expect(result).toBe(true);
      expect(localStorage.getItem('hvac-project-project-1')).toBeTruthy();
    });

    it('should return false on storage error', () => {
      const projectId = 'project-1';
      const project = { circular: {} as any };
      project.circular = project; // Create circular reference

      const result = saveProjectToStorage(projectId, project as any);

      expect(result).toBe(false);
    });
  });

  describe('loadProjectFromStorage', () => {
    it('should load project from localStorage', () => {
      const projectId = 'project-1';
      const project = {
        projectId,
        projectName: 'Test Project',
        projectNumber: 'TP-001',
        clientName: 'Test Client',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        entities: { byId: {}, allIds: [] },
        viewportState: { panX: 0, panY: 0, zoom: 1 },
        settings: { unitSystem: 'imperial' as const, gridSize: 12, gridVisible: true },
      };

      saveProjectToStorage(projectId, project);

      const loaded = loadProjectFromStorage(projectId);

      expect(loaded).toEqual(project);
    });

    it('should return null for non-existent project', () => {
      const loaded = loadProjectFromStorage('non-existent');

      expect(loaded).toBeNull();
    });

    it('should return null on parse error', () => {
      localStorage.setItem('hvac-project-bad', 'invalid json');

      const loaded = loadProjectFromStorage('bad');

      expect(loaded).toBeNull();
    });
  });

  describe('deleteProjectFromStorage', () => {
    it('should delete project from localStorage', () => {
      const projectId = 'project-1';
      localStorage.setItem('hvac-project-project-1', 'data');

      const result = deleteProjectFromStorage(projectId);

      expect(result).toBe(true);
      expect(localStorage.getItem('hvac-project-project-1')).toBeNull();
    });
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
    });
    useProjectStore.setState({
      currentProjectId: 'test-project',
      projectDetails: {
        projectId: 'test-project',
        projectName: 'Test Project',
        projectNumber: 'TP-001',
        clientName: 'Test Client',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      isDirty: false,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Manual Save', () => {
    it('should save when save() is called', () => {
      const { result } = renderHook(() => useAutoSave({ enabled: false }));

      act(() => {
        result.current.save();
      });

      const saved = loadProjectFromStorage('test-project');
      expect(saved).toBeTruthy();
      expect(saved?.projectName).toBe('Test Project');
    });

    it('should return true on successful save', () => {
      const { result } = renderHook(() => useAutoSave({ enabled: false }));

      let saveResult: boolean = false;
      act(() => {
        saveResult = result.current.save();
      });

      expect(saveResult).toBe(true);
    });

    it('should call onSave callback', () => {
      const onSave = vi.fn();
      const { result } = renderHook(() => useAutoSave({ enabled: false, onSave }));

      act(() => {
        result.current.save();
      });

      expect(onSave).toHaveBeenCalledWith(true);
    });

    it('should mark as not dirty after successful save', () => {
      useProjectStore.setState({ isDirty: true });

      const { result } = renderHook(() => useAutoSave({ enabled: false }));

      act(() => {
        result.current.save();
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Dirty State Tracking', () => {
    it('should mark as dirty when entities change', async () => {
      const { result, rerender } = renderHook(() => useAutoSave({ enabled: true }));

      expect(result.current.isDirty).toBe(false);

      // Add entity
      act(() => {
        const room = createMockRoom('room-1', 'Room 1');
        useEntityStore.getState().addEntity(room);
      });

      // Force rerender to pick up state changes
      rerender();

      expect(result.current.isDirty).toBe(true);
    });

    it('should mark as dirty when viewport changes', async () => {
      const { result, rerender } = renderHook(() => useAutoSave({ enabled: true }));

      expect(result.current.isDirty).toBe(false);

      // Change viewport
      act(() => {
        useViewportStore.setState({ panX: 100, panY: 100 });
      });

      // Force rerender to pick up state changes
      rerender();

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Debounced Save', () => {
    it('should save after debounce delay when dirty', () => {
      const onSave = vi.fn();
      renderHook(() => useAutoSave({ enabled: true, debounceDelay: 1000, onSave }));

      // Make dirty
      act(() => {
        const room = createMockRoom('room-1', 'Room 1');
        useEntityStore.getState().addEntity(room);
        useProjectStore.setState({ isDirty: true });
      });

      // Should not save immediately
      expect(onSave).not.toHaveBeenCalled();

      // Fast-forward debounce delay
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onSave).toHaveBeenCalled();
    });

    it('should reset debounce on multiple changes', () => {
      const onSave = vi.fn();
      const { rerender } = renderHook(() => useAutoSave({ enabled: true, debounceDelay: 1000, onSave }));

      // First change - set dirty
      act(() => {
        useProjectStore.setState({ isDirty: true });
      });

      // Fast-forward 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Second change (should reset timer) - trigger via viewport change
      act(() => {
        useViewportStore.setState({ panX: 100 });
      });
      // Rerender to pick up change counter update
      rerender();

      // Fast-forward another 500ms (total 1000ms from first, but only 500ms from second)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should not have saved yet (only 500ms since last change)
      expect(onSave).not.toHaveBeenCalled();

      // Fast-forward remaining 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('Interval Auto-Save', () => {
    it('should auto-save at specified interval when dirty', () => {
      const onSave = vi.fn();
      renderHook(() => useAutoSave({ enabled: true, interval: 5000, onSave }));

      // Make dirty
      act(() => {
        useProjectStore.setState({ isDirty: true });
      });

      // Fast-forward to interval
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onSave).toHaveBeenCalled();
    });

    it('should not auto-save when not dirty', () => {
      const onSave = vi.fn();
      renderHook(() => useAutoSave({ enabled: true, interval: 5000, onSave }));

      // Keep clean
      act(() => {
        useProjectStore.setState({ isDirty: false });
      });

      // Fast-forward to interval
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should not auto-save when disabled', async () => {
      const onSave = vi.fn();
      renderHook(() => useAutoSave({ enabled: false, onSave }));

      // Make dirty
      act(() => {
        useProjectStore.setState({ isDirty: true });
      });

      // Fast-forward debounce delay
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should allow manual save when disabled', () => {
      const onSave = vi.fn();
      const { result } = renderHook(() => useAutoSave({ enabled: false, onSave }));

      act(() => {
        result.current.save();
      });

      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('Page Unload', () => {
    it('should save on beforeunload when dirty', () => {
      const { result } = renderHook(() => useAutoSave({ enabled: true }));

      act(() => {
        useProjectStore.setState({ isDirty: true });
      });

      const event = new Event('beforeunload') as BeforeUnloadEvent;
      act(() => {
        window.dispatchEvent(event);
      });

      const saved = loadProjectFromStorage('test-project');
      expect(saved).toBeTruthy();
    });

    it('should not save on beforeunload when not dirty', () => {
      const onSave = vi.fn();
      renderHook(() => useAutoSave({ enabled: true, onSave }));

      act(() => {
        useProjectStore.setState({ isDirty: false });
      });

      const event = new Event('beforeunload') as BeforeUnloadEvent;
      act(() => {
        window.dispatchEvent(event);
      });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing project ID', () => {
      useProjectStore.setState({ currentProjectId: null });

      const { result } = renderHook(() => useAutoSave({ enabled: true }));

      const saveResult = result.current.save();

      expect(saveResult).toBe(false);
    });

    it('should handle missing project details', () => {
      useProjectStore.setState({ projectDetails: null });

      const { result } = renderHook(() => useAutoSave({ enabled: true }));

      const saveResult = result.current.save();

      expect(saveResult).toBe(false);
    });
  });
});
