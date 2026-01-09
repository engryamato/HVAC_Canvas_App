'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { CanvasContainer } from './components/CanvasContainer';
import { Toolbar } from './components/Toolbar';
import { ProjectSidebar } from './components/ProjectSidebar';
import { StatusBar } from './components/StatusBar';
import { ZoomControls } from './components/ZoomControls';
import InspectorPanel from './components/Inspector/InspectorPanel';
import { ExportMenu } from '@/features/export/ExportMenu';
import { useAutoSave, useKeyboardShortcuts } from './hooks';
import styles from './CanvasPage.module.css';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { redo, undo, useCanRedo, useCanUndo } from '@/core/commands';
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';

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
  // Track mouse position for status bar
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Note: Project data is now managed internally by stores via CanvasPageWrapper and useAutoSave

  // Ensure preferences are loaded
  usePreferencesStore((state) => state.projectFolder); // Keep subscription active if needed

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // useAutoSave now manages state internally via store
  const { save, isDirty } = useAutoSave();
  const triggerSave = save;

  // Placeholder for status - useAutoSave currently doesn't expose these
  const saveStatus = isDirty ? 'unsaved' : 'saved';

  const handleMouseMove = useCallback((canvasX: number, canvasY: number) => {
    setMousePosition({ x: canvasX, y: canvasY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

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

  useKeyboardShortcuts({
    onSave: () => {
      void triggerSave();
    },
  });

  return (
    <div className={`flex flex-col h-screen bg-gray-100 ${className}`}>
      {/* Header with navigation */}
      <div className={styles.header}>
        <h2 className={styles.title}>Canvas Editor</h2>
        <Link href="/dashboard" className={styles.backButton}>
          Back to Dashboard
        </Link>
        <div className={styles.historyControls}>
          <button type="button" className={styles.historyButton} onClick={() => undo()} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className={styles.historyButton} onClick={() => redo()} disabled={!canRedo}>
            Redo
          </button>
        </div>
        <ExportMenu />
        <div className={styles.saveStatus}>
          <span>{saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}</span>
          {/* {lastSavedAt && <span className={styles.saveTime}>{lastSavedAt.toLocaleTimeString()}</span>} */}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project Sidebar - Leftmost */}
        <ProjectSidebar className="flex-shrink-0" />

        {/* Left Toolbar */}
        <Toolbar className="flex-shrink-0" />

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas Container */}
          <CanvasContainer
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {/* Zoom Controls - positioned bottom-right */}
          <div className="absolute bottom-8 right-4 z-10">
            <ZoomControls />
          </div>
        </div>

        {/* Right Inspector Panel */}
        <InspectorPanel className={styles.inspector} />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar mousePosition={mousePosition} />

      {/* Tutorial Overlay - renders when tutorial is active */}
      <TutorialOverlay />
    </div>
  );
}

export default CanvasPage;
