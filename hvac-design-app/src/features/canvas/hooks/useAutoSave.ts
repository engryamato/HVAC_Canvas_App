'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useViewportStore } from '../store/viewportStore';
import { createEmptyProjectFile, type ProjectFile } from '@/core/schema/project-file.schema';

/** Auto-save interval in milliseconds */
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/** Debounce delay for save after changes */
const SAVE_DEBOUNCE_DELAY = 2000; // 2 seconds

/**
 * Storage key prefix for project data
 */
const getProjectStorageKey = (projectId: string) => `hvac-project-${projectId}`;

/**
 * Save project to localStorage
 */
export function saveProjectToStorage(projectId: string, project: ProjectFile): boolean {
  try {
    const key = getProjectStorageKey(projectId);
    const data = JSON.stringify(project);
    localStorage.setItem(key, data);
    return true;
  } catch (error) {
    console.error('Failed to save project:', error);
    return false;
  }
}

/**
 * Load project from localStorage
 */
export function loadProjectFromStorage(projectId: string): ProjectFile | null {
  try {
    const key = getProjectStorageKey(projectId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as ProjectFile;
  } catch (error) {
    console.error('Failed to load project:', error);
    return null;
  }
}

/**
 * Delete project from localStorage
 */
export function deleteProjectFromStorage(projectId: string): boolean {
  try {
    const key = getProjectStorageKey(projectId);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to delete project:', error);
    return false;
  }
}

/**
 * Get all project keys from localStorage
 */
export function getAllProjectKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('hvac-project-')) {
      keys.push(key.replace('hvac-project-', ''));
    }
  }
  return keys;
}

interface UseAutoSaveOptions {
  /** Enable auto-save (default: true) */
  enabled?: boolean;
  /** Auto-save interval in ms (default: 30000) */
  interval?: number;
  /** Debounce delay for changes in ms (default: 2000) */
  debounceDelay?: number;
  /** Callback when save occurs */
  onSave?: (success: boolean) => void;
}

interface UseAutoSaveReturn {
  /** Manually trigger a save */
  save: () => boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Last save timestamp */
  lastSaved: Date | null;
}

/**
 * Hook for auto-saving project data
 */
export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const {
    enabled = true,
    interval = AUTO_SAVE_INTERVAL,
    debounceDelay = SAVE_DEBOUNCE_DELAY,
    onSave,
  } = options;

  const lastSavedRef = useRef<Date | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousStateRef = useRef<string | null>(null);

  const projectId = useProjectStore((state) => state.currentProjectId);
  const projectDetails = useProjectStore((state) => state.projectDetails);
  const isDirty = useProjectStore((state) => state.isDirty);
  const setDirty = useProjectStore((state) => state.setDirty);
  const entities = useEntityStore((state) => ({ byId: state.byId, allIds: state.allIds }));
  const viewport = useViewportStore((state) => ({
    panX: state.panX,
    panY: state.panY,
    zoom: state.zoom,
  }));

  const save = useCallback((): boolean => {
    if (!projectId || !projectDetails) return false;

    const project: ProjectFile = {
      ...createEmptyProjectFile(projectId, projectDetails.projectName),
      projectId,
      projectName: projectDetails.projectName,
      projectNumber: projectDetails.projectNumber,
      clientName: projectDetails.clientName,
      createdAt: projectDetails.createdAt,
      modifiedAt: new Date().toISOString(),
      entities,
      viewportState: viewport,
    };

    const success = saveProjectToStorage(projectId, project);
    if (success) {
      lastSavedRef.current = new Date();
      setDirty(false);
      previousStateRef.current = JSON.stringify({ entities, viewport });
    }
    onSave?.(success);
    return success;
  }, [projectId, projectDetails, entities, viewport, setDirty, onSave]);

  // Detect changes and mark as dirty
  useEffect(() => {
    if (!enabled || !projectId) return;

    const currentState = JSON.stringify({ entities, viewport });
    if (previousStateRef.current !== null && previousStateRef.current !== currentState) {
      setDirty(true);
    }
    previousStateRef.current = currentState;
  }, [enabled, projectId, entities, viewport, setDirty]);

  // Debounced save on changes
  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      save();
    }, debounceDelay);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [enabled, isDirty, debounceDelay, save]);

  // Periodic auto-save
  useEffect(() => {
    if (!enabled || !projectId) return;

    const intervalId = setInterval(() => {
      if (isDirty) {
        save();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [enabled, projectId, isDirty, interval, save]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        save();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, isDirty, save]);

  return {
    save,
    isDirty,
    lastSaved: lastSavedRef.current,
  };
}

export default useAutoSave;
