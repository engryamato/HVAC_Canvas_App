'use client';

import { GridSettings } from './GridSettings';

interface BottomToolbarProps {
  className?: string;
}

export function BottomToolbar({ className = '' }: BottomToolbarProps) {
  return (
    <div className={`bottom-toolbar ${className}`} data-testid="bottom-toolbar">
      <div className="bottom-toolbar-section">
        <span className="bottom-toolbar-title">Canvas Settings</span>
        <GridSettings />
      </div>
    </div>
  );
}

export default BottomToolbar;

