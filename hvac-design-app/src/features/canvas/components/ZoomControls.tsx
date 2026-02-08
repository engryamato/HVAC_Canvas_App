'use client';

import React, { useCallback } from 'react';
import { useZoom, useGridVisible, useViewportActions } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useShallow } from 'zustand/react/shallow';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_PRESETS } from '@/core/constants/viewport';
import type { Entity } from '@/core/schema';
import { ZoomIn, ZoomOut, Maximize2, Grid3X3 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
 * Glassmorphism zoom control panel with refined buttons and dropdown
 */
export function ZoomControls({ className = '' }: ZoomControlsProps): React.ReactElement {
    const zoom = useZoom();
    const gridVisible = useGridVisible();
    const { zoomIn, zoomOut, fitToContent, toggleGrid, zoomTo } = useViewportActions();
    const entities = useEntityStore(
        useShallow((state) =>
            state.allIds.map((id) => state.byId[id]).filter((e): e is Entity => e !== undefined)
        )
    );

    const handleZoomIn = useCallback(() => zoomIn(), [zoomIn]);
    const handleZoomOut = useCallback(() => zoomOut(), [zoomOut]);
    const handleToggleGrid = useCallback(() => toggleGrid(), [toggleGrid]);

    const handleZoomPresetChange = useCallback((value: string) => {
        const level = parseFloat(value);
        if (!isNaN(level)) {
            zoomTo(level);
        }
    }, [zoomTo]);

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
            // Target main canvas, not minimap
            const canvasElement = document.querySelector('canvas:not([data-minimap])');
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

    // Find closest preset value for display
    const getCurrentValue = () => {
        const closest = ZOOM_PRESETS.find(p => Math.abs(p - zoom) < 0.01);
        return closest !== undefined ? closest.toString() : zoom.toString();
    };

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

            {/* Zoom Percentage Dropdown */}
            <Select value={getCurrentValue()} onValueChange={handleZoomPresetChange}>
                <SelectTrigger
                    data-testid="zoom-level"
                    className="min-w-[52px] h-8 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 bg-transparent"
                    aria-label={`Current zoom: ${zoomPercentage}%`}
                >
                    <SelectValue placeholder={`${zoomPercentage}%`}>
                        {zoomPercentage}%
                    </SelectValue>
                </SelectTrigger>
                <SelectContent
                    position="popper"
                    side="top"
                    className="bg-white/95 backdrop-blur-sm border-slate-200 min-w-[80px]"
                >
                    {ZOOM_PRESETS.map((preset) => (
                        <SelectItem
                            key={preset}
                            value={preset.toString()}
                            className="text-xs focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                        >
                            {Math.round(preset * 100)}%
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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

            {/* Toggle Grid */}
            <button
                type="button"
                onClick={handleToggleGrid}
                data-testid="grid-toggle"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 ${
                    gridVisible
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-label="Toggle grid"
                aria-pressed={gridVisible}
                title="Toggle grid"
            >
                <Grid3X3 className="w-4 h-4" />
            </button>

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
