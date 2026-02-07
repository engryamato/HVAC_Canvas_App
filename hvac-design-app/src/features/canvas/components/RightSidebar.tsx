'use client';

import React from 'react';
import { BOMPanel } from './BOMPanel';
import { InspectorPanel } from './Inspector/InspectorPanel';
import { useInspectorPreferencesStore } from '../store/inspectorPreferencesStore';
import { useLayoutStore } from '@/stores/useLayoutStore';

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

  const isFloating = useInspectorPreferencesStore((state) => state.isFloating);
  const floatingPosition = useInspectorPreferencesStore((state) => state.floatingPosition);
  const setFloating = useInspectorPreferencesStore((state) => state.setFloating);
  const setFloatingPosition = useInspectorPreferencesStore((state) => state.setFloatingPosition);

  const handleFloat = React.useCallback(() => {
    setFloating(true);

    if (!floatingPosition) {
      const panelWidthPx = 320;
      const centerX = Math.max(50, Math.round((window.innerWidth - panelWidthPx) / 2));
      setFloatingPosition({ x: centerX, y: 80 });
    }
  }, [floatingPosition, setFloating, setFloatingPosition]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={`right-sidebar ${rightSidebarCollapsed ? 'collapsed' : ''} ${className}`}
      style={{ width: rightSidebarCollapsed ? '48px' : '320px' }}
      data-testid="right-sidebar"
    >
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
              {isFloating ? (
                <div className="p-3 text-sm text-slate-600">Inspector is floating. Click Dock to return.</div>
              ) : (
                <InspectorPanel embedded showHeader onFloat={handleFloat} />
              )}
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
