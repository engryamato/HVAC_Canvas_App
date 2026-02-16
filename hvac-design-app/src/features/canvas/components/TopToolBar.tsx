'use client';

import { 
  Pointer, 
  Square, 
  Box, 
  GitCommit, 
  StickyNote, 
  Hand
} from 'lucide-react';
import { useToolStore, type CanvasTool } from '@/core/store/canvas.store';
import { useCursorStore } from '@/features/canvas/store/cursorStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface TopToolBarProps {
  className?: string;
}

export function TopToolBar({ className = '' }: TopToolBarProps) {
  const currentTool = useToolStore((state) => state.currentTool);
  const setTool = useToolStore((state) => state.setTool);
  const setCursorMode = useCursorStore((state) => state.setCursorMode);
  
  useKeyboardShortcuts({});

  const handleToolSelect = (tool: string) => {
    setTool(tool as CanvasTool);
    setCursorMode(tool === 'select' ? 'default' : 'crosshair');
  };

  const tools = [
    { id: 'select', icon: Pointer, label: 'Select (V)', shortcut: 'V' },
    { id: 'pan', icon: Hand, label: 'Pan (Space)', shortcut: 'Space' },
    { id: 'room', icon: Square, label: 'Room (R)', shortcut: 'R' },
    { id: 'duct', icon: Box, label: 'Duct (D)', shortcut: 'D' },
    { id: 'equipment', icon: Box, label: 'Equipment (E)', shortcut: 'E' },
    { id: 'fitting', icon: GitCommit, label: 'Fitting (F)', shortcut: 'F' }, // Using GitCommit as a proxy for fitting icon
    { id: 'note', icon: StickyNote, label: 'Note (N)', shortcut: 'N' },
  ];

  return (
    <div className={`flex items-center bg-white px-2 py-1.5 rounded-lg shadow-sm border border-slate-200 gap-1 absolute top-4 left-1/2 -translate-x-1/2 z-40 ${className}`}>
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolSelect(tool.id)}
          title={tool.label}
          className={`
            w-9 h-9 rounded-md flex items-center justify-center transition-all duration-200
            ${currentTool === tool.id 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }
          `}
        >
          <tool.icon size={18} strokeWidth={currentTool === tool.id ? 2.5 : 2} />
        </button>
      ))}
    </div>
  );
}
