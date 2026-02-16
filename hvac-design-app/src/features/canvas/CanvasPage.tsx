'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { CanvasContainer } from './components/CanvasContainer';
import { ZoomControls } from './components/ZoomControls';
import { Minimap } from './components/Minimap';
import { UnifiedDock } from './components/UnifiedDock';
import { TopToolBar } from './components/TopToolBar';
import { ServiceContextStrip } from './components/ServiceContextStrip';
import { CanvasOverlayWarning } from './components/CanvasOverlayWarning';
import { RightSidebar } from './components/RightSidebar';
import { useViewportStore } from './store/viewportStore';

import { useAutoSave } from './hooks';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectDetails, useProjectStore } from '@/core/store/project.store';
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBar } from './components/StatusBar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useDialogStore } from '@/core/store/dialogStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionCount, useSelectedIds } from '@/features/canvas/store/selectionStore';
import { CalculationSettingsDialog } from './components/CalculationSettingsDialog';
import { BulkEditDialog } from './components/BulkEditDialog';
import { SystemTemplateSelector } from './components/SystemTemplateSelector';
import { useSettingsStore } from '@/core/store/settingsStore';
import {
  ENABLE_BULK_EDIT_DIALOG,
  ENABLE_CALCULATION_SETTINGS_DIALOG,
  ENABLE_SYSTEM_TEMPLATE_DIALOG,
} from '@/core/config/featureFlags';

/**
 * CanvasPage - Main canvas page with all components
 *
 * Layout:
 * - Unified Dock (Left): Rail + Drawer
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

  const pushToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent('sws:toast', { detail: { message, type } }));
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

  useKeyboardShortcuts({
    onZoomToSelection: (result) => {
      if (!result.success && result.message) {
        pushToast(result.message, 'warning');
      }
    },
  });

  useResponsiveLayout();

  const projectName = projectDetails?.projectName ?? 'Untitled Project';

  const setOpenBulkEdit = useDialogStore((state) => state.setOpenBulkEdit);
  const selectedCount = useSelectionCount();

  return (
    <AppShell projectName={projectName}>
      <div className={`flex-1 flex overflow-hidden relative ${className}`}>
        <UnifiedDock />

        <main className="flex-1 relative overflow-hidden bg-slate-100 grid-pattern flex flex-col">
          <ServiceContextStrip />
          <div className="flex-1 relative">
            <CanvasContainer className="w-full h-full" />
            
            <TopToolBar />

            <CanvasOverlayWarning />

            <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-3 items-end">
              <Minimap />
              <ZoomControls />
            </div>

            <TutorialOverlay />

            {ENABLE_BULK_EDIT_DIALOG && selectedCount > 1 && (
                <div className="absolute bottom-4 left-4 z-20">
                    <button
                        onClick={() => setOpenBulkEdit(true)}
                        className="bg-white hover:bg-slate-50 text-slate-800 font-medium py-2 px-4 rounded shadow border border-slate-200 transition-colors"
                    >
                        Bulk Edit ({selectedCount})
                    </button>
                </div>
            )}
          </div>
        </main>


        <RightSidebar />
      </div>

      <StatusBar />
      <CanvasDialogs />
    </AppShell>
  );
}


export function CanvasDialogs() {
    const { openCalculationSettings, openBulkEdit, openSystemTemplate, setOpenCalculationSettings, setOpenBulkEdit, setOpenSystemTemplate } = useDialogStore();
    const selectedIds = useSelectedIds();
    const entitiesById = useEntityStore((state) => state.byId);

    const selectedComponentIds = useMemo(() => {
        const componentIds = new Set<string>();

        selectedIds.forEach((entityId) => {
            const entity = entitiesById[entityId];
            if (!entity) {
                return;
            }

            if (entity.type === 'duct' || entity.type === 'equipment' || entity.type === 'fitting') {
                const componentId = entity.props.catalogItemId;
                if (componentId) {
                    componentIds.add(componentId);
                }
            }
        });

        return Array.from(componentIds);
    }, [entitiesById, selectedIds]);

    return (
        <>
            {ENABLE_CALCULATION_SETTINGS_DIALOG && (
                <CalculationSettingsDialog 
                    isOpen={openCalculationSettings} 
                    onClose={() => setOpenCalculationSettings(false)} 
                />
            )}

             {ENABLE_BULK_EDIT_DIALOG && (
                 <BulkEditDialog
                     isOpen={openBulkEdit}
                     onClose={() => setOpenBulkEdit(false)}
                     initialSelectedEntityIds={selectedIds}
                     initialSelectedComponentIds={selectedComponentIds}
                 />
             )}

            {ENABLE_SYSTEM_TEMPLATE_DIALOG && (
                <SystemTemplateSelector
                    isOpen={openSystemTemplate}
                    onClose={() => setOpenSystemTemplate(false)}
                    onSelect={(template) => {
                        useSettingsStore.getState().applyTemplate(template.id);
                        setOpenSystemTemplate(false);
                    }}
                />
            )}
        </>
    );
}

export default CanvasPage;
