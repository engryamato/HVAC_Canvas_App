'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/stores/useToolStore';
import { useViewportStore } from '@/stores/useViewportStore';
import {
    MousePointer2,
    Move,
    Box,
    Type,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Undo,
    Redo,
} from 'lucide-react';

export const Toolbar: React.FC = () => {
    const { activeTool, setActiveTool } = useToolStore();
    const { zoom, setZoom, fitToScreen } = useViewportStore();

    const tools = [
        { id: 'select', label: 'Select', icon: MousePointer2 },
        { id: 'duct', label: 'Duct', icon: Move },
        { id: 'equipment', label: 'Equipment', icon: Box },
        { id: 'text', label: 'Text', icon: Type },
    ] as const;

    return (
        <Card
            className="h-12 bg-white border-b flex items-center px-4 gap-4 rounded-none"
            data-testid="toolbar"
        >
            {/* Tool Selection */}
            <div className="flex gap-1">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <Button
                            key={tool.id}
                            variant={activeTool === tool.id ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTool(tool.id)}
                            className="gap-1"
                            data-testid={`tool-${tool.id}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tool.label}
                        </Button>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    data-testid="zoom-out"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center" data-testid="zoom-level">{zoom}%</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(400, zoom + 25))}
                    data-testid="zoom-in"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={fitToScreen} data-testid="zoom-fit">
                    <Maximize2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* Undo/Redo */}
            <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled data-testid="undo">
                    <Undo className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled data-testid="redo">
                    <Redo className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
};
