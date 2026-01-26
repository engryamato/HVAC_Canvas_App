'use client';

import React from 'react';
import { BOMPanel } from './BOMPanel';
import { InspectorPanel } from './Inspector/InspectorPanel';
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

  if (!isOpen) {
    return null;
  }

  return (
    <aside className={`right-sidebar ${className}`} data-testid="right-sidebar">
      <div className="border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveRightTab('properties')}
            className={`rounded px-2 py-1 text-sm transition-colors ${
              activeRightTab === 'properties'
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid="tab-properties"
          >
            Properties
          </button>
          <button
            type="button"
            onClick={() => setActiveRightTab('bom')}
            className={`rounded px-2 py-1 text-sm transition-colors ${
              activeRightTab === 'bom' ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid="tab-bom"
          >
            BOM
          </button>
          <button
            type="button"
            onClick={() => setActiveRightTab('calculations')}
            className={`rounded px-2 py-1 text-sm transition-colors ${
              activeRightTab === 'calculations'
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid="tab-calculations"
          >
            Calculations
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        {activeRightTab === 'properties' && (
          <section className="sidebar-section" data-testid="properties-panel">
            <InspectorPanel embedded />
          </section>
        )}

        {activeRightTab === 'bom' && (
          <section className="sidebar-section" data-testid="bom-panel">
            <h3 className="sidebar-title">Bill of Quantities</h3>
            <BOMPanel />
          </section>
        )}

        {activeRightTab === 'calculations' && (
          <section className="sidebar-section" data-testid="calculations-panel">
            <h3 className="sidebar-title">Calculations</h3>
            <div className="sidebar-empty">Calculation details will appear here.</div>
          </section>
        )}
      </div>

      {onClose && (
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          Close
        </button>
      )}
    </aside>
  );
}

export default RightSidebar;
