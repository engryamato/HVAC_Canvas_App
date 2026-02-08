import React, { useState, useCallback, useEffect } from 'react';
import { BOMPanel } from './BOMPanel';
import { InspectorPanel } from './Inspector/InspectorPanel';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useInspectorPreferencesStore } from '../store/inspectorPreferencesStore';

interface RightSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

type RightTabId = 'properties' | 'bom' | 'calculations';

function normalizeRightTab(value: string): RightTabId {
  if (value === 'bom' || value === 'calculations' || value === 'properties') {
    return value;
  }
  return 'properties';
}

export function RightSidebar({ isOpen = true, onClose, className = '' }: RightSidebarProps) {
  const activeRightTab = useLayoutStore((state) => normalizeRightTab(state.activeRightTab));
  const setActiveRightTab = useLayoutStore((state) => state.setActiveRightTab);
  const rightSidebarCollapsed = useLayoutStore((state) => state.rightSidebarCollapsed);
  const toggleRightSidebar = useLayoutStore((state) => state.toggleRightSidebar);
  
  const inspectorWidth = useInspectorPreferencesStore((state) => state.inspectorWidth);
  const setInspectorWidth = useInspectorPreferencesStore((state) => state.setInspectorWidth);
  const resetInspectorWidth = useInspectorPreferencesStore((state) => state.resetInspectorWidth);

  const [isResizing, setIsResizing] = useState(false);
  const [dragWidth, setDragWidth] = useState(inspectorWidth);
  const widthRef = React.useRef(inspectorWidth);

  // Sync dragWidth/ref with store when not resizing (e.g. on reset)
  useEffect(() => {
    if (!isResizing) {
      setDragWidth(inspectorWidth);
      widthRef.current = inspectorWidth;
    }
  }, [inspectorWidth, isResizing]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    // Initialize ref with current store value to be safe
    widthRef.current = inspectorWidth; 
  }, [inspectorWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) {return;}
    
    // Calculate new width (window width - mouse x position)
    // Since it's right sidebar, moving left increases width
    const newWidth = window.innerWidth - e.clientX;
    
    // Clamp between 280px and 480px
    const clampedWidth = Math.min(Math.max(newWidth, 280), 480);
    
    // Update local state and ref only
    setDragWidth(clampedWidth);
    widthRef.current = clampedWidth;
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      // specific check for isResizing to avoid firing if not resizing
      setInspectorWidth(widthRef.current);
    }
  }, [isResizing, setInspectorWidth]);

  const handleDoubleClick = useCallback(() => {
    resetInspectorWidth();
  }, [resetInspectorWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      // Add a global cursor style to body to prevent cursor flickering
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while resizing
    } else {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={`right-sidebar ${rightSidebarCollapsed ? 'collapsed' : ''} ${className}`}
      style={{ width: rightSidebarCollapsed ? '48px' : `${isResizing ? dragWidth : inspectorWidth}px` }}
      data-testid="right-sidebar"
    >
      {!rightSidebarCollapsed && (
        <div 
          className="resize-handle-left"
          onMouseDown={handleResizeStart}
          onDoubleClick={handleDoubleClick}
          title="Drag to resize, double-click to reset"
        />
      )}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        {!rightSidebarCollapsed && (
          <div className="flex gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeRightTab === 'properties'}
              aria-controls="properties-panel"
              onClick={() => setActiveRightTab('properties')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeRightTab === 'properties'
                  ? 'bg-slate-200 text-slate-900 active'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-properties"
            >
              Properties
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeRightTab === 'bom'}
              aria-controls="bom-panel"
              onClick={() => setActiveRightTab('bom')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeRightTab === 'bom' 
                  ? 'bg-slate-200 text-slate-900 active' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-bom"
            >
              BOM
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeRightTab === 'calculations'}
              aria-controls="calculations-panel"
              onClick={() => setActiveRightTab('calculations')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeRightTab === 'calculations'
                  ? 'bg-slate-200 text-slate-900 active'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-calculations"
            >
              Calculations
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={toggleRightSidebar}
          className="p-1 rounded hover:bg-slate-100 text-slate-500"
          data-testid="right-sidebar-toggle"
          aria-label={rightSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
            className={rightSidebarCollapsed ? 'rotate-180' : ''}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {!rightSidebarCollapsed && (
        <div className="sidebar-content">
          {activeRightTab === 'properties' && (
            <section className="sidebar-section" data-testid="properties-panel" id="properties-panel" role="tabpanel">
              <InspectorPanel embedded />
            </section>
          )}

          {activeRightTab === 'bom' && (
            <section className="sidebar-section" data-testid="bom-panel" id="bom-panel" role="tabpanel">
              <h3 className="sidebar-title">Bill of Quantities</h3>
              <BOMPanel />
            </section>
          )}

          {activeRightTab === 'calculations' && (
            <section className="sidebar-section" data-testid="calculations-panel" id="calculations-panel" role="tabpanel">
              <h3 className="sidebar-title">Calculations</h3>
              <div className="sidebar-empty">Calculation details will appear here.</div>
            </section>
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

export default RightSidebar;
