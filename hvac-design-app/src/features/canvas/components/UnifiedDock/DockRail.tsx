'use client';

import { 
  Package,
  Undo2,
  Redo2
} from 'lucide-react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface DockRailProps {
  className?: string;
}

export function DockRail({ className = '' }: DockRailProps) {
  const activeDockPanel = useLayoutStore((state) => state.activeDockPanel);
  const toggleDockPanel = useLayoutStore((state) => state.toggleDockPanel);

  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  useKeyboardShortcuts({});

  return (
    <div className={`flex flex-col items-center w-14 bg-slate-900 border-r border-slate-800 py-4 gap-6 z-30 ${className}`}>
      {/* Assets Toggle (Moved to top) */}
      <div className="flex flex-col gap-2 w-full px-2">
        <button
          onClick={() => toggleDockPanel('library')}
          title="Project Assets"
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
            ${activeDockPanel !== 'none' 
              ? 'bg-slate-800 text-white border border-slate-700' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }
          `}
        >
          <Package size={20} />
        </button>
      </div>

      <div className="flex-1" />

       {/* History Controls */}
      <div className="flex flex-col gap-2 w-full px-2 pb-4">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Undo2 size={20} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Redo2 size={20} />
        </button>
      </div>
    </div>
  );
}
