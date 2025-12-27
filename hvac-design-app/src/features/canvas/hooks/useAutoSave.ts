'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore, useProjectActions } from '@/core/store/project.store';
import { useViewportStore } from '../store/viewportStore';

const STORAGE_KEY_PREFIX = 'hvac-project-';

export interface StoredProject {
  projectId: string;
  projectName: string;
  projectNumber: string;
  clientName: string;
  createdAt: string;
  modifiedAt: string;
  entities: { byId: Record<string, unknown>; allIds: string[] };
  viewportState: { panX: number; panY: number; zoom: number };
  settings: { unitSystem: 'imperial' | 'metric'; gridSize: number; gridVisible: boolean };
}

/**
 * Save project to localStorage
 */
export function saveProjectToStorage(projectId: string, project: StoredProject): boolean {
  try {
    const key = `${STORAGE_KEY_PREFIX}${projectId}`;
    localStorage.setItem(key, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load project from localStorage
 */
export function loadProjectFromStorage(projectId: string): StoredProject | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${projectId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as StoredProject;
  } catch {
    return null;
  }
}

/**
 * Delete project from localStorage
 */
export function deleteProjectFromStorage(projectId: string): boolean {
  try {
    const key = `${STORAGE_KEY_PREFIX}${projectId}`;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceDelay?: number;
  interval?: number;
  onSave?: (success: boolean) => void;
}

/**
 * Hook for auto-saving project state to localStorage
 */
export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const { enabled = true, debounceDelay = 2000, interval, onSave } = options;

  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const projectDetails = useProjectStore((state) => state.projectDetails);
  const storeIsDirty = useProjectStore((state) => state.isDirty);
  const { setDirty } = useProjectActions();

  const [isDirty, setLocalDirty] = useState(storeIsDirty);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const intervalTimer = useRef<NodeJS.Timeout | null>(null);

  // Track previous entity/viewport state for dirty detection
  const prevEntityRef = useRef<string | null>(null);
  const prevViewportRef = useRef<string | null>(null);

  // Track changes for debounce reset
  const [changeCounter, setChangeCounter] = useState(0);

  // Sync isDirty with store
  useEffect(() => {
    setLocalDirty(storeIsDirty);
  }, [storeIsDirty]);

  // Clear timers
  const clearTimers = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (intervalTimer.current) {
      clearInterval(intervalTimer.current);
      intervalTimer.current = null;
    }
  }, []);

  // Build project data for storage
  const buildProjectData = useCallback((): StoredProject | null => {
    if (!currentProjectId || !projectDetails) return null;

    const entityStore = useEntityStore.getState();
    const viewportStore = useViewportStore.getState();

    return {
      projectId: currentProjectId,
      projectName: projectDetails.projectName,
      projectNumber: projectDetails.projectNumber || '',
      clientName: projectDetails.clientName || '',
      createdAt: projectDetails.createdAt,
      modifiedAt: new Date().toISOString(),
      entities: {
        byId: entityStore.byId as Record<string, unknown>,
        allIds: entityStore.allIds,
      },
      viewportState: {
        panX: viewportStore.panX,
        panY: viewportStore.panY,
        zoom: viewportStore.zoom,
      },
      settings: {
        unitSystem: 'imperial',
        gridSize: viewportStore.gridSize || 12,
        gridVisible: viewportStore.gridVisible,
      },
    };
  }, [currentProjectId, projectDetails]);

  // Save function
  const save = useCallback((): boolean => {
    if (!currentProjectId) return false;

    const projectData = buildProjectData();
    if (!projectData) return false;

    const success = saveProjectToStorage(currentProjectId, projectData);

    if (success) {
      setLocalDirty(false);
      setDirty(false);
    }

    onSave?.(success);
    return success;
  }, [currentProjectId, buildProjectData, onSave, setDirty]);

  // Watch for entity changes to detect dirty state
  useEffect(() => {
    // Initialize with current state
    const initialState = useEntityStore.getState();
    prevEntityRef.current = JSON.stringify({ byId: initialState.byId, allIds: initialState.allIds });

    const unsubEntity = useEntityStore.subscribe((state) => {
      const currentState = JSON.stringify({ byId: state.byId, allIds: state.allIds });
      if (prevEntityRef.current !== null && prevEntityRef.current !== currentState) {
        // Clear debounce timer immediately on change (synchronous reset)
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        setLocalDirty(true);
        setDirty(true);
        setChangeCounter((c) => c + 1);
      }
      prevEntityRef.current = currentState;
    });

    return () => unsubEntity();
  }, [setDirty]);

  // Watch for viewport changes to detect dirty state
  useEffect(() => {
    // Initialize with current state
    const initialState = useViewportStore.getState();
    prevViewportRef.current = JSON.stringify({ panX: initialState.panX, panY: initialState.panY, zoom: initialState.zoom });

    const unsubViewport = useViewportStore.subscribe((state) => {
      const currentState = JSON.stringify({ panX: state.panX, panY: state.panY, zoom: state.zoom });
      if (prevViewportRef.current !== null && prevViewportRef.current !== currentState) {
        // Clear debounce timer immediately on change (synchronous reset)
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        setLocalDirty(true);
        setDirty(true);
        setChangeCounter((c) => c + 1);
      }
      prevViewportRef.current = currentState;
    });

    return () => unsubViewport();
  }, [setDirty]);

  // Debounced auto-save - reset timer when changeCounter changes
  useEffect(() => {
    if (!enabled || !storeIsDirty) return;

    // Clear existing timer on each change (reset debounce)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    debounceTimer.current = setTimeout(() => {
      save();
    }, debounceDelay);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [enabled, storeIsDirty, debounceDelay, save, changeCounter]);

  // Interval-based auto-save
  useEffect(() => {
    if (!enabled || !interval) return;

    intervalTimer.current = setInterval(() => {
      if (storeIsDirty) {
        save();
      }
    }, interval);

    return () => {
      if (intervalTimer.current) {
        clearInterval(intervalTimer.current);
      }
    };
  }, [enabled, interval, storeIsDirty, save]);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (storeIsDirty) {
        save();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [storeIsDirty, save]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return {
    save,
    isDirty,
  };
}
