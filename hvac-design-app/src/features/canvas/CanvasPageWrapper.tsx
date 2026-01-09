'use client';

import { useEffect } from 'react';
import { CanvasPage } from './CanvasPage';
import { useProjectStore as useSessionStore } from '@/core/store/project.store';
import { useProjectStore as usePersistenceStore } from '@/stores/useProjectStore';

interface CanvasPageWrapperProps {
  projectId: string;
}

/**
 * Client-side wrapper for CanvasPage that handles project state setup.
 * This is a client component that receives projectId from the server component page.
 */
export function CanvasPageWrapper({ projectId }: CanvasPageWrapperProps) {
  const { setProject, clearProject } = useSessionStore();
  const { getProject } = usePersistenceStore();

  // Set project ID in store when route loads
  useEffect(() => {
    const persistedProject = getProject(projectId);

    if (persistedProject) {
      setProject(projectId, {
        projectId: persistedProject.id,
        projectName: persistedProject.name,
        projectNumber: persistedProject.projectNumber || undefined,
        clientName: persistedProject.clientName || undefined,
        scope: persistedProject.scope,
        siteConditions: persistedProject.siteConditions,
        createdAt: persistedProject.createdAt,
        modifiedAt: persistedProject.modifiedAt,
      });
    } else {
      // Fallback or error handling
      // For now, keep the minimal fallback for robustness if ID not found (e.g. direct URL access with bad ID)
      const now = new Date().toISOString();
      setProject(projectId, {
        projectId: projectId,
        projectName: 'Untitled Project', // Changed from projectId to generic
        createdAt: now,
        modifiedAt: now,
      });
    }

    // Clear project when navigating away
    return () => {
      clearProject();
    };
  }, [projectId, setProject, clearProject, getProject]);

  return <CanvasPage />;
}

export default CanvasPageWrapper;
