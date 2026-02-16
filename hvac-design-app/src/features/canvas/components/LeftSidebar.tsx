'use client';

import React, { useState } from 'react';
import { useStatusMessage } from '@/core/store/canvas.store';
import { useCursorStore } from '@/features/canvas/store/cursorStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ProductCatalogPanel } from './ProductCatalogPanel';
import { ServicesPanel } from './ServicesPanel';
import { ToolButtons } from './Toolbar';

interface LeftSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

type LeftTabId = 'library' | 'services';

function normalizeLeftTab(value: string): LeftTabId {
  if (value === 'library' || value === 'services') {
    return value;
  }
  if (value === 'product-catalog' || value === 'equipment') {
    return 'library';
  }
  return 'library';
}

export function LeftSidebar({
  isOpen = true,
  onClose,
  defaultWidth = 300,
  minWidth = 250,
  maxWidth = 500,
  className = '',
}: LeftSidebarProps) {
  const activeLeftTab = useLayoutStore((state) => normalizeLeftTab(state.activeLeftTab));
  const setActiveLeftTab = useLayoutStore((state) => state.setActiveLeftTab);
  const leftSidebarCollapsed = useLayoutStore((state) => state.leftSidebarCollapsed);
  const toggleLeftSidebar = useLayoutStore((state) => state.toggleLeftSidebar);

  const statusMessage = useStatusMessage();
  const cursorMode = useCursorStore((state) => state.cursorMode);
  
  const [sidebarWidth, setSidebarWidth] = useState<number>(defaultWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResizeMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing, minWidth, maxWidth]
  );

  const handleResizeEnd = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (!isResizing) {
      return undefined;
    }
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={`left-sidebar ${leftSidebarCollapsed ? 'collapsed' : ''} ${className}`}
      style={{ width: leftSidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
      data-testid="left-sidebar"
    >
      <div className="resize-handle" onMouseDown={handleResizeStart} />

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        {!leftSidebarCollapsed && (
          <div className="flex gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeLeftTab === 'library'}
              aria-controls="library-panel"
              onClick={() => setActiveLeftTab('library')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeLeftTab === 'library'
                  ? 'active bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-library"
            >
              Library
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeLeftTab === 'services'}
              aria-controls="services-panel"
              onClick={() => setActiveLeftTab('services')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeLeftTab === 'services'
                  ? 'active bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-services"
            >
              Services
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={toggleLeftSidebar}
          className={`p-1 rounded hover:bg-slate-100 text-slate-500 transition-transform ${
            leftSidebarCollapsed ? 'rotate-180 absolute left-2 top-2 z-50 bg-white shadow-md border border-slate-200' : ''
          }`}
          data-testid="left-sidebar-toggle"
          aria-label={leftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {!leftSidebarCollapsed && (
        <div className="border-b border-slate-200 bg-white px-3 py-2">
          <ToolButtons orientation="horizontal" className="w-full" />
          <div className="mt-2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
            <span className="font-medium">{statusMessage}</span>
            <span className="ml-2 text-slate-500">Cursor: {cursorMode}</span>
          </div>
        </div>
      )}

      {!leftSidebarCollapsed && (
        <div className="sidebar-content overflow-y-auto">
          {activeLeftTab === 'library' && (
            <div className="p-3" data-testid="library-panel" id="library-panel" role="tabpanel">
              <ProductCatalogPanel />
            </div>
          )}

          {activeLeftTab === 'services' && (
            <div className="p-3" data-testid="services-panel" id="services-panel" role="tabpanel">
              <ServicesPanel />
            </div>
          )}
        </div>
      )}

      {onClose && (
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          Close
        </button>
      )}
    </aside>
  );
}

export default LeftSidebar;
