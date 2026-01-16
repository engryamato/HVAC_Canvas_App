'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore, useProjectActions } from '@/core/store/project.store';
import { useViewportStore } from '../store/viewportStore';
import { useSelectionStore } from '../store/selectionStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useSettingsStore } from '@/core/store/settingsStore';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { useProjectStore as useLegacyProjectStore } from '@/stores/useProjectStore';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useToolStore as useLegacyToolStore } from '@/stores/useToolStore';
import { useViewportStore as useLegacyViewportStore } from '@/stores/useViewportStore';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { ProjectFileSchema, type ProjectFile, CURRENT_SCHEMA_VERSION } from '@/core/schema/project-file.schema';
import { getProjectBackupKey, getProjectStorageKey, estimateStorageSizeBytes } from '@/utils/storageKeys';
import { trackTelemetry } from '@/utils/telemetry';
import { sendCloudBackup } from '@/services/cloudBackupService';

const STORAGE_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;

export type SaveSource = 'auto' | 'manual';

export interface SaveResult {
  success: boolean;
  source: SaveSource;
  sizeBytes?: number;
  error?: string;
}

export interface LocalStoragePayload {
  project: ProjectFile;
  selection: {
    selectedIds: string[];
    hoveredId: string | null;
  };
  viewport: {
    panX: number;
    panY: number;
    zoom: number;
    gridVisible: boolean;
    gridSize: number;
    snapToGrid: boolean;
  };
  preferences: {
    projectFolder: string;
    unitSystem: 'imperial' | 'metric';
    autoSaveInterval: number;
    gridSize: number;
    theme: 'light' | 'dark';
  };
  settings: {
    autoOpenLastProject: boolean;
  };
  projectIndex: {
    projects: Array<Record<string, unknown>>;
    recentProjectIds: string[];
    loading: boolean;
    error?: string;
  };
  legacyProjects: {
    projects: Array<Record<string, unknown>>;
  };
  history: {
    past: Array<Record<string, unknown>>;
    future: Array<Record<string, unknown>>;
    maxSize: number;
  };
  uiState: {
    app: {
      hasLaunched: boolean;
      isFirstLaunch: boolean;
      isLoading: boolean;
    };
    layout: {
      leftSidebarCollapsed: boolean;
      rightSidebarCollapsed: boolean;
      activeLeftTab: string;
      activeRightTab: string;
    };
    tool: {
      activeTool: string | null;
    };
    viewport: {
      zoom: number;
      gridVisible: boolean;
      panOffset: { x: number; y: number };
      cursorPosition: { x: number; y: number };
    };
    tutorial: {
      isActive: boolean;
      currentStep: number;
      totalSteps: number;
      completedSteps: number[];
      isCompleted: boolean;
    };
  };
}

export interface LocalStorageEnvelope {
  schemaVersion: string;
  projectId: string;
  savedAt: string;
  checksum: string;
  payload: LocalStoragePayload;
}

export interface LoadedProject {
  payload: LocalStoragePayload;
  source: 'primary' | 'backup';
  savedAt: string;
  checksum: string;
}

const EnvelopeSchema = z.object({
  schemaVersion: z.string(),
  projectId: z.string(),
  savedAt: z.string(),
  checksum: z.string(),
  payload: z.object({
    project: ProjectFileSchema,
  }).passthrough(),
});

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function buildChecksum(payload: LocalStoragePayload): string {
  return hashString(JSON.stringify(payload));
}

function parseEnvelope(serialized: string): LocalStorageEnvelope | null {
  try {
    const parsed = JSON.parse(serialized) as LocalStorageEnvelope;
    const result = EnvelopeSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isEnvelopeValid(envelope: LocalStorageEnvelope): boolean {
  if (!ProjectFileSchema.safeParse(envelope.payload.project).success) {
    return false;
  }
  const checksum = buildChecksum(envelope.payload);
  return checksum === envelope.checksum;
}

export interface StorageWriteResult {
  success: boolean;
  sizeBytes?: number;
  envelope?: LocalStorageEnvelope;
  error?: string;
}

export function saveProjectToStorage(projectId: string, payload: LocalStoragePayload): StorageWriteResult {
  try {
    const savedAt = new Date().toISOString();
    const checksum = buildChecksum(payload);
    const envelope: LocalStorageEnvelope = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      projectId,
      savedAt,
      checksum,
      payload,
    };

    const serialized = JSON.stringify(envelope);
    localStorage.setItem(getProjectStorageKey(projectId), serialized);

    return {
      success: true,
      sizeBytes: estimateStorageSizeBytes(serialized),
      envelope,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function saveBackupToStorage(projectId: string, payload: LocalStoragePayload): StorageWriteResult {
  try {
    const savedAt = new Date().toISOString();
    const checksum = buildChecksum(payload);
    const envelope: LocalStorageEnvelope = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      projectId,
      savedAt,
      checksum,
      payload,
    };

    const serialized = JSON.stringify(envelope);
    localStorage.setItem(getProjectBackupKey(projectId), serialized);

    return {
      success: true,
      sizeBytes: estimateStorageSizeBytes(serialized),
      envelope,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function loadProjectFromStorage(projectId: string): LoadedProject | null {
  const primary = localStorage.getItem(getProjectStorageKey(projectId));
  const backup = localStorage.getItem(getProjectBackupKey(projectId));

  if (primary) {
    const envelope = parseEnvelope(primary);
    if (envelope && isEnvelopeValid(envelope)) {
      return {
        payload: envelope.payload,
        source: 'primary',
        savedAt: envelope.savedAt,
        checksum: envelope.checksum,
      };
    }

    void trackTelemetry('localstorage_corrupt', {
      projectId,
      source: 'primary',
    });
  }

  if (backup) {
    const envelope = parseEnvelope(backup);
    if (envelope && isEnvelopeValid(envelope)) {
      try {
        localStorage.setItem('hvac-backup-recovered', 'true');
      } catch {
        // ignore
      }
      void trackTelemetry('localstorage_recovered', {
        projectId,
        source: 'backup',
      });
      return {
        payload: envelope.payload,
        source: 'backup',
        savedAt: envelope.savedAt,
        checksum: envelope.checksum,
      };
    }
  }

  void trackTelemetry('localstorage_recovery_failed', {
    projectId,
  });

  return null;
}

export function deleteProjectFromStorage(projectId: string): boolean {
  try {
    localStorage.removeItem(getProjectStorageKey(projectId));
    localStorage.removeItem(getProjectBackupKey(projectId));
    return true;
  } catch {
    return false;
  }
}

interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number;
  onSave?: (result: SaveResult) => void;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const { enabled = true, interval, onSave } = options;

  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const projectDetails = useProjectStore((state) => state.projectDetails);
  const storeIsDirty = useProjectStore((state) => state.isDirty);
  const { setDirty } = useProjectActions();
  const autoSaveInterval = usePreferencesStore((state) => state.autoSaveInterval);

  const [isDirty, setLocalDirty] = useState(storeIsDirty);
  const intervalTimer = useRef<NodeJS.Timeout | null>(null);

  const buildProjectFile = useCallback((): ProjectFile | null => {
    if (!currentProjectId || !projectDetails) {
      return null;
    }

    const entityStore = useEntityStore.getState();
    const viewportStore = useViewportStore.getState();
    const preferences = usePreferencesStore.getState();
    const historyStore = useHistoryStore.getState();

    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      projectId: currentProjectId,
      projectName: projectDetails.projectName,
      projectNumber: projectDetails.projectNumber || undefined,
      clientName: projectDetails.clientName || undefined,
      createdAt: projectDetails.createdAt,
      modifiedAt: new Date().toISOString(),
      entities: {
        byId: entityStore.byId,
        allIds: entityStore.allIds,
      },
      viewportState: {
        panX: viewportStore.panX,
        panY: viewportStore.panY,
        zoom: viewportStore.zoom,
      },
      settings: {
        unitSystem: preferences.unitSystem,
        gridSize: preferences.gridSize,
        gridVisible: viewportStore.gridVisible,
      },
      commandHistory: {
        commands: historyStore.past,
        currentIndex: Math.max(historyStore.past.length - 1, 0),
      },
      calculations: undefined,
      billOfMaterials: undefined,
    };
  }, [currentProjectId, projectDetails]);

  const buildPayload = useCallback((): LocalStoragePayload | null => {
    const project = buildProjectFile();
    if (!project) {
      return null;
    }

    const selectionState = useSelectionStore.getState();
    const viewportStore = useViewportStore.getState();
    const preferences = usePreferencesStore.getState();
    const settings = useSettingsStore.getState();
    const projectIndex = useProjectListStore.getState();
    const legacyProjects = useLegacyProjectStore.getState();
    const historyStore = useHistoryStore.getState();

    const appState = useAppStateStore.getState();
    const layoutState = useLayoutStore.getState();
    const legacyTool = useLegacyToolStore.getState();
    const legacyViewport = useLegacyViewportStore.getState();
    const tutorialState = useTutorialStore.getState();

    return {
      project,
      selection: {
        selectedIds: selectionState.selectedIds,
        hoveredId: selectionState.hoveredId,
      },
      viewport: {
        panX: viewportStore.panX,
        panY: viewportStore.panY,
        zoom: viewportStore.zoom,
        gridVisible: viewportStore.gridVisible,
        gridSize: viewportStore.gridSize,
        snapToGrid: viewportStore.snapToGrid,
      },
      preferences: {
        projectFolder: preferences.projectFolder,
        unitSystem: preferences.unitSystem,
        autoSaveInterval: preferences.autoSaveInterval,
        gridSize: preferences.gridSize,
        theme: preferences.theme,
      },
      settings: {
        autoOpenLastProject: settings.autoOpenLastProject,
      },
      projectIndex: {
        projects: projectIndex.projects as Array<Record<string, unknown>>,
        recentProjectIds: projectIndex.recentProjectIds,
        loading: projectIndex.loading,
        error: projectIndex.error,
      },
      legacyProjects: {
        projects: legacyProjects.projects as Array<Record<string, unknown>>,
      },
      history: {
        past: historyStore.past as Array<Record<string, unknown>>,
        future: historyStore.future as Array<Record<string, unknown>>,
        maxSize: historyStore.maxSize,
      },
      uiState: {
        app: {
          hasLaunched: appState.hasLaunched,
          isFirstLaunch: appState.isFirstLaunch,
          isLoading: appState.isLoading,
        },
        layout: {
          leftSidebarCollapsed: layoutState.leftSidebarCollapsed,
          rightSidebarCollapsed: layoutState.rightSidebarCollapsed,
          activeLeftTab: layoutState.activeLeftTab,
          activeRightTab: layoutState.activeRightTab,
        },
        tool: {
          activeTool: legacyTool.activeTool,
        },
        viewport: {
          zoom: legacyViewport.zoom,
          gridVisible: legacyViewport.gridVisible,
          panOffset: legacyViewport.panOffset,
          cursorPosition: legacyViewport.cursorPosition,
        },
        tutorial: {
          isActive: tutorialState.isActive,
          currentStep: tutorialState.currentStep,
          totalSteps: tutorialState.totalSteps,
          completedSteps: tutorialState.completedSteps,
          isCompleted: tutorialState.isCompleted,
        },
      },
    };
  }, [buildProjectFile]);

  const triggerCloudBackup = useCallback(async (envelope: LocalStorageEnvelope) => {
    const success = await sendCloudBackup({
      projectId: envelope.projectId,
      savedAt: envelope.savedAt,
      schemaVersion: envelope.schemaVersion,
      checksum: envelope.checksum,
      payload: envelope.payload,
    });

    void trackTelemetry(success ? 'cloud_backup_success' : 'cloud_backup_failure', {
      projectId: envelope.projectId,
      source: 'auto',
    });
  }, []);

  const saveWithBackup = useCallback(
    (source: SaveSource): SaveResult => {
      if (!currentProjectId) {
        return { success: false, source, error: 'Missing project id.' };
      }

      const payload = buildPayload();
      if (!payload) {
        return { success: false, source, error: 'Missing project payload.' };
      }

      const storageResult = saveProjectToStorage(currentProjectId, payload);
      if (!storageResult.success || !storageResult.envelope) {
        const error = storageResult.error ?? 'Unable to save to localStorage.';
        const result = { success: false, source, error };
        void trackTelemetry(`${source}_save_failure`, {
          projectId: currentProjectId,
          error,
        });
        onSave?.(result);
        return result;
      }

      const backupResult = saveBackupToStorage(currentProjectId, payload);
      if (backupResult.envelope) {
        void triggerCloudBackup(backupResult.envelope);
      }

      setLocalDirty(false);
      setDirty(false);

      const result = {
        success: true,
        source,
        sizeBytes: storageResult.sizeBytes,
      };

      void trackTelemetry(`${source}_save_success`, {
        projectId: currentProjectId,
        projectSizeBytes: storageResult.sizeBytes,
        source,
      });
      onSave?.(result);

      return result;
    },
    [currentProjectId, buildPayload, setDirty, triggerCloudBackup, onSave]
  );

  const saveNow = useCallback((): SaveResult => saveWithBackup('manual'), [saveWithBackup]);

  useEffect(() => {
    setLocalDirty(storeIsDirty);
  }, [storeIsDirty]);

  useEffect(() => {
    const entityUnsub = useEntityStore.subscribe(() => {
      setLocalDirty(true);
      setDirty(true);
    });

    const viewportUnsub = useViewportStore.subscribe(() => {
      setLocalDirty(true);
      setDirty(true);
    });

    const selectionUnsub = useSelectionStore.subscribe(() => {
      setLocalDirty(true);
      setDirty(true);
    });

    const historyUnsub = useHistoryStore.subscribe(() => {
      setLocalDirty(true);
      setDirty(true);
    });

    const preferencesUnsub = usePreferencesStore.subscribe(() => {
      setLocalDirty(true);
      setDirty(true);
    });

    return () => {
      entityUnsub();
      viewportUnsub();
      selectionUnsub();
      historyUnsub();
      preferencesUnsub();
    };
  }, [setDirty]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalMs = interval ?? autoSaveInterval ?? 300000;
    if (!intervalMs || intervalMs <= 0) {
      return;
    }

    intervalTimer.current = setInterval(() => {
      saveWithBackup('auto');
    }, intervalMs);

    return () => {
      if (intervalTimer.current) {
        clearInterval(intervalTimer.current);
        intervalTimer.current = null;
      }
    };
  }, [enabled, interval, autoSaveInterval, saveWithBackup]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (storeIsDirty) {
        saveWithBackup('auto');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [storeIsDirty, saveWithBackup]);

  return {
    save: saveNow,
    saveNow,
    isDirty,
  };
}
