'use client';

import React, { useCallback } from 'react';
import { useZoom, useViewportActions } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useShallow } from 'zustand/react/shallow';
import { MIN_ZOOM, MAX_ZOOM } from '@/core/constants/viewport';
import type { Entity } from '@/core/schema';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ENTITY_DIMENSIONS = {
    room: { width: 200, height: 200 },
    duct: { width: 100, height: 50 },
    equipment: { width: 50, height: 50 },
    fitting: { width: 30, height: 30 },
    note: { width: 100, height: 50 },
    group: { width: 50, height: 50 },
} as const;

function getEntityDimensions(entity: Entity): { width: number; height: number } {
    return ENTITY_DIMENSIONS[entity.type] || { width: 50, height: 50 };
}

interface ZoomControlsProps {
    className?: string;
}

/**
 * ZoomControls - Modern Engineering Design 2025
 * Glassmorphism zoom control panel with refined buttons
 */
export function ZoomControls({ className = '' }: ZoomControlsProps): React.ReactElement {
    const zoom = useZoom();
    const { zoomIn, zoomOut, resetView, fitToContent } = useViewportActions();
    const entities = useEntityStore(
        useShallow((state) =>
            state.allIds.map((id) => state.byId[id]).filter((e): e is Entity => e !== undefined)
        )
    );

    const handleZoomIn = useCallback(() => zoomIn(), [zoomIn]);
    const handleZoomOut = useCallback(() => zoomOut(), [zoomOut]);
    const handleReset = useCallback(() => resetView(), [resetView]);

    const handleFitToContent = useCallback(() => {
        if (entities.length === 0) { return; }

        const { minX, minY, maxX, maxY } = entities.reduce(
            (bounds, entity) => {
                const { x, y } = entity.transform;
                const { width, height } = getEntityDimensions(entity);
                return {
                    minX: Math.min(bounds.minX, x),
                    minY: Math.min(bounds.minY, y),
                    maxX: Math.max(bounds.maxX, x + width),
                    maxY: Math.max(bounds.maxY, y + height),
                };
            },
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const MIN_BOUNDS = 100;
        const bounds = {
            x: minX,
            y: minY,
            width: Math.max(boundsWidth, MIN_BOUNDS),
            height: Math.max(boundsHeight, MIN_BOUNDS),
        };

        let canvasDimensions: { width: number; height: number } | undefined;
        if (typeof document !== 'undefined') {
            const canvasElement = document.querySelector('canvas');
            if (canvasElement) {
                const rect = canvasElement.getBoundingClientRect();
                canvasDimensions = { width: rect.width, height: rect.height };
            }
        }

        fitToContent(bounds, canvasDimensions);
    }, [entities, fitToContent]);

    const zoomPercentage = Math.round(zoom * 100);
    const canZoomIn = zoom < MAX_ZOOM;
    const canZoomOut = zoom > MIN_ZOOM;
    const hasEntities = entities.length > 0;

    return (
        <div
            className={`flex items-center gap-0.5 bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-lg p-1 ${className}`}
            aria-label="Zoom controls"
            data-testid="zoom-control"
        >
            {/* Zoom Out */}
            <button
                type="button"
                onClick={handleZoomOut}
                disabled={!canZoomOut}
                data-testid="zoom-out"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                aria-label="Zoom out"
                title="Zoom out"
            >
                <ZoomOut className="w-4 h-4" />
            </button>

            {/* Zoom Percentage */}
            <button
                type="button"
                onClick={handleReset}
                data-testid="zoom-level"
                className="min-w-[52px] h-8 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                aria-label={`Current zoom: ${zoomPercentage}%. Click to reset`}
                title="Reset to 100%"
            >
                {zoomPercentage}%
            </button>

            {/* Zoom In */}
            <button
                type="button"
                onClick={handleZoomIn}
                disabled={!canZoomIn}
                data-testid="zoom-in"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                aria-label="Zoom in"
                title="Zoom in"
            >
                <ZoomIn className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Fit to Content */}
            <button
                type="button"
                onClick={handleFitToContent}
                disabled={!hasEntities}
                data-testid="zoom-fit"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                aria-label="Fit to content"
                title="Fit to content"
            >
                <Maximize2 className="w-4 h-4" />
            </button>
        </div>
    );
}

export default ZoomControls;
