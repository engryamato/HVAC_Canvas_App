'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { CanvasContainer } from './components/CanvasContainer';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { ZoomControls } from './components/ZoomControls';
import { ExportMenu } from './components/ExportMenu';
import { useCalculations, useAutoSave } from './hooks';
import { useUndoRedo } from './hooks/useUndoRedo';

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
  // Keep calculated values in sync with entity props
  useCalculations('commercial');
  // Register undo/redo keyboard shortcuts
  useUndoRedo();
  // Enable auto-save
  const { isDirty } = useAutoSave({ enabled: true });

  const handleMouseMove = useCallback((canvasX: number, canvasY: number) => {
    setMousePosition({ x: canvasX, y: canvasY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

  return (
    <div className={`flex flex-col h-screen bg-gray-100 ${className}`}>
      {/* Header with navigation */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Canvas Editor</h2>
          {isDirty && <span className={styles.dirtyIndicator}>Unsaved changes</span>}
        </div>
        <div className={styles.headerActions}>
          <ExportMenu />
          <Link href="/dashboard" className={styles.backButton}>
            Back to Dashboard
          </Link>
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

        {/* Right Inspector Panel */}
        <InspectorPanel className={styles.inspector} />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar mousePosition={mousePosition} />
    </div>
  );
}

export default CanvasPage;
