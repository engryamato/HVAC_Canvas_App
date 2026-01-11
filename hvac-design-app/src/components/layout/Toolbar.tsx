'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/core/store/canvas.store';
import { useViewportStore } from '@/stores/useViewportStore';
import {
    MousePointer2,
    Square,
    Move,
    Box,
    Circle,
    StickyNote,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Undo,
    Redo,
    Grid,
} from 'lucide-react';

export const Toolbar: React.FC = () => {
    const { currentTool: activeTool, setTool: setActiveTool } = useToolStore();
    const { zoom, setZoom, fitToScreen, toggleGrid, gridVisible } = useViewportStore();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input/textarea focused
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Grid toggle (Ctrl+G)
            if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
                e.preventDefault();
                toggleGrid();
                return;
            }

            // Tool shortcuts (matching E2E expectations)
            switch (e.key.toLowerCase()) {
                case 'v': setActiveTool('select'); break;
                case 'r': setActiveTool('room'); break;
                case 'd': setActiveTool('duct'); break;
                case 'e': setActiveTool('equipment'); break;
                case 'f': setActiveTool('fitting'); break;
                case 'n': setActiveTool('note'); break;
                case 'escape': setActiveTool('select'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool, toggleGrid]);

    const tools = [
        { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V' },
        { id: 'room', label: 'Room', icon: Square, shortcut: 'R' },
        { id: 'duct', label: 'Duct', icon: Move, shortcut: 'D' },
        { id: 'equipment', label: 'Equipment', icon: Box, shortcut: 'E' },
        { id: 'fitting', label: 'Fitting', icon: Circle, shortcut: 'F' },
        { id: 'note', label: 'Note', icon: StickyNote, shortcut: 'N' },
    ] as const;

    return (
        <Card
            className="h-12 bg-white border-b flex items-center px-4 gap-4 rounded-none"
            data-testid="toolbar"
        >
            {/* Tool Selection */}
            <div className="flex gap-1" role="toolbar" aria-label="Drawing tools">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                        <Button
                            key={tool.id}
                            variant={isActive ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTool(tool.id)}
                            className={`gap-1 ${isActive ? 'active' : ''}`}
                            data-testid={`tool-${tool.id}`}
                            aria-label={tool.label}
                            aria-pressed={isActive}
                            title={`${tool.label} (${tool.shortcut})`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tool.label}</span>
                        </Button>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* View Controls */}
            <div className="flex items-center gap-2" role="group" aria-label="View controls">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    data-testid="zoom-out"
                    aria-label="Zoom out"
                    title="Zoom Out (Ctrl+-)"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>

                <span className="text-sm font-medium w-12 text-center select-none" data-testid="zoom-level">
                    {zoom}%
                </span>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(400, zoom + 25))}
                    data-testid="zoom-in"
                    aria-label="Zoom in"
                    title="Zoom In (Ctrl++)"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fitToScreen}
                    data-testid="zoom-fit"
                    aria-label="Fit to screen"
                    title="Fit to Screen"
                >
                    <Maximize2 className="w-4 h-4" />
                </Button>

                <Button
                    variant={gridVisible ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={toggleGrid}
                    data-testid="grid-toggle"
                    aria-label="Toggle grid"
                    aria-pressed={gridVisible}
                    title="Toggle Grid (Ctrl+G)"
                    className={gridVisible ? 'bg-slate-100' : ''}
                >
                    <Grid className="w-4 h-4" />
                </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* Undo/Redo */}
            <div className="flex gap-1" role="group" aria-label="History">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    data-testid="undo-button"
                    aria-label="Undo"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    data-testid="redo-button"
                    aria-label="Redo"
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <Redo className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
};
