'use client';

import React, { useEffect } from 'react';
import { DraftingCompass } from 'lucide-react';
import { useActiveViewMode, useViewModeStore, type CanvasViewMode } from '../store/viewModeStore';

const viewModes: Array<{ id: CanvasViewMode; label: string; icon: typeof DraftingCompass; shortcut: string }> = [
  { id: 'plan', label: 'Plan View', icon: DraftingCompass, shortcut: 'Shift+2' },
  // 3D View suspended — { id: '3d', label: '3D View', icon: Box, shortcut: 'Shift+3' },
];

export function ViewModeToggle(): React.ReactElement {
  const activeViewMode = useActiveViewMode();
  const setViewMode = useViewModeStore((state) => state.setViewMode);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey) {
        return;
      }

      if (event.key === '@' || event.key === '2') {
        setViewMode('plan');
      }

      // Shift+3 shortcut for 3D view is suspended
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewMode]);

  return (
    <div
      className="ml-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1"
      data-testid="view-mode-toggle"
    >
      {viewModes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeViewMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            title={`${mode.label} (${mode.shortcut})`}
            onClick={() => setViewMode(mode.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Icon size={14} />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ViewModeToggle;
