'use client';

import { Pointer, Square, Box, StickyNote, Hand } from 'lucide-react';
import { useToolStore, type CanvasTool } from '@/core/store/canvas.store';
import { useCursorStore } from '@/features/canvas/store/cursorStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ViewModeToggle } from './ViewModeToggle';
import { getPlacementToolbarMetadata } from '@/features/canvas/tools/placementStrategies';
import { HvacCatalogIcon, resolveToolbarIconKey } from './catalogIcons';
import { SupportWorkflowPanel } from './Toolbar';

interface TopToolBarProps {
  className?: string;
}

export function TopToolBar({ className = '' }: TopToolBarProps) {
  const currentTool = useToolStore((state) => state.currentTool);
  const activeSpecialtyToolId = useToolStore((state) => state.activeSpecialtyToolId);
  const setTool = useToolStore((state) => state.setTool);
  const setCursorMode = useCursorStore((state) => state.setCursorMode);
  
  useKeyboardShortcuts({});

  const ductToolbarMetadata = getPlacementToolbarMetadata(activeSpecialtyToolId);

  const handleToolSelect = (tool: string) => {
    setTool(tool as CanvasTool);
    setCursorMode(tool === 'select' ? 'default' : 'crosshair');
  };

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
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            title={'tooltip' in tool && typeof tool.tooltip === 'string' ? `${tool.label} - ${tool.tooltip}` : tool.label}
            aria-label={tool.label}
            className={`
              w-9 h-9 rounded-md flex items-center justify-center transition-all duration-200
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
          </button>
        ))}
        <div className="mx-1 h-7 w-px bg-slate-200" />
        <ViewModeToggle />
      </div>

      {currentTool === 'support' ? <SupportWorkflowPanel className="w-[min(92vw,920px)]" /> : null}
    </div>
  );
}
