'use client';

import React from 'react';
import { useZoom, useSnapToGrid, useGridSize } from '../store/viewportStore';
import { useSelectionCount } from '../store/selectionStore';
import { useCursorStore } from '../store/cursorStore';
import { useIsDirty } from '@/core/store/project.store';
import { useEntityCount } from '@/core/store/entityStore';

/**
 * StatusBar - Canvas status bar showing cursor position and zoom
 *
 * Features:
 * - Mouse position in canvas coordinates
 * - Current zoom level
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
  const gridSize = useGridSize();
  const selectionCount = useSelectionCount();
  const lastCanvasPoint = useCursorStore((state) => state.lastCanvasPoint);

  const mousePosition = propMousePosition !== undefined ? propMousePosition : lastCanvasPoint;

  const zoomPercentage = Math.round(zoom * 100);
  const isDirty = useIsDirty();
  const entityCount = useEntityCount();

  // Format position with 1 decimal place
  const formatPosition = (value: number): string => {
    return value.toFixed(1);
  };

  return (
    <div
      className={`flex items-center justify-between h-6 px-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 select-none ${className}`}
      role="status"
      aria-live="polite"
      data-testid="status-bar"
    >
      {/* Left section: Mouse position and Entity count */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1" aria-label="Mouse position">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
          {mousePosition ? (
            <span>
              X: {formatPosition(mousePosition.x)}, Y: {formatPosition(mousePosition.y)}
            </span>
          ) : (
            <span className="text-gray-400">---, ---</span>
          )}
        </div>

        <div className="h-3 w-px bg-gray-300 mx-1" />

        <div className="flex items-center gap-1" aria-label="Entity count">
          <span>{entityCount} items</span>
        </div>
      </div>

      {/* Center section: Grid and Save info */}
      <div className="flex items-center gap-6">
        {/* Grid snap indicator */}
        <div
          className={`flex items-center gap-1 ${snapToGrid ? 'text-blue-600' : 'text-gray-400'}`}
          title={snapToGrid ? `Snap to grid (${gridSize}px)` : 'Grid snap disabled'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span className="text-gray-400">Grid:</span>{' '}
          <span>{snapToGrid ? 'SNAP' : 'FREE'}</span>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <span className={isDirty ? 'text-amber-700' : 'text-emerald-700'}>
            {isDirty ? 'Unsaved changes' : 'Saved'}
          </span>
        </div>
      </div>

      {/* Right section: Selection count, Connection, and zoom */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-1 text-emerald-600" aria-label="Connection status">
          <span className="text-[10px]">●</span>
          <span>Online</span>
        </div>

        <div className="h-3 w-px bg-gray-300 mx-1" />

        {/* Selection count */}
        {selectionCount > 0 && (
          <div className="flex items-center gap-1 text-blue-600" aria-label="Selected entities">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{selectionCount} selected</span>
          </div>
        )}

        {/* Zoom level */}
        <div className="flex items-center gap-1" aria-label="Zoom level">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="text-gray-400">Zoom:</span>{' '}
          <span>{zoomPercentage}%</span>
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
