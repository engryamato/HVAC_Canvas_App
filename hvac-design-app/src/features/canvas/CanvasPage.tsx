'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { CanvasContainer } from './components/CanvasContainer';
import { ZoomControls } from './components/ZoomControls';
import { useAutoSave } from './hooks';
import styles from './CanvasPage.module.css';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';
import { AppShell } from '@/components/layout/AppShell';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
// Legacy components removed: Toolbar, ProjectSidebar, StatusBar, InspectorPanel

/**
 * CanvasPage - Main canvas page with all components
 *
 * Layout:
 * - Header with navigation
 * - Toolbar on left
 * - Canvas in center (fills remaining space)
 * - Inspector panel on right (Phase 4)
 * - Status bar at bottom
 * - Zoom controls bottom-right
 */

interface CanvasPageProps {
  className?: string;
}

export function CanvasPage({ className = '' }: CanvasPageProps): React.ReactElement {
  // Track mouse position handled by viewport store or internal canvas logic
  // AppShell now handles the framing

  // Note: Project data is now managed internally by stores via CanvasPageWrapper and useAutoSave

  // Ensure preferences are loaded
  usePreferencesStore((state) => state.projectFolder);

  // useAutoSave now manages state internally via store
  const { save, isDirty } = useAutoSave();
  const triggerSave = save;

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void triggerSave();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [triggerSave]);

  useKeyboardShortcuts();

  // Temporary simplified project name retrieval for AppShell header
  // Ideally this comes from the project store
  // const { projectDetails } = useProjectStore(); 
  const projectName = "Proposed Layout"; // Placeholder or from store

  return (
    <AppShell projectName={projectName}>
      <CanvasContainer
        className="w-full h-full"
      // Mouse handling moved to global standard or handled within CanvasContainer
      // If StatusBar needs it, StatusBar should subscribe to viewport store
      />

      {/* Zoom Controls - positioned absolute or managed by AppShell/Viewport */}
      <div className="absolute bottom-8 right-4 z-10">
        <ZoomControls />
      </div>

      <TutorialOverlay />
    </AppShell>
  );
}

export default CanvasPage;
