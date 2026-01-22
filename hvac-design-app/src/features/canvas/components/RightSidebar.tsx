'use client';

import React from 'react';
import { BOMPanel } from './BOMPanel';

interface RightSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function RightSidebar({ isOpen = true, onClose, className = '' }: RightSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className={`right-sidebar ${className}`} data-testid="right-sidebar">
      <div className="sidebar-content">
        <section className="sidebar-section">
          <h3 className="sidebar-title">Bill of Quantities</h3>
          <BOMPanel />
        </section>

        <section className="sidebar-section">
          <h3 className="sidebar-title">Calculations</h3>
          <div className="sidebar-empty">Calculation details will appear here.</div>
        </section>
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
