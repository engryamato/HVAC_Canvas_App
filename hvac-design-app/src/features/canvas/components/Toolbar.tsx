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
import { FITTING_TYPE_LABELS } from '../entities/fittingDefaults';

interface ToolButtonProps {
  tool: CanvasTool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, shortcut, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-10 h-10 flex items-center justify-center rounded-lg
        transition-colors duration-150 relative group
        ${
          isActive
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
      title={`${label} (${shortcut})`}
      aria-label={label}
      aria-pressed={isActive}
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
    <rect x="10" y="10" width="8" height="8" rx="1" transform="rotate(45 12 12)" />
  </svg>
);

const NoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const TOOLS: { tool: CanvasTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: 'select', icon: <SelectIcon />, label: 'Select', shortcut: 'V' },
  { tool: 'room', icon: <RoomIcon />, label: 'Room', shortcut: 'R' },
  { tool: 'duct', icon: <DuctIcon />, label: 'Duct', shortcut: 'D' },
  { tool: 'equipment', icon: <EquipmentIcon />, label: 'Equipment', shortcut: 'E' },
  { tool: 'fitting', icon: <FittingIcon />, label: 'Fitting', shortcut: 'F' },
  { tool: 'note', icon: <NoteIcon />, label: 'Note', shortcut: 'N' },
];

const EQUIPMENT_TYPES: EquipmentType[] = ['hood', 'fan', 'diffuser', 'damper', 'air_handler'];

const FITTING_TYPES: FittingType[] = ['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap'];

/**
 * Undo/Redo button component
 */
function UndoRedoButton({
  onClick,
  disabled,
  icon,
  label,
  shortcut,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
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
          const nextIndex = (currentIndex + 1) % EQUIPMENT_TYPES.length;
          setEquipmentType(EQUIPMENT_TYPES[nextIndex]!);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + EQUIPMENT_TYPES.length) % EQUIPMENT_TYPES.length;
          setEquipmentType(EQUIPMENT_TYPES[prevIndex]!);
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
          const nextIndex = (currentIndex + 1) % FITTING_TYPES.length;
          setFittingType(FITTING_TYPES[nextIndex]!);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + FITTING_TYPES.length) % FITTING_TYPES.length;
          setFittingType(FITTING_TYPES[prevIndex]!);
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
                  ? 'bg-orange-100 text-orange-700 font-medium'
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

  // Undo/Redo state (must be called at top level, not in JSX)
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

      {/* Divider */}
      <div className="border-t border-gray-300 my-1" />

      {/* Undo/Redo buttons */}
      <div className="flex flex-row gap-1 justify-center">
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
