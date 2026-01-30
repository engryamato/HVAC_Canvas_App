'use client';

import React from 'react';
import {
  useToolStore,
  useToolActions,
  useSelectedEquipmentType,
  useSelectedFittingType,
  type CanvasTool,
} from '@/core/store/canvas.store';
import { useCanUndo, useCanRedo } from '@/core/commands/historyStore';
import { undo, redo } from '@/core/commands/entityCommands';
import type { EquipmentType } from '@/core/schema/equipment.schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import { EQUIPMENT_TYPE_LABELS } from '../entities/equipmentDefaults';

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
            ? 'active bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        absolute left-full ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs
        whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
        transition-opacity duration-150 z-50
      "
      >
        {label} <span className="text-gray-400">({shortcut})</span>
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

const RoomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const DuctIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
    <line x1="4" y1="8" x2="20" y2="8" strokeLinecap="round" />
    <line x1="4" y1="16" x2="20" y2="16" strokeLinecap="round" />
  </svg>
);

const EquipmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const FittingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12h8M20 12h-4M12 4v8M12 20v-4" />
    <circle cx="12" cy="12" r="3" />
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

const LineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="20" x2="20" y2="4" strokeLinecap="round" />
  </svg>
);

const TOOLS: { tool: CanvasTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: 'select', icon: <SelectIcon />, label: 'Select', shortcut: 'V' },
  { tool: 'room', icon: <RoomIcon />, label: 'Room', shortcut: 'R' },
  { tool: 'line', icon: <LineIcon />, label: 'Line', shortcut: 'L' },
  { tool: 'duct', icon: <DuctIcon />, label: 'Duct', shortcut: 'D' },
  { tool: 'equipment', icon: <EquipmentIcon />, label: 'Equipment', shortcut: 'E' },
  { tool: 'fitting', icon: <FittingIcon />, label: 'Fitting', shortcut: 'F' },
  { tool: 'note', icon: <NoteIcon />, label: 'Note', shortcut: 'N' },
];

const EQUIPMENT_TYPES: EquipmentType[] = ['hood', 'fan', 'diffuser', 'damper', 'air_handler'];

const FITTING_TYPES: FittingType[] = ['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap'];

const FITTING_TYPE_LABELS: Record<FittingType, string> = {
  elbow_90: '90° Elbow',
  elbow_45: '45° Elbow',
  tee: 'Tee',
  reducer: 'Reducer',
  cap: 'Cap',
};

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

/**
 * Equipment type selector component with keyboard navigation
 */
function EquipmentTypeSelector() {
  const selectedType = useSelectedEquipmentType();
  const { setEquipmentType } = useToolActions();

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setEquipmentType(EQUIPMENT_TYPES[(currentIndex + 1) % EQUIPMENT_TYPES.length]!);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setEquipmentType(EQUIPMENT_TYPES[(currentIndex - 1 + EQUIPMENT_TYPES.length) % EQUIPMENT_TYPES.length]!);
          break;
        case 'Home':
          e.preventDefault();
          setEquipmentType(EQUIPMENT_TYPES[0]!);
          break;
        case 'End':
          e.preventDefault();
          setEquipmentType(EQUIPMENT_TYPES[EQUIPMENT_TYPES.length - 1]!);
          break;
      }
    },
    [setEquipmentType]
  );

  return (
    <div
      className="flex flex-col gap-1 p-2 border-t border-gray-200"
      role="radiogroup"
      aria-label="Equipment type selection"
    >
      <div id="equipment-type-label" className="text-xs text-gray-500 font-medium mb-1">
        Equipment Type
      </div>
      {EQUIPMENT_TYPES.map((type, index) => {
        const isSelected = selectedType === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-labelledby="equipment-type-label"
            onClick={() => setEquipmentType(type)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={isSelected ? 0 : -1}
            className={`
              px-2 py-1.5 text-xs rounded transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500
              ${
                isSelected
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }
            `}
            title={EQUIPMENT_TYPE_LABELS[type]}
          >
            {EQUIPMENT_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Fitting type selector component with keyboard navigation
 */
function FittingTypeSelector() {
  const selectedType = useSelectedFittingType();
  const { setFittingType } = useToolActions();

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFittingType(FITTING_TYPES[(currentIndex + 1) % FITTING_TYPES.length]!);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFittingType(FITTING_TYPES[(currentIndex - 1 + FITTING_TYPES.length) % FITTING_TYPES.length]!);
          break;
        case 'Home':
          e.preventDefault();
          setFittingType(FITTING_TYPES[0]!);
          break;
        case 'End':
          e.preventDefault();
          setFittingType(FITTING_TYPES[FITTING_TYPES.length - 1]!);
          break;
      }
    },
    [setFittingType]
  );

  return (
    <div
      className="flex flex-col gap-1 p-2 border-t border-gray-200"
      role="radiogroup"
      aria-label="Fitting type selection"
    >
      <div id="fitting-type-label" className="text-xs text-gray-500 font-medium mb-1">
        Fitting Type
      </div>
      {FITTING_TYPES.map((type, index) => {
        const isSelected = selectedType === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-labelledby="fitting-type-label"
            onClick={() => setFittingType(type)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={isSelected ? 0 : -1}
            className={`
              px-2 py-1.5 text-xs rounded transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500
              ${
                isSelected
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }
            `}
            title={FITTING_TYPE_LABELS[type]}
          >
            {FITTING_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}

interface ToolbarProps {
  className?: string;
}

/**
 * Toolbar component for tool selection.
 * Displays vertically on the left side of the canvas.
 */
export function Toolbar({ className = '' }: ToolbarProps) {
  const currentTool = useToolStore((state) => state.currentTool);
  const { setTool } = useToolActions();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          break;
        case 'r':
          setTool('room');
          break;
        case 'l':
          setTool('line');
          break;
        case 'd':
          setTool('duct');
          break;
        case 'e':
          setTool('equipment');
          break;
        case 'f':
          setTool('fitting');
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
  }, [setTool]);

  return (
    <div
      className={`
        flex flex-col gap-2 p-2
        bg-white rounded-xl shadow-lg border border-gray-200
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
      <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-300">
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

      {/* Show equipment type selector when equipment tool is active */}
      {currentTool === 'equipment' && <EquipmentTypeSelector />}

      {/* Show fitting type selector when fitting tool is active */}
      {currentTool === 'fitting' && <FittingTypeSelector />}
    </div>
  );
}

export default Toolbar;
