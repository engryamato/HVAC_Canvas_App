'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CanvasContainer } from './components/CanvasContainer';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { ZoomControls } from './components/ZoomControls';
import styles from './CanvasPage.module.css';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { createEmptyProjectFile } from '@/core/schema';
import { useCurrentProjectId, useProjectDetails } from '@/core/store/project.store';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { ExportMenu } from '@/features/export/ExportMenu';
import { redo, undo, useCanRedo, useCanUndo } from '@/core/commands';

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
  const projectId = useCurrentProjectId();
  const projectDetails = useProjectDetails();
  const projectFolder = usePreferencesStore((state) => state.projectFolder);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const projectFile = useMemo(() => {
    if (!projectId) return null;
    return createEmptyProjectFile(projectId, projectDetails?.projectName ?? projectId);
  }, [projectDetails?.projectName, projectId]);

  const projectPath = projectId ? `${projectFolder}/${projectId}.sws` : null;

  const { status: saveStatus, lastSavedAt, triggerSave } = useAutoSave(projectFile, projectPath);

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
          <span>{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Idle'}</span>
          {lastSavedAt && <span className={styles.saveTime}>{lastSavedAt.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
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

        {/* Right Inspector Panel - Placeholder for Phase 4 */}
        {/* <InspectorPanel className="flex-shrink-0 w-80" /> */}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar mousePosition={mousePosition} />
    </div>
  );
}

export default CanvasPage;
