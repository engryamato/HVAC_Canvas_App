'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { CanvasContainer } from './components/CanvasContainer';
import { ZoomControls } from './components/ZoomControls';
import { Minimap } from './components/Minimap';

import { useAutoSave } from './hooks';
import styles from './CanvasPage.module.css';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectStore } from '@/core/store/project.store';
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';
import { AppShell } from '@/components/layout/AppShell';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ToastContainer, type ToastProps } from '@/components/ui/Toast';
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
  // Ensure preferences are loaded
  usePreferencesStore((state) => state.projectFolder);
  const currentProjectId = useProjectStore((state) => state.currentProjectId);

  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message: string, type: ToastProps['type']) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // useAutoSave now manages state internally via store
  const { saveNow } = useAutoSave({
    onSave: (result) => {
      const message = result.success
        ? result.source === 'auto'
          ? 'Auto-saved'
          : 'Saved locally'
        : result.source === 'auto'
          ? 'Auto-save failed'
          : 'Save failed';
      pushToast(message, result.success ? 'success' : 'error');
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Only check for recovery after we have a project ID (meaning load attempted)
    if (currentProjectId) {
      const recovered = localStorage.getItem('hvac-backup-recovered');
      if (recovered) {
        pushToast('Backup loaded', 'warning');
        localStorage.removeItem('hvac-backup-recovered');
      }
    }
  }, [pushToast, currentProjectId]);

  const triggerSave = saveNow;

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
    onZoomToSelection: (result) => {
      if (!result.success && result.message) {
        pushToast(result.message, 'warning');
      }
    },
  });


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
      <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-3 items-end">
        <Minimap />
        <ZoomControls />
      </div>


      <TutorialOverlay />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}

export default CanvasPage;
