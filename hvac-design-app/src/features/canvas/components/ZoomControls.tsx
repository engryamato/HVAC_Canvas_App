'use client';

import React, { useCallback } from 'react';
import { useZoom, useViewportActions } from '../store/viewportStore';
import { MIN_ZOOM, MAX_ZOOM } from '@/core/constants/viewport';

/**
 * ZoomControls - Zoom control UI component
 *
 * Features:
 * - Zoom in/out buttons
 * - Zoom percentage display
 * - Reset to 100% button
 * - Fit to canvas option
 */

interface ZoomControlsProps {
  className?: string;
}

export function ZoomControls({ className = '' }: ZoomControlsProps): React.ReactElement {
  const zoom = useZoom();
  const { zoomIn, zoomOut, resetView } = useViewportActions();

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleReset = useCallback(() => {
    resetView();
  }, [resetView]);

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  return (
    <div
      className={`flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1 ${className}`}
      role="group"
      aria-label="Zoom controls"
    >
      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom out"
        title="Zoom out"
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
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      {/* Zoom Percentage Display */}
      <button
        type="button"
        onClick={handleReset}
        className="min-w-[60px] h-8 px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
        aria-label={`Current zoom: ${zoomPercentage}%. Click to reset to 100%`}
        title="Reset to 100%"
      >
        {zoomPercentage}%
      </button>

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom in"
        title="Zoom in"
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
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
    </div>
  );
}

export default ZoomControls;
