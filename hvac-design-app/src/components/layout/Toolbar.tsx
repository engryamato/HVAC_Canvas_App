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
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(400, zoom + 25))}
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={fitToScreen}>
                    <Maximize2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* Undo/Redo */}
            <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled>
                    <Undo className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled>
                    <Redo className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
};
