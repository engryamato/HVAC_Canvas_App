'use client';

import React from 'react';
import { useViewportStore } from '../store/viewportStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';

/**
 * Grid size options with labels for display
 */
const GRID_SIZES = [
  { label: '1/8"', value: 12 }, // 12 pixels = 1/8 inch at 96 DPI
  { label: '1/4"', value: 24 }, // 24 pixels = 1/4 inch
  { label: '1/2"', value: 48 }, // 48 pixels = 1/2 inch
  { label: '1"', value: 96 }, // 96 pixels = 1 inch
] as const;

interface GridSettingsProps {
  className?: string;
}

/**
 * Grid settings component for controlling grid visibility, snap, and size.
 */
export function GridSettings({ className }: GridSettingsProps) {
  const { gridVisible, gridSize, toggleGrid, setGridSize, snapToGrid } = useViewportStore();
  const setSnapToGrid = usePreferencesStore((state) => state.setSnapToGrid);

  return (
    <div className={`flex items-center gap-4 p-2 bg-gray-100 rounded ${className || ''}`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={gridVisible}
          onChange={toggleGrid}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Show Grid</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={snapToGrid}
          onChange={(event) => setSnapToGrid(event.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Snap to Grid</span>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Grid Size:</span>
        <select
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          disabled={!gridVisible}
        >
          {GRID_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default GridSettings;
