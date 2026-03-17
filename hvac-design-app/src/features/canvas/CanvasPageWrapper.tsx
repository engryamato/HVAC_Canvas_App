'use client';

import { useEffect, useState } from 'react';
import { CanvasPage } from './CanvasPage';
import { useProjectStore as useSessionStore } from '@/core/store/project.store';
import { useProjectStore as usePersistenceStore } from '@/stores/useProjectStore';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { ErrorPage } from '@/components/error/ErrorPage';
import { VersionWarningDialog } from '@/components/dialogs/VersionWarningDialog';
import { CURRENT_SCHEMA_VERSION, type ProjectFile } from '@/core/schema/project-file.schema';
import { useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';
import {
  loadProjectFromStorage,
  type LocalStoragePayload,
} from './hooks/useAutoSave';
import { useAppStateStore } from '@/stores/useAppStateStore';
import initializeComponentLibraryV2 from '@/core/store/componentLibraryInitializer';
import { hydrateToStores } from '@/core/persistence/ProjectStateOrchestrator';
import { useToast } from '@/components/ui/ToastContext';

interface CanvasPageWrapperProps {
  projectId: string;
}

const APP_VERSION = '2.0.0'; // Application version

/**
 * Compare two semver version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) { return 1; }
    if (p1 < p2) { return -1; }
  }
  return 0;
}

/**
 * Client-side wrapper for CanvasPage that handles project state setup.
 * This is a client component that receives projectId from the server component page.
 */
export function CanvasPageWrapper({ projectId }: CanvasPageWrapperProps) {
  const router = useRouter();
  const { setProject, clearProject } = useSessionStore();
  const { getProject } = usePersistenceStore();
  const { addToast } = useToast();

  const [projectError, setProjectError] = useState<string | null>(null);
  const [versionWarning, setVersionWarning] = useState(false);
  const [projectVersion, setProjectVersion] = useState<string>('');
  const [pendingLoad, setPendingLoad] = useState<{
    project: ProjectFile;
    payload?: LocalStoragePayload;
    storagePath?: string;
    loadedFromBackup?: boolean;
    originalVersion?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    initializeComponentLibraryV2();
  }, []);

  // Set project ID in store when route loads
  useEffect(() => {
    const projectListStore = useProjectListStore.getState();

    const upsertProjectListEntry = (project: ProjectFile, storagePath?: string) => {
      const existing = projectListStore.projects.find((item) => item.projectId === project.projectId);
      const projectListItem = {
        projectId: project.projectId,
        projectName: project.projectName,
        projectNumber: project.projectNumber,
        clientName: project.clientName,
        createdAt: project.createdAt,
        modifiedAt: project.modifiedAt,
        storagePath: storagePath ?? `project-${project.projectId}`,
        filePath: storagePath,
        isArchived: project.isArchived,
      };

      if (existing) {
        projectListStore.updateProject(project.projectId, projectListItem);
        return;
      }

      projectListStore.addProject(projectListItem);
    };

    const surfaceLoadSignals = (options: { loadedFromBackup?: boolean; originalVersion?: string } = {}) => {
      if (options.loadedFromBackup) {
        addToast({
          title: 'Backup Recovered',
          message: 'Backup loaded. Your project was recovered from a backup copy.',
          type: 'warning',
        });
      }

      if (options.originalVersion && options.originalVersion !== CURRENT_SCHEMA_VERSION) {
        addToast({
          title: 'Project Upgraded',
          message: `Loaded project from schema ${options.originalVersion}.`,
          type: 'info',
        });
      }
    };

    const applyLoadedProject = (project: ProjectFile, payload?: LocalStoragePayload, options: {
      storagePath?: string;
      loadedFromBackup?: boolean;
      originalVersion?: string;
    } = {}) => {
      hydrateToStores(project, payload ? { payload } : undefined);
      upsertProjectListEntry(project, options.storagePath);
      surfaceLoadSignals(options);
    };

    try {
      // Handle tutorial projects specially - they don't exist in storage
      // but we need to allow the tutorial flow to proceed
      if (projectId.startsWith('tutorial-')) {
        // Create a temporary tutorial project with minimal data
        const tutorialProject = {
          projectId,
          projectName: 'Tutorial Project',
          projectNumber: '',
          clientName: '',
          location: '',
          scope: { details: [], materials: [], projectType: 'Residential' },
          siteConditions: { elevation: '', outdoorTemp: '', indoorTemp: '', windSpeed: '', humidity: '', localCodes: '' },
          isArchived: false,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        };
        setProject(projectId, tutorialProject);
        return;
      }

      // Check if we're in Tauri mode and have a file path
      const isTauri = useAppStateStore.getState().isTauri;
      const projectListItem = useProjectListStore.getState().projects.find(p => p.projectId === projectId);

      if (isTauri && projectListItem?.filePath) {
        // Load from .sws file
        void (async () => {
          try {
            const { loadProject: loadProjectFromFile } = await import('@/core/persistence/projectIO');
            const result = await loadProjectFromFile(projectListItem.filePath!);

            if (!result.success || !result.project) {
              setProjectError(`Failed to load project file: ${result.error || 'Unknown error'}`);
              return;
            }

            // Check version compatibility
            const proj = result.project as any; // Type assertion for dynamic import
            const projVersion = (proj as any).schemaVersion ?? proj.version ?? '1.0.0';
            logger.debug(`[CanvasPageWrapper] Project: ${proj.projectName}, Version: ${projVersion}, App Version: ${APP_VERSION}`);

            if (compareVersions(projVersion, APP_VERSION) > 0) {
              logger.debug('[CanvasPageWrapper] Version mismatch detected');
              setProjectVersion(projVersion);
              setPendingLoad({
                project: result.project,
                storagePath: projectListItem.filePath,
                loadedFromBackup: result.loadedFromBackup,
                originalVersion: result.originalVersion,
              });
              setVersionWarning(true);
              return;
            }

            applyLoadedProject(result.project, undefined, {
              storagePath: projectListItem.filePath,
              loadedFromBackup: result.loadedFromBackup,
              originalVersion: result.originalVersion,
            });
          } catch (error) {
            logger.error('[CanvasPageWrapper] Failed to load from file:', error);
            setProjectError('Unable to load project file. The file may be corrupted or inaccessible.');
          }
        })();
        return;
      }

      const storedProject = loadProjectFromStorage(projectId);
      const storedPayload = storedProject?.payload;
      const persistedProject = getProject(projectId);

      if (!persistedProject && !storedPayload) {
        setProjectError('Project not found. The project may have been deleted or corrupted.');
        return;
      }

      const projectName = storedPayload?.project?.projectName ?? persistedProject?.name;
      if (!projectName) {
        setProjectError('Project data is corrupted or invalid. Required fields are missing.');
        return;
      }

      // Check version compatibility
      const projVersion = storedPayload?.project?.schemaVersion ?? (persistedProject as any)?.version ?? '1.0.0';
      logger.debug(`[CanvasPageWrapper] Project: ${projectName}, Version: ${projVersion}, App Version: ${APP_VERSION}`);

      if (compareVersions(projVersion, APP_VERSION) > 0) {
        logger.debug('[CanvasPageWrapper] Version mismatch detected');
        setProjectVersion(projVersion);
        if (storedPayload?.project) {
          // Primary path: full project file present in localStorage payload.
          setPendingLoad({
            project: storedPayload.project,
            payload: storedPayload,
            originalVersion: storedPayload.project.schemaVersion,
          });
        } else {
          // Legacy-only path: no storedPayload.project, but persistedProject
          // metadata exists. Synthesize a minimal ProjectFile so that
          // onContinue can still hydrate the canvas (via setProject) rather
          // than silently no-oping.
          const syntheticProject: ProjectFile = {
            projectId,
            schemaVersion: projVersion,
            projectName: persistedProject?.name ?? 'Untitled Project',
            projectNumber: persistedProject?.projectNumber || undefined,
            clientName: persistedProject?.clientName || undefined,
            location: persistedProject?.location || undefined,
            scope: persistedProject?.scope,
            siteConditions: persistedProject?.siteConditions,
            isArchived: persistedProject?.isArchived ?? false,
            createdAt: persistedProject?.createdAt ?? new Date().toISOString(),
            modifiedAt: persistedProject?.modifiedAt ?? new Date().toISOString(),
          } as unknown as ProjectFile;
          setPendingLoad({
            project: syntheticProject,
            originalVersion: projVersion,
          });
        }
        setVersionWarning(true);
        return; // Wait for user decision
      }

      if (storedPayload?.project) {
        applyLoadedProject(storedPayload.project, storedPayload, {
          loadedFromBackup: storedProject?.source === 'backup',
          originalVersion: storedPayload.project.schemaVersion,
        });
        return;
      }

      setProject(projectId, {
        projectId,
        projectName: persistedProject?.name ?? 'Untitled Project',
        projectNumber: persistedProject?.projectNumber || undefined,
        clientName: persistedProject?.clientName || undefined,
        location: persistedProject?.location || undefined,
        scope: persistedProject?.scope,
        siteConditions: persistedProject?.siteConditions,
        isArchived: persistedProject?.isArchived ?? false,
        createdAt: persistedProject?.createdAt ?? new Date().toISOString(),
        modifiedAt: persistedProject?.modifiedAt ?? new Date().toISOString(),
      });
      localStorage.setItem('lastActiveProjectId', projectId);
    } catch (error) {
      console.error('Failed to load project:', error);
      setProjectError('Unable to load project. The file may be corrupted or there was a storage error.');
    }

    // Clear project when navigating away
    return () => {
      clearProject();
    };
  }, [addToast, clearProject, getProject, projectId, setProject]);

  // Show error page (404)
  if (projectError) {
    return (
      <ErrorPage
        title="Project Not Found"
        message={projectError}
      />
    );
  }

  // Show version warning dialog
  if (versionWarning) {
    return (
      <VersionWarningDialog
        projectVersion={projectVersion}
        appVersion={APP_VERSION}
        onContinue={() => {
          setVersionWarning(false);
          if (pendingLoad) {
            hydrateToStores(pendingLoad.project, pendingLoad.payload ? { payload: pendingLoad.payload } : undefined);
            const projectListStore = useProjectListStore.getState();
            const existing = projectListStore.projects.find((item) => item.projectId === pendingLoad.project.projectId);
            const projectListItem = {
              projectId: pendingLoad.project.projectId,
              projectName: pendingLoad.project.projectName,
              projectNumber: pendingLoad.project.projectNumber,
              clientName: pendingLoad.project.clientName,
              createdAt: pendingLoad.project.createdAt,
              modifiedAt: pendingLoad.project.modifiedAt,
              storagePath: pendingLoad.storagePath ?? `project-${pendingLoad.project.projectId}`,
              filePath: pendingLoad.storagePath,
              isArchived: pendingLoad.project.isArchived,
            };
            if (existing) {
              projectListStore.updateProject(pendingLoad.project.projectId, projectListItem);
            } else {
              projectListStore.addProject(projectListItem);
            }
            if (pendingLoad.loadedFromBackup) {
              addToast({
                title: 'Backup Recovered',
                message: 'Backup loaded. Your project was recovered from a backup copy.',
                type: 'warning',
              });
            }
            if (pendingLoad.originalVersion && pendingLoad.originalVersion !== CURRENT_SCHEMA_VERSION) {
              addToast({
                title: 'Project Upgraded',
                message: `Loaded project from schema ${pendingLoad.originalVersion}.`,
                type: 'info',
              });
            }
            setPendingLoad(null);
          }
        }}
        onCancel={() => router.push('/dashboard')}
      />
    );
  }

  return <CanvasPage />;
}

export default CanvasPageWrapper;
