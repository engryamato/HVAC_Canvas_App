'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { CanvasContainer } from './components/CanvasContainer';
import { ZoomControls } from './components/ZoomControls';
import { Minimap } from './components/Minimap';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { useViewportStore } from './store/viewportStore';

import { useAutoSave } from './hooks';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectDetails, useProjectStore } from '@/core/store/project.store';
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';
import { AppShell } from '@/components/layout/AppShell';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ToastContainer, type ToastProps } from '@/components/ui/Toast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

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

  usePreferencesStore((state) => state.projectFolder);
  const snapToGridPreference = usePreferencesStore((state) => state.snapToGrid);
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const projectDetails = useProjectDetails();

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

  // Check for backup recovery flag with polling for cross-browser stability
  // The flag may be set slightly after component mount in some browsers
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Only check for recovery after we have a project ID (meaning load attempted)
    if (!currentProjectId) {
      return;
    }

    // Polling mechanism: check multiple times over 3 seconds to handle timing differences
    let attempts = 0;
    const maxAttempts = 15; // 15 * 200ms = 3 seconds max
    const checkInterval = 200;

    const checkForRecovery = () => {
      const recovered = localStorage.getItem('hvac-backup-recovered');
      if (recovered) {
        console.log('[CanvasPage] Backup recovery flag detected, showing toast');
        pushToast('Backup loaded - your data was recovered from a backup', 'warning');
        localStorage.removeItem('hvac-backup-recovered');
        return true;
      }
      return false;
    };

    // Initial immediate check
    if (checkForRecovery()) {
      return;
    }

    // Set up polling for cases where flag is set after mount
    const pollTimer = setInterval(() => {
      attempts++;
      if (checkForRecovery() || attempts >= maxAttempts) {
        clearInterval(pollTimer);
      }
    }, checkInterval);

    return () => clearInterval(pollTimer);
  }, [pushToast, currentProjectId]);

  const triggerSave = saveNow;

  useEffect(() => {
    useViewportStore.setState({ snapToGrid: snapToGridPreference });
  }, [snapToGridPreference]);

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

  useEffect(() => {
    const handleSaveRequest = () => {
      void triggerSave();
    };

    window.addEventListener('sws:canvas-save', handleSaveRequest);
    return () => window.removeEventListener('sws:canvas-save', handleSaveRequest);
  }, [triggerSave]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleToastRequest = (event: Event) => {
      const toastEvent = event as CustomEvent<{ message?: string; type?: ToastProps['type'] }>;
      const message = toastEvent.detail?.message;
      const type = toastEvent.detail?.type;

      if (!message || !type) {
        return;
      }

      pushToast(message, type);
    };

    window.addEventListener('sws:toast', handleToastRequest);
    return () => window.removeEventListener('sws:toast', handleToastRequest);
  }, [pushToast]);

  useKeyboardShortcuts({
    onZoomToSelection: (result) => {
      if (!result.success && result.message) {
        pushToast(result.message, 'warning');
      }
    },
  });

  useResponsiveLayout();


  const projectName = projectDetails?.projectName ?? 'Untitled Project';

  return (
    <AppShell projectName={projectName}>
      <Toolbar />

      <div className={`flex-1 flex overflow-hidden relative ${className}`}>
        <LeftSidebar />

        <main className="flex-1 relative overflow-hidden bg-slate-100 grid-pattern">
          <CanvasContainer className="w-full h-full" />

          <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-3 items-end">
            <Minimap />
            <ZoomControls />
          </div>

          <TutorialOverlay />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </main>

        <RightSidebar />
      </div>

      <StatusBar />
    </AppShell>
  );
}

export default CanvasPage;
