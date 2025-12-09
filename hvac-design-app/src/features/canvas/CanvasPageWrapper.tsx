'use client';

import { useEffect } from 'react';
import { CanvasPage } from './CanvasPage';
import { useProjectStore } from '@/core/store/project.store';

interface CanvasPageWrapperProps {
  projectId: string;
}

/**
 * Client-side wrapper for CanvasPage that handles project state setup.
 * This is a client component that receives projectId from the server component page.
 */
export function CanvasPageWrapper({ projectId }: CanvasPageWrapperProps) {
  const { setProject, clearProject } = useProjectStore();

  // Set project ID in store when route loads
  useEffect(() => {
    // For now, set a minimal project with the route param as both ID and name
    // Phase 6 will implement full project loading from filesystem with UUID lookup
    const now = new Date().toISOString();
    setProject(projectId, {
      projectId: projectId,
      projectName: projectId,
      createdAt: now,
      modifiedAt: now,
    });

    // Clear project when navigating away
    return () => {
      clearProject();
    };
  }, [projectId, setProject, clearProject]);

  return <CanvasPage />;
}

export default CanvasPageWrapper;
