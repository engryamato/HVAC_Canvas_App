'use client';

import { useEffect, useState } from 'react';
import { CanvasPage } from './CanvasPage';
import { useProjectStore as useSessionStore } from '@/core/store/project.store';
import { useProjectStore as usePersistenceStore } from '@/stores/useProjectStore';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { ErrorPage } from '@/components/error/ErrorPage';
import { VersionWarningDialog } from '@/components/dialogs/VersionWarningDialog';
import { MigrationWizard } from '@/components/dialogs/MigrationWizard';
import { VersionDetector } from '@/core/services/migration/VersionDetector';
import { type ProjectFile } from '@/core/schema/project-file.schema';
import { useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';
import {
  createLocalStoragePayloadFromProjectFileWithDefaults,
  loadProjectFromStorage,
  saveProjectToStorage,
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
  const [shouldLoadProject, setShouldLoadProject] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [migrationData, setMigrationData] = useState<ProjectFile | null>(null);

  const hydrateProject = (project: ProjectFile, storedPayload?: LocalStoragePayload) => {
    try {
      hydrateToStores(storedPayload ?? project);
    } catch (error) {
      logger.error('[CanvasPageWrapper] Failed to hydrate project data', error);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    initializeComponentLibraryV2();
  }, []);

  // Set project ID in store when route loads
  useEffect(() => {
    try {
      // Handle tutorial projects specially - they don't exist in storage
      // but we need to allow the tutorial flow to proceed
      if (projectId.startsWith('tutorial-')) {
        // Create a temporary tutorial project with minimal data
        const tutorialProject = {
          id: projectId,
          name: 'Tutorial Project',
          projectNumber: '',
          clientName: '',
          location: '',
          scope: { details: [], materials: [], projectType: 'Residential' },
          siteConditions: { elevation: '', outdoorTemp: '', indoorTemp: '', windSpeed: '', humidity: '', localCodes: '' },
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        };
        loadProject(tutorialProject);
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

            const detectedVersion = VersionDetector.detectVersion(result.project);
            if (VersionDetector.needsMigration(detectedVersion)) {
              setNeedsMigration(true);
              setMigrationData(result.project as ProjectFile);
              return;
            }

            // Check version compatibility
            const proj = result.project as any; // Type assertion for dynamic import
            const projVersion = (proj as any).schemaVersion ?? proj.version ?? '1.0.0';
            logger.debug(`[CanvasPageWrapper] Project: ${proj.projectName}, Version: ${projVersion}, App Version: ${APP_VERSION}`);

            if (compareVersions(projVersion, APP_VERSION) > 0) {
              logger.debug('[CanvasPageWrapper] Version mismatch detected');
              setProjectVersion(projVersion);
              setVersionWarning(true);
              return;
            }

            hydrateProject(result.project);
            if (result.loadedFromBackup) {
              addToast({
                title: 'Project recovered from backup',
                type: 'warning',
              });
              localStorage.removeItem('hvac-backup-recovered');
            }

            // Convert ProjectFile to the format expected by loadProject
            const projectData = {
              id: proj.projectId,
              name: proj.projectName,
              projectNumber: proj.projectNumber ?? '',
              clientName: proj.clientName ?? '',
              location: proj.location ?? '',
              scope: proj.scope ?? { details: [], materials: [], projectType: 'Commercial' },
              siteConditions: proj.siteConditions ?? {
                elevation: '0',
                outdoorTemp: '70',
                indoorTemp: '70',
                windSpeed: '0',
                humidity: '50',
                localCodes: ''
              },
              createdAt: proj.createdAt,
              modifiedAt: proj.modifiedAt,
            };

            loadProject(projectData);
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

      const loadedProjectData = storedPayload?.project;
      if (loadedProjectData) {
        const detectedVersion = VersionDetector.detectVersion(loadedProjectData);
        if (VersionDetector.needsMigration(detectedVersion)) {
          setNeedsMigration(true);
          setMigrationData(loadedProjectData as ProjectFile);
          return;
        }
      }

      if (storedPayload) {
        hydrateProject(storedPayload.project, storedPayload);
        if (storedProject?.source === 'backup') {
          addToast({
            title: 'Project recovered from backup',
            type: 'warning',
          });
          localStorage.removeItem('hvac-backup-recovered');
        }
      }

      // Check version compatibility
      const projVersion = storedPayload?.project?.schemaVersion ?? (persistedProject as any)?.version ?? '1.0.0';
      logger.debug(`[CanvasPageWrapper] Project: ${projectName}, Version: ${projVersion}, App Version: ${APP_VERSION}`);

      if (compareVersions(projVersion, APP_VERSION) > 0) {
        logger.debug('[CanvasPageWrapper] Version mismatch detected');
        setProjectVersion(projVersion);
        setVersionWarning(true);
        return; // Wait for user decision
      }

      // Load project
      loadProject(persistedProject, storedPayload);
    } catch (error) {
      console.error('Failed to load project:', error);
      setProjectError('Unable to load project. The file may be corrupted or there was a storage error.');
    }

    // Clear project when navigating away
    return () => {
      clearProject();
    };
  }, [projectId, setProject, clearProject, getProject]);

  // Load project after version warning acceptance
  useEffect(() => {
    if (shouldLoadProject) {
      try {
        const storedProject = loadProjectFromStorage(projectId);
        const persistedProject = getProject(projectId);
        if (storedProject?.payload) {
          hydrateProject(storedProject.payload.project, storedProject.payload);
          if (storedProject.source === 'backup') {
            addToast({
              title: 'Project recovered from backup',
              type: 'warning',
            });
            localStorage.removeItem('hvac-backup-recovered');
          }
        }
        if (persistedProject || storedProject?.payload) {
          loadProject(persistedProject, storedProject?.payload);
        }
      } catch (error) {
        setProjectError('Unable to load project.');
      }
      setShouldLoadProject(false);
    }
  }, [shouldLoadProject, projectId, getProject, addToast]);

  function loadProject(persistedProject: any, storedPayload?: LocalStoragePayload) {
    const storedProject = storedPayload?.project;
    const resolvedProjectId = storedProject?.projectId ?? persistedProject?.id ?? projectId;

    setProject(projectId, {
      projectId: resolvedProjectId,
      projectName: storedProject?.projectName ?? persistedProject?.name ?? 'Untitled Project',
      projectNumber: storedProject?.projectNumber ?? (persistedProject?.projectNumber || undefined),
      clientName: storedProject?.clientName ?? (persistedProject?.clientName || undefined),
      location: persistedProject?.location || undefined,
      scope: persistedProject?.scope,
      siteConditions: persistedProject?.siteConditions,
      isArchived: storedProject?.isArchived ?? persistedProject?.isArchived ?? false,
      createdAt: storedProject?.createdAt ?? persistedProject?.createdAt ?? new Date().toISOString(),
      modifiedAt: storedProject?.modifiedAt ?? persistedProject?.modifiedAt ?? new Date().toISOString(),
    });

    // Track as last active project for auto-open feature
    localStorage.setItem('lastActiveProjectId', projectId);

    if (storedPayload) {
      useProjectListStore.getState().addProject({
        projectId: resolvedProjectId,
        projectName: storedProject?.projectName ?? persistedProject?.name ?? 'Untitled Project',
        projectNumber: storedProject?.projectNumber ?? persistedProject?.projectNumber,
        clientName: storedProject?.clientName ?? persistedProject?.clientName,
        createdAt: storedProject?.createdAt ?? new Date().toISOString(),
        modifiedAt: storedProject?.modifiedAt ?? new Date().toISOString(),
        storagePath: `project-${resolvedProjectId}`,
        isArchived: false,
      });
    }
  }

  // Show error page (404)
  if (projectError) {
    return (
      <ErrorPage
        title="Project Not Found"
        message={projectError}
      />
    );
  }

  if (needsMigration && migrationData) {
    return (
      <MigrationWizard
        isOpen={true}
        onClose={() => {
          setNeedsMigration(false);
          router.push('/dashboard');
        }}
        data={migrationData}
        onMigrationComplete={(migratedData: any) => {
          if (migratedData) {
            const payload = createLocalStoragePayloadFromProjectFileWithDefaults(migratedData);
            saveProjectToStorage(migratedData.projectId, payload);
            hydrateProject(payload.project, payload);

            setProject(migratedData.projectId, {
              projectId: migratedData.projectId,
              projectName: payload.project.projectName,
              projectNumber: payload.project.projectNumber,
              clientName: payload.project.clientName,
              isArchived: payload.project.isArchived,
              createdAt: payload.project.createdAt,
              modifiedAt: payload.project.modifiedAt,
            });

            localStorage.setItem('lastActiveProjectId', migratedData.projectId);

            useProjectListStore.getState().addProject({
              projectId: migratedData.projectId,
              projectName: payload.project.projectName,
              projectNumber: payload.project.projectNumber,
              clientName: payload.project.clientName,
              createdAt: payload.project.createdAt,
              modifiedAt: payload.project.modifiedAt,
              storagePath: `project-${migratedData.projectId}`,
              isArchived: false,
            });
          }

          setNeedsMigration(false);
        }}
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
          setShouldLoadProject(true);
        }}
        onCancel={() => router.push('/dashboard')}
      />
    );
  }

  return <CanvasPage />;
}

export default CanvasPageWrapper;
