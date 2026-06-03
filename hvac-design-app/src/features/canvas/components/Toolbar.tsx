'use client';

import React from 'react';
import {
  useToolStore,
  useToolActions,
  type CanvasTool,
} from '@/core/store/canvas.store';
import { isEnabled } from '@/core/flags/featureFlags';
import { useCanUndo, useCanRedo } from '@/core/commands/historyStore';
import { undo, redo } from '@/core/commands/entityCommands';
import { useCursorStore } from '@/features/canvas/store/cursorStore';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { EquipmentTypeSelector } from './EquipmentTypeSelector';
import { FittingTypeSelector } from './FittingTypeSelector';
import {
  getPlacementToolbarMetadata,
} from '@/features/canvas/tools/placementStrategies';
import { HvacCatalogIcon, resolveToolbarIconKey } from './catalogIcons';
import {
  applyAutoHangerSpacing,
  clearSupportDraft,
  getSupportPreviewModeForEntry,
  isSupportToolEntry,
  previewAutoHangerSpacing,
} from '@/features/canvas/tools/supportPlacement';

interface ToolButtonProps {
  tool: CanvasTool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  tooltip?: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ tool, icon, label, shortcut, tooltip, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-10 h-10 flex items-center justify-center rounded-lg
        transition-colors duration-150 relative group
        ${
          isActive
            ? 'active bg-blue-500 text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }
      `}
      title={tooltip ? `${label} (${shortcut}) - ${tooltip}` : `${label} (${shortcut})`}
      aria-label={label}
      aria-pressed={isActive}
      data-testid={`tool-${tool}`}
    >
      {icon}
      {/* Tooltip */}
      <div
        className="
        absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs
        whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
        transition-opacity duration-150 z-50
      "
      >
        {label} <span className="text-slate-400">({shortcut})</span>
      </div>
    </button>
  );
}

// Simple SVG icons for tools
const SelectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
  </svg>
);

const PanIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const EquipmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const RoomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const NoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    <line x1="9" y1="9" x2="10" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const TOOLS: { tool: CanvasTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: 'select', icon: <SelectIcon />, label: 'Select', shortcut: 'V' },
  { tool: 'pan', icon: <PanIcon />, label: 'Pan', shortcut: 'Space' },
  {
    tool: 'duct',
    icon: <HvacCatalogIcon iconKey="duct_rectangular" size={20} strokeWidth={2} data-testid="toolbar-icon-duct" aria-hidden />,
    label: 'Duct',
    shortcut: 'D',
  },
  {
    tool: 'fitting',
    icon: <HvacCatalogIcon iconKey="fitting_elbow" size={20} strokeWidth={2} data-testid="toolbar-icon-fitting" aria-hidden />,
    label: 'Fitting',
    shortcut: 'F',
  },
  {
    tool: 'support',
    icon: <HvacCatalogIcon iconKey="accessory_support_hanger" size={20} strokeWidth={2} data-testid="toolbar-icon-support" aria-hidden />,
    label: 'Supports',
    shortcut: 'S',
  },
  { tool: 'equipment', icon: <EquipmentIcon />, label: 'Equipment', shortcut: 'E' },
  { tool: 'room', icon: <RoomIcon />, label: 'Room', shortcut: 'R' },
  { tool: 'note', icon: <NoteIcon />, label: 'Note', shortcut: 'N' },
];

/**
 * Undo/Redo button component
 */
function UndoRedoButton({
  onClick,
  disabled,
  icon,
  label,
  shortcut,
  testId,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-8 h-8 flex items-center justify-center rounded transition-colors
        ${disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
        }
      `}
      title={`${label} (${shortcut})`}
      aria-label={`${label} (${shortcut})`}
      data-testid={testId}
    >
      {icon}
    </button>
  );
}

interface ToolButtonsProps {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

interface SupportWorkflowPanelProps {
  className?: string;
}

export function SupportWorkflowPanel({ className = '' }: SupportWorkflowPanelProps) {
  const currentTool = useToolStore((state) => state.currentTool);
  const supportSettings = useToolStore((state) => state.supportSettings);
  const supportPreviewMarkers = useToolStore((state) => state.supportPreviewMarkers);
  const supportDraftAnchor = useToolStore((state) => state.supportDraftAnchor);
  const supportPrompt = useToolStore((state) => state.supportPrompt);
  const activeEntryId = useUnifiedCatalogStore((state) => state.activeEntryId);
  const catalogEntries = useUnifiedCatalogStore((state) => state.catalogEntries);
  const {
    setSupportSettings,
    clearSupportPreview,
    setSupportDraftAnchor,
    setSupportPrompt,
    setStatusMessage,
  } = useToolActions();
  const activeEntry = catalogEntries.find((entry) => entry.id === activeEntryId) ?? null;
  const previewMode = getSupportPreviewModeForEntry(activeEntry);
  const hangerOptions = catalogEntries.filter(
    (entry) =>
      entry.engineeringSystem === 'universal' &&
      entry.categoryId === 'hangers_supports' &&
      entry.componentClass === 'accessory'
  );

  React.useEffect(() => {
    if (previewMode !== 'auto_hanger_spacing' && supportPreviewMarkers.length > 0) {
      clearSupportPreview();
    }
  }, [previewMode, supportPreviewMarkers.length, clearSupportPreview]);

  if (currentTool !== 'support') {
    return null;
  }

  if (!isSupportToolEntry(activeEntry)) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 ${className}`}>
        Select a Universal Components support entry from the catalog to use support workflows.
      </div>
    );
  }

  const handlePreview = () => {
    const markers = previewAutoHangerSpacing();
    setStatusMessage(
      markers.length > 0
        ? `Previewed ${markers.length} support markers`
        : 'No duct runs available for hanger preview'
    );
  };

  const handleApply = () => {
    const created = applyAutoHangerSpacing();
    setStatusMessage(
      created > 0 ? `Placed ${created} support entities` : 'No preview markers available to apply'
    );
  };

  const handleClear = () => {
    clearSupportPreview();
    clearSupportDraft();
    setStatusMessage('Cleared support preview');
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Support Workflow</div>
          <div className="text-sm font-semibold text-slate-900">{activeEntry.name}</div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
          {previewMode === 'auto_hanger_spacing'
            ? `${supportPreviewMarkers.length} preview`
            : supportDraftAnchor
              ? 'Start selected'
              : 'Awaiting click'}
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <label className="space-y-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mount Height</span>
          <input
            type="number"
            min="0"
            step="1"
            value={supportSettings.mountHeight ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setSupportSettings({ mountHeight: value ? Number(value) : null });
              if (value) {
                setSupportPrompt(null);
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-400"
            placeholder="96"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Code Standard</span>
          <select
            value={supportSettings.codeStandard}
            onChange={(event) =>
              setSupportSettings({
                codeStandard: event.target.value as typeof supportSettings.codeStandard,
              })
            }
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-400"
          >
            <option value="smacna">SMACNA</option>
            <option value="ibc_asce7">IBC / ASCE 7</option>
            <option value="ashrae">ASHRAE</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Scope</span>
          <select
            value={supportSettings.scope}
            onChange={(event) =>
              setSupportSettings({
                scope: event.target.value as typeof supportSettings.scope,
              })
            }
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-400"
          >
            <option value="selected">Selected ducts</option>
            <option value="all">All duct runs</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Hanger Type</span>
          <select
            value={supportSettings.hangerEntryId ?? ''}
            onChange={(event) => setSupportSettings({ hangerEntryId: event.target.value || null })}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-400"
          >
            {hangerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {previewMode === 'auto_hanger_spacing' ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePreview}
              className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            Preview markers are generated for the selected ducts or all duct runs, then applied as one batch history action.
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            <div>Click a duct centerline to start the continuous trapeze run, then click again to end it.</div>
            {supportDraftAnchor ? (
              <div className="mt-1">Start point set. Click the duct centerline again to finish the continuous trapeze run.</div>
            ) : null}
            {supportPrompt ? (
              <div className="mt-1">
                {supportPrompt.title}: {supportPrompt.description}
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSupportDraftAnchor(null);
                setSupportPrompt(null);
                setStatusMessage('Cleared trapeze draft');
              }}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Reusable tool buttons list used by both the standalone toolbar and sidebar.
 */
export function ToolButtons({ className = '', orientation = 'vertical' }: ToolButtonsProps) {
  const currentTool = useToolStore((state) => state.currentTool);
  const activeSpecialtyToolId = useToolStore((state) => state.activeSpecialtyToolId);
  const { setTool, dispatchKeyboardShortcut, setEquipmentPlacementDialogOpen } = useToolActions();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const isVertical = orientation === 'vertical';
  const setCursorMode = useCursorStore((state) => state.setCursorMode);
  const ductToolbarMetadata = getPlacementToolbarMetadata(activeSpecialtyToolId);
  const singleToolbarEnabled = isEnabled('WS1_SINGLE_TOOLBAR');

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
        case 'd':
        case 'f':
        case 'e':
        case 's':
        case 'escape': {
          const activated = dispatchKeyboardShortcut(e.key.toLowerCase());
          if (!activated && e.key.toLowerCase() === 'f') {
            setTool('fitting');
          }
          if (!activated && e.key.toLowerCase() === 's') {
            setTool('support');
          }
          break;
        }
        case ' ': // Space
        case 'h':
          e.preventDefault(); // Prevent page scroll on space
          setTool('pan');
          break;
        case 'r':
          setTool('room');
          break;
        case 'n':
          setTool('note');
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undo();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatchKeyboardShortcut, setTool]);

  React.useEffect(() => {
    if (currentTool === 'select' || currentTool === 'pan') {
      setCursorMode('select');
      return;
    }
    if (currentTool === 'duct') {
      setCursorMode('duct');
      return;
    }
    if (currentTool === 'fitting') {
      setCursorMode('fitting');
      return;
    }
    if (currentTool === 'equipment') {
      setCursorMode('equipment');
      return;
    }
    setCursorMode('default');
  }, [currentTool, setCursorMode]);

  const handleToolClick = (tool: CanvasTool) => {
    if (tool === 'duct' && activeSpecialtyToolId) {
      setTool('duct');
      return;
    }

    // Equipment: if already active, reopen the dialog rather than deactivating
    if (tool === 'equipment' && currentTool === 'equipment') {
      setEquipmentPlacementDialogOpen(true);
      return;
    }

    setTool(tool);
  };

  if (singleToolbarEnabled) {
    return null;
  }

  return (
    <div
      className={`
        flex gap-2 p-2 bg-slate-50 rounded-lg shadow-sm border border-slate-200
        ${isVertical ? 'flex-col items-start' : 'flex-row flex-wrap items-center'}
        ${className}
      `}
      role="toolbar"
      aria-label="Canvas tools"
      data-testid="toolbar"
    >
      {TOOLS.map(({ tool, icon, label, shortcut }) => {
        if (tool === 'duct') {
          return (
            <ToolButton
              key={tool}
              tool={tool}
              icon={
                <HvacCatalogIcon
                  iconKey={resolveToolbarIconKey('duct', ductToolbarMetadata.iconKey) ?? 'duct_rectangular'}
                  size={20}
                  strokeWidth={2}
                  data-testid="toolbar-icon-duct"
                  aria-hidden
                />
              }
              label={ductToolbarMetadata.label}
              shortcut={shortcut}
              tooltip={ductToolbarMetadata.tooltip}
              isActive={currentTool === tool}
              onClick={() => handleToolClick(tool)}
            />
          );
        }

        return (
          <ToolButton
            key={tool}
            tool={tool}
            icon={icon}
            label={label}
            shortcut={shortcut}
            isActive={currentTool === tool}
            onClick={() => handleToolClick(tool)}
          />
        );
      })}

      {/* EquipmentTypeSelector retired — replaced by EquipmentPlacementDialog (DD-004) */}
      {/* {currentTool === 'equipment' ? <EquipmentTypeSelector /> : null} */}
      {currentTool === 'fitting' ? <FittingTypeSelector /> : null}
      {currentTool === 'support' ? (
        <div className={`w-full ${isVertical ? '' : 'basis-full'}`}>
          <SupportWorkflowPanel />
        </div>
      ) : null}

      {/* Undo/Redo buttons */}
      <div className={`flex items-center gap-1 ${isVertical ? 'ml-2 pl-2 border-l' : 'ml-1 pl-2 border-l'} border-slate-200`}>
        <UndoRedoButton
          onClick={undo}
          disabled={!canUndo}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          }
          label="Undo"
          shortcut="Ctrl+Z"
          testId="undo-button"
        />
        <UndoRedoButton
          onClick={redo}
          disabled={!canRedo}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
          }
          label="Redo"
          shortcut="Ctrl+Y"
          testId="redo-button"
        />
      </div>
    </div>
  );
}

interface ToolbarProps {
  className?: string;
}

/**
 * Backward-compatible standalone toolbar wrapper.
 */
export function Toolbar({ className = '' }: ToolbarProps) {
  return <ToolButtons className={className} orientation="vertical" />;
}

export default Toolbar;
