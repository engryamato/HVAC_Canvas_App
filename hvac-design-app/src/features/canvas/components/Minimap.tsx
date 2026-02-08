'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useViewportStore, usePanAndZoom } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useShallow } from 'zustand/react/shallow';
import type { Entity } from '@/core/schema';

// Entity colors for minimap rendering
const ENTITY_COLORS: Record<string, string> = {
    room: '#E3F2FD',     // Light blue
    duct: '#3b82f6',     // Technical Blue
    equipment: '#FFF9C4', // Yellow
    fitting: '#E8F5E9',  // Light green
    note: '#FFF9C4',     // Yellow
    group: '#E8E8E8',    // Light gray
} as const;

// Entity dimension defaults for minimap
const ENTITY_DIMENSIONS: Record<string, { width: number; height: number }> = {
    room: { width: 200, height: 200 },
    duct: { width: 100, height: 50 },
    equipment: { width: 50, height: 50 },
    fitting: { width: 30, height: 30 },
    note: { width: 100, height: 50 },
    group: { width: 50, height: 50 },
};

function getEntityDimensions(entity: Entity): { width: number; height: number } {
    if (entity.type === 'room') {
        return { width: entity.props.width, height: entity.props.length };
    }
    if (entity.type === 'equipment') {
        return { width: entity.props.width, height: entity.props.height };
    }
    if (entity.type === 'duct') {
        if (entity.props.shape === 'rectangular') {
            return { width: entity.props.width ?? 100, height: entity.props.height ?? 100 };
        }
        const diameter = entity.props.diameter ?? 100;
        return { width: diameter, height: diameter };
    }
    return ENTITY_DIMENSIONS[entity.type] || { width: 50, height: 50 };
}

interface MinimapProps {
    onUndock?: () => void;
}

// Minimap dimensions
const MINIMAP_WIDTH = 128;
const MINIMAP_HEIGHT = 80;
const MINIMAP_PADDING = 8;

export function Minimap({ onUndock }: MinimapProps): React.ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { panX, panY, zoom } = usePanAndZoom();
    const entities = useEntityStore(
        useShallow((state) =>
            state.allIds.map((id) => state.byId[id]).filter((e): e is Entity => e !== undefined)
        )
    );
    const { setPan } = useViewportStore();

    // Calculate world bounds from all entities
    const calculateWorldBounds = useCallback(() => {
        if (entities.length === 0) {
            return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
        }

        return entities.reduce(
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
    }, [entities]);

    // Render minimap
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {return;}

        const ctx = canvas.getContext('2d');
        if (!ctx) {return;}

        // Get device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = MINIMAP_WIDTH * dpr;
        canvas.height = MINIMAP_HEIGHT * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Calculate world bounds
        const worldBounds = calculateWorldBounds();
        const worldWidth = Math.max(worldBounds.maxX - worldBounds.minX, 100);
        const worldHeight = Math.max(worldBounds.maxY - worldBounds.minY, 100);

        // Calculate scale to fit world in minimap (with padding)
        const availableWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
        const availableHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;
        const scale = Math.min(
            availableWidth / worldWidth,
            availableHeight / worldHeight
        );

        // Calculate offset to center world in minimap
        const offsetX = MINIMAP_PADDING + (availableWidth - worldWidth * scale) / 2;
        const offsetY = MINIMAP_PADDING + (availableHeight - worldHeight * scale) / 2;

        // Transform function: world coords to minimap coords
        const worldToMinimap = (wx: number, wy: number) => ({
            x: offsetX + (wx - worldBounds.minX) * scale,
            y: offsetY + (wy - worldBounds.minY) * scale,
        });

        // Render entities as simplified rectangles
        entities.forEach((entity) => {
            const { x, y } = entity.transform;
            const { width, height } = getEntityDimensions(entity);
            const pos = worldToMinimap(x, y);

            ctx.fillStyle = ENTITY_COLORS[entity.type] || '#E8E8E8';
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 0.5;

            ctx.fillRect(pos.x, pos.y, width * scale, height * scale);
            ctx.strokeRect(pos.x, pos.y, width * scale, height * scale);
        });

        // Calculate viewport rectangle in world coordinates
        // Viewport shows what's visible on screen
        const viewportWorldX = -panX / zoom;
        const viewportWorldY = -panY / zoom;
        
        // Get actual canvas element dimensions for viewport size
        let canvasWidth = 800;
        let canvasHeight = 600;
        if (typeof document !== 'undefined') {
            const mainCanvas = document.querySelector('canvas:not([data-minimap])');
            if (mainCanvas) {
                const rect = mainCanvas.getBoundingClientRect();
                canvasWidth = rect.width;
                canvasHeight = rect.height;
            }
        }
        
        const viewportWorldWidth = canvasWidth / zoom;
        const viewportWorldHeight = canvasHeight / zoom;

        // Convert viewport to minimap coordinates
        const vpTopLeft = worldToMinimap(viewportWorldX, viewportWorldY);
        const vpWidth = viewportWorldWidth * scale;
        const vpHeight = viewportWorldHeight * scale;

        // Draw viewport rectangle
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Technical Blue at 10%
        ctx.fillRect(vpTopLeft.x, vpTopLeft.y, vpWidth, vpHeight);
        
        ctx.strokeStyle = '#3b82f6'; // Technical Blue
        ctx.lineWidth = 2;
        ctx.strokeRect(vpTopLeft.x, vpTopLeft.y, vpWidth, vpHeight);

    }, [entities, panX, panY, zoom, calculateWorldBounds]);

    // Handle click to jump viewport
    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) {return;}

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Calculate world bounds
        const worldBounds = calculateWorldBounds();
        const worldWidth = Math.max(worldBounds.maxX - worldBounds.minX, 100);
        const worldHeight = Math.max(worldBounds.maxY - worldBounds.minY, 100);

        // Calculate scale and offset (same as render)
        const availableWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
        const availableHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;
        const scale = Math.min(
            availableWidth / worldWidth,
            availableHeight / worldHeight
        );
        const offsetX = MINIMAP_PADDING + (availableWidth - worldWidth * scale) / 2;
        const offsetY = MINIMAP_PADDING + (availableHeight - worldHeight * scale) / 2;

        // Convert minimap click to world coordinates
        const worldX = worldBounds.minX + (clickX - offsetX) / scale;
        const worldY = worldBounds.minY + (clickY - offsetY) / scale;

        // Get current viewport dimensions
        let canvasWidth = 800;
        let canvasHeight = 600;
        if (typeof document !== 'undefined') {
            const mainCanvas = document.querySelector('canvas:not([data-minimap])');
            if (mainCanvas) {
                const canvasRect = mainCanvas.getBoundingClientRect();
                canvasWidth = canvasRect.width;
                canvasHeight = canvasRect.height;
            }
        }

        // Center viewport on clicked location
        const newPanX = canvasWidth / 2 - worldX * zoom;
        const newPanY = canvasHeight / 2 - worldY * zoom;

        setPan(newPanX, newPanY);
    }, [calculateWorldBounds, zoom, setPan]);

    return (
        <div
            className="flex flex-col gap-1.5 bg-white border border-slate-200 rounded-lg shadow-sm p-1.5"
            data-testid="minimap"
            role="group"
            aria-label="Minimap navigation"
        >
            {/* Minimap header with undock */}
            {onUndock && (
                <div className="flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onUndock}
                        data-testid="minimap-undock"
                        className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        aria-label="Undock minimap"
                        title="Undock minimap"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                        </svg>
                    </button>
                </div>
            )}
            <canvas
                ref={canvasRef}
                data-minimap="true"
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                className="w-32 h-20 rounded cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all"
                style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
                onClick={handleClick}
                aria-label="Click to navigate canvas"
                title="Click to navigate to location"
            />
        </div>
    );
}

export default Minimap;
