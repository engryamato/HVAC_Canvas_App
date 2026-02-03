'use client';

import React from 'react';
import { useZoom, useSnapToGrid, useGridVisible } from '../store/viewportStore';
import { useSelectionCount } from '../store/selectionStore';
import { useCursorStore } from '../store/cursorStore';

/**
 * StatusBar - Canvas status bar showing cursor position and zoom
 *
 * Features:
 * - Mouse position in canvas coordinates
 * - Current zoom level
 * - Grid visibility indicator
 * - Grid snap indicator
 * - Selected entity count
 */

interface StatusBarProps {
  /** Optional mouse position in canvas coordinates (if not provided, uses cursorStore) */
  mousePosition?: { x: number; y: number } | null;
  className?: string;
}

export function StatusBar({ mousePosition: propMousePosition, className = '' }: StatusBarProps): React.ReactElement {
  const zoom = useZoom();
  const snapToGrid = useSnapToGrid();
  const gridVisible = useGridVisible();
  const selectionCount = useSelectionCount();
  const lastCanvasPoint = useCursorStore((state) => state.lastCanvasPoint);

  const mousePosition = propMousePosition !== undefined ? propMousePosition : lastCanvasPoint;

  const zoomPercentage = Math.round(zoom * 100);

  // Format position with no decimal places (using Math.round)
  const formatPosition = (value: number): string => {
    return Math.round(value).toString();
  };

  return (
    <div
      className={`flex items-center justify-between h-8 px-3 bg-slate-100 border-t border-gray-200 text-xs text-slate-600 select-none ${className}`}
      role="status"
      aria-live="polite"
      data-testid="status-bar"
    >
      {/* Left section: Mouse position */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1" aria-label="Mouse position">
          {mousePosition ? (
            <span className="font-mono font-medium text-slate-900">
              X: {formatPosition(mousePosition.x)} Y: {formatPosition(mousePosition.y)}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </div>

      {/* Center section: Zoom, Grid visibility, and Snap status */}
      <div className="flex items-center gap-4">
        {/* Zoom level */}
        <div className="flex items-center gap-1" aria-label="Zoom level">
          <span className="text-slate-600">Zoom:</span>{' '}
          <span className="font-mono font-medium text-slate-900">{zoomPercentage}%</span>
        </div>

        <div className="h-4 w-px bg-slate-300" />

        {/* Grid visibility indicator */}
        <div
          className={`flex items-center gap-1 ${gridVisible ? 'text-blue-600' : 'text-gray-400'}`}
          title={gridVisible ? 'Grid visible' : 'Grid hidden'}
        >
          <span>Grid: {gridVisible ? 'On' : 'Off'}</span>
        </div>

        <div className="h-4 w-px bg-slate-300" />

        {/* Grid snap indicator */}
        <div
          className={`flex items-center gap-1 ${snapToGrid ? 'text-blue-600' : 'text-gray-400'}`}
          title={snapToGrid ? 'Snap to grid enabled' : 'Snap to grid disabled'}
        >
          <span>Snap: {snapToGrid ? 'On' : 'Off'}</span>
        </div>
      </div>

      {/* Right section: Selection count */}
      <div className="flex items-center gap-4">
        {/* Selection count */}
        <div className="flex items-center gap-1" aria-label="Selected entities">
          {selectionCount === 0 ? (
            <span>No selection</span>
          ) : selectionCount === 1 ? (
            <span className="font-mono font-medium text-slate-900">1 entity selected</span>
          ) : (
            <span className="font-mono font-medium text-slate-900">{selectionCount} entities selected</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
