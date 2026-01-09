'use client';

import { useEffect, useState } from 'react';
import { CanvasPage } from './CanvasPage';
import { useProjectStore as useSessionStore } from '@/core/store/project.store';
import { useProjectStore as usePersistenceStore } from '@/stores/useProjectStore';
import { ErrorDialog } from '@/components/dialogs/ErrorDialog';
import { VersionWarningDialog } from '@/components/dialogs/VersionWarningDialog';
import { useRouter } from 'next/navigation';

interface CanvasPageWrapperProps {
  projectId: string;
}

const APP_VERSION = '1.0.0'; // Application version

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
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
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

  const [projectError, setProjectError] = useState<string | null>(null);
  const [versionWarning, setVersionWarning] = useState(false);
  const [projectVersion, setProjectVersion] = useState<string>('');
  const [shouldLoadProject, setShouldLoadProject] = useState(false);

  // Set project ID in store when route loads
  useEffect(() => {
    try {
      const persistedProject = getProject(projectId);

      if (!persistedProject) {
        setProjectError('Project not found. The project may have been deleted or corrupted.');
        return;
      }

      // Validate required fields
      if (!persistedProject.id || !persistedProject.name) {
        setProjectError('Project data is corrupted or invalid. Required fields are missing.');
        return;
      }

      // Check version compatibility
      const projVersion = (persistedProject as any).version || '1.0.0';
      if (compareVersions(projVersion, APP_VERSION) > 0) {
        setProjectVersion(projVersion);
        setVersionWarning(true);
        return; // Wait for user decision
      }

      // Load project
      loadProject(persistedProject);
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
        const persistedProject = getProject(projectId);
        if (persistedProject) {
          loadProject(persistedProject);
        }
      } catch (error) {
        setProjectError('Unable to load project.');
      }
      setShouldLoadProject(false);
    }
  }, [shouldLoadProject, projectId, getProject]);

  function loadProject(persistedProject: any) {
    setProject(projectId, {
      projectId: persistedProject.id,
      projectName: persistedProject.name,
      projectNumber: persistedProject.projectNumber || undefined,
      clientName: persistedProject.clientName || undefined,
      location: persistedProject.location || undefined,
      scope: persistedProject.scope,
      siteConditions: persistedProject.siteConditions,
      createdAt: persistedProject.createdAt,
      modifiedAt: persistedProject.modifiedAt,
    });

    // Track as last active project for auto-open feature
    localStorage.setItem('lastActiveProjectId', projectId);
  }

  // Show error dialog
  if (projectError) {
    return (
      <ErrorDialog
        message={projectError}
        onClose={() => router.push('/dashboard')}
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
