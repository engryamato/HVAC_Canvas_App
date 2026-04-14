'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ProjectAssetsPanel } from '../ProjectAssetsPanel';
import { ManagePanel } from '../ManagePanel';
import { X } from 'lucide-react';

interface DockDrawerProps {
  className?: string;
}

const DEFAULT_DRAWER_WIDTH = 480;
const MIN_DRAWER_WIDTH = 360;
const MAX_DRAWER_WIDTH = 820;

export function DockDrawer({ className = '' }: DockDrawerProps) {
  const activeDockPanel = useLayoutStore((state) => state.activeDockPanel);
  const closeDockPanel = useLayoutStore((state) => state.closeDockPanel);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleResizeMove = useCallback((event: MouseEvent) => {
    const nextWidth = Math.min(
      MAX_DRAWER_WIDTH,
      Math.max(MIN_DRAWER_WIDTH, event.clientX - 56)
    );

    setDrawerWidth(nextWidth);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [handleResizeMove, isResizing, stopResizing]);

  if (activeDockPanel === 'none') {
    return null;
  }

  const headerTitle = activeDockPanel === 'services' ? 'Manage' : 'Catalog';
  const resizeLabel =
    activeDockPanel === 'services'
      ? 'Resize manage panel'
      : 'Resize project assets panel';

  return (
    <div
      className={`
        flex flex-col bg-white border-r border-slate-200 h-full relative z-20 shadow-xl
        animate-in slide-in-from-left duration-200
        ${className}
      `}
      style={{ width: `${drawerWidth}px` }}
      data-testid="dock-drawer"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={resizeLabel}
        title="Drag to resize"
        onMouseDown={(event) => {
          event.preventDefault();
          setIsResizing(true);
        }}
        onDoubleClick={() => setDrawerWidth(DEFAULT_DRAWER_WIDTH)}
        className={`absolute right-0 top-0 z-30 h-full w-1.5 translate-x-1/2 cursor-col-resize bg-transparent transition-colors ${
          isResizing ? 'after:bg-blue-500' : 'hover:after:bg-slate-300'
        } after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-full`}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="font-semibold text-slate-800">{headerTitle}</h2>
        <button
          onClick={closeDockPanel}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeDockPanel === 'services' ? (
          <ManagePanel activeTab="manage" />
        ) : (
          <ProjectAssetsPanel />
        )}
      </div>
    </div>
  );
}
