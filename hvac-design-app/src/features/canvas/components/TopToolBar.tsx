'use client';

import React, { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Pointer, Square, Box, StickyNote, Hand, Undo2, Redo2 } from 'lucide-react';
import { undo, redo } from '@/core/commands/entityCommands';
import { useCanUndo, useCanRedo } from '@/core/commands/historyStore';
import {
  useDuctDrawSettings,
  useEquipmentPlacementDraft,
  useSelectedFittingType,
  useSupportSettings,
  useToolStore,
  type CanvasTool,
} from '@/core/store/canvas.store';
import { useEntityStore } from '@/core/store/entityStore';
import { isEnabled } from '@/core/flags/featureFlags';
import { useCursorStore } from '@/features/canvas/store/cursorStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ViewModeToggle } from './ViewModeToggle';
import { getPlacementToolbarMetadata } from '@/features/canvas/tools/placementStrategies';
import { HvacCatalogIcon, resolveToolbarIconKey } from './catalogIcons';
import { SupportWorkflowPanel } from './Toolbar';
import { DuctToolOptionsPanel } from './DuctToolOptionsPanel';
import { FittingTypeSelector } from './FittingTypeSelector';
import { EquipmentOptionsPanel } from './EquipmentOptionsPanel';

interface TopToolBarProps {
  className?: string;
}

const TOOL_OPTION_PANELS: Partial<Record<CanvasTool, ComponentType>> = {
  duct: DuctToolOptionsPanel,
  fitting: FittingTypeSelector,
  support: () => <SupportWorkflowPanel className="w-full" />,
  equipment: EquipmentOptionsPanel,
};

const INITIAL_TOOL_RECORD: Record<CanvasTool, boolean> = {
  select: false,
  pan: false,
  duct: false,
  equipment: false,
  room: false,
  note: false,
  fitting: false,
  support: false,
};

export function TopToolBar({ className = '' }: TopToolBarProps) {
  const currentTool = useToolStore((state) => state.currentTool);
  const activeSpecialtyToolId = useToolStore((state) => state.activeSpecialtyToolId);
  const setTool = useToolStore((state) => state.setTool);
  const ductDrawSettings = useDuctDrawSettings();
  const selectedFittingType = useSelectedFittingType();
  const supportSettings = useSupportSettings();
  const equipmentDraft = useEquipmentPlacementDraft();
  const entityCount = useEntityStore((state) => state.allIds.length);
  const setCursorMode = useCursorStore((state) => state.setCursorMode);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [hasDrawnThisSession, setHasDrawnThisSession] = useState<Record<CanvasTool, boolean>>(INITIAL_TOOL_RECORD);
  const [collapsed, setCollapsed] = useState<Record<CanvasTool, boolean>>(INITIAL_TOOL_RECORD);
  const previousEntityCountRef = useRef(entityCount);
  
  useKeyboardShortcuts({});

  const ductToolbarMetadata = getPlacementToolbarMetadata(activeSpecialtyToolId);
  const singleToolbarEnabled = isEnabled('WS1_SINGLE_TOOLBAR');
  const inlineOptionsEnabled = isEnabled('WS2_INLINE_TOOL_OPTIONS');
  const ActivePanel = inlineOptionsEnabled ? TOOL_OPTION_PANELS[currentTool] ?? null : null;
  const slotOpen = Boolean(ActivePanel);
  const showSummaryChip = inlineOptionsEnabled && slotOpen && hasDrawnThisSession[currentTool] && collapsed[currentTool];

  const handleToolSelect = (tool: string) => {
    setTool(tool as CanvasTool);
    setCursorMode(tool === 'select' ? 'default' : 'crosshair');
    if (tool in TOOL_OPTION_PANELS) {
      const nextTool = tool as CanvasTool;
      setCollapsed((previous) => ({
        ...previous,
        [nextTool]: hasDrawnThisSession[nextTool],
      }));
    }
  };

  useEffect(() => {
    const previousEntityCount = previousEntityCountRef.current;
    if (inlineOptionsEnabled && entityCount > previousEntityCount && TOOL_OPTION_PANELS[currentTool]) {
      setHasDrawnThisSession((previous) => ({ ...previous, [currentTool]: true }));
      setCollapsed((previous) => ({ ...previous, [currentTool]: true }));
    }
    previousEntityCountRef.current = entityCount;
  }, [currentTool, entityCount, inlineOptionsEnabled]);

  const summaryText = useMemo(() => {
    switch (currentTool) {
      case 'duct':
        return ductDrawSettings.shape === 'round' || ductDrawSettings.shape === 'flexible'
          ? `Duct - ${ductDrawSettings.diameter} in dia`
          : `Duct - ${ductDrawSettings.width}x${ductDrawSettings.height} in`;
      case 'fitting':
        return `Fitting - ${selectedFittingType.replace(/_/g, ' ')}`;
      case 'support':
        return `Support - ${supportSettings.scope} ducts`;
      case 'equipment':
        return `${equipmentDraft.name} - ${equipmentDraft.capacity.toLocaleString()} ${equipmentDraft.capacityUnit}`;
      default:
        return '';
    }
  }, [currentTool, ductDrawSettings, equipmentDraft, selectedFittingType, supportSettings.scope]);

  const tools = [
    { id: 'select', icon: Pointer, label: 'Select (V)', shortcut: 'V' },
    { id: 'pan', icon: Hand, label: 'Pan (Space)', shortcut: 'Space' },
    { id: 'room', icon: Square, label: 'Room (R)', shortcut: 'R' },
    {
      id: 'duct',
      label: `${ductToolbarMetadata.label} (D)`,
      shortcut: 'D',
      tooltip: ductToolbarMetadata.tooltip,
    },
    { id: 'equipment', icon: Box, label: 'Equipment (E)', shortcut: 'E' },
    { id: 'support', label: 'Supports', shortcut: 'S', tooltip: 'Hangers, supports, and trapeze workflows' },
    { id: 'fitting', label: 'Fitting (F)', shortcut: 'F' },
    { id: 'note', icon: StickyNote, label: 'Note (N)', shortcut: 'N' },
  ];

  return (
    <div className={`absolute top-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm gap-1">
        {singleToolbarEnabled ? (
          <>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo (Ctrl+Z)"
              data-testid="undo-button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-500"
            >
              <Undo2 size={18} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              aria-label="Redo (Ctrl+Y)"
              data-testid="redo-button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-500"
            >
              <Redo2 size={18} />
            </button>
            <div className="mx-1 h-7 w-px bg-slate-200" />
          </>
        ) : null}
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => handleToolSelect(tool.id)}
            title={'tooltip' in tool && typeof tool.tooltip === 'string' ? `${tool.label} - ${tool.tooltip}` : tool.label}
            aria-label={tool.label}
            aria-pressed={currentTool === tool.id}
            data-testid={`tool-${tool.id}`}
            className={`
              h-9 rounded-md flex items-center justify-center gap-1.5 px-2 transition-all duration-200
              ${currentTool === tool.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
          >
            {'icon' in tool && tool.icon ? (
              <tool.icon size={18} strokeWidth={currentTool === tool.id ? 2.5 : 2} />
            ) : (
              <HvacCatalogIcon
                iconKey={
                  tool.id === 'duct'
                    ? resolveToolbarIconKey('duct', ductToolbarMetadata.iconKey) ?? 'duct_rectangular'
                    : tool.id === 'support'
                      ? 'accessory_support_hanger'
                    : resolveToolbarIconKey('fitting') ?? 'fitting_elbow'
                }
                size={18}
                strokeWidth={currentTool === tool.id ? 2.5 : 2}
                data-testid={`top-toolbar-icon-${tool.id}`}
                aria-hidden
              />
            )}
            {currentTool === tool.id ? (
              <span className="hidden whitespace-nowrap text-xs font-semibold md:inline">{tool.label}</span>
            ) : null}
          </button>
        ))}
        <div className="mx-1 h-7 w-px bg-slate-200" />
        <ViewModeToggle />
      </div>

      {inlineOptionsEnabled ? (
        <div
          className={`
            w-[min(92vw,920px)] origin-top overflow-hidden transition-all duration-200 motion-reduce:transition-none
            ${slotOpen ? 'max-h-[360px] translate-y-0 opacity-100' : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'}
          `}
          role="region"
          aria-label="Tool options"
          data-testid="tool-options-slot"
        >
          {showSummaryChip ? (
            <button
              type="button"
              className="w-full rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-left text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => setCollapsed((previous) => ({ ...previous, [currentTool]: false }))}
            >
              {summaryText}
            </button>
          ) : ActivePanel ? (
            <ActivePanel />
          ) : null}
        </div>
      ) : currentTool === 'support' ? (
        <SupportWorkflowPanel className="w-[min(92vw,920px)]" />
      ) : null}
    </div>
  );
}
