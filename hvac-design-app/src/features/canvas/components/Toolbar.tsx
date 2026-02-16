'use client';

import React from 'react';
import {
  useToolStore,
  useToolActions,
  type CanvasTool,
} from '@/core/store/canvas.store';
import { useCanUndo, useCanRedo } from '@/core/commands/historyStore';
import { undo, redo } from '@/core/commands/entityCommands';
import { useCursorStore } from '@/features/canvas/store/cursorStore';

interface ToolButtonProps {
  tool: CanvasTool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ tool, icon, label, shortcut, isActive, onClick }: ToolButtonProps) {
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
      title={`${label} (${shortcut})`}
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

const DuctIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
    <line x1="4" y1="8" x2="20" y2="8" strokeLinecap="round" />
    <line x1="4" y1="16" x2="20" y2="16" strokeLinecap="round" />
  </svg>
);

const FittingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 7h8v4h4v8H9v-4H5z" strokeLinecap="round" strokeLinejoin="round" />
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
  { tool: 'duct', icon: <DuctIcon />, label: 'Duct', shortcut: 'D' },
  { tool: 'fitting', icon: <FittingIcon />, label: 'Fitting', shortcut: 'F' },
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

/**
 * Reusable tool buttons list used by both the standalone toolbar and sidebar.
 */
export function ToolButtons({ className = '', orientation = 'vertical' }: ToolButtonsProps) {
  const currentTool = useToolStore((state) => state.currentTool);
  const { setTool, dispatchKeyboardShortcut } = useToolActions();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const isVertical = orientation === 'vertical';
  const setCursorMode = useCursorStore((state) => state.setCursorMode);

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
        case 'escape': {
          const activated = dispatchKeyboardShortcut(e.key.toLowerCase());
          if (!activated && e.key.toLowerCase() === 'f') {
            setTool('fitting');
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
      {TOOLS.map(({ tool, icon, label, shortcut }) => (
        <ToolButton
          key={tool}
          tool={tool}
          icon={icon}
          label={label}
          shortcut={shortcut}
          isActive={currentTool === tool}
          onClick={() => setTool(tool)}
        />
      ))}

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
