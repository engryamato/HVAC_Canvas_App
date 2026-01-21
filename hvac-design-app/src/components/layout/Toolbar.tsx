'use client';

import React, { useEffect } from 'react';
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
    Undo,
    Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EquipmentTypeSelector } from '@/components/canvas/EquipmentTypeSelector';
import { FittingTypeSelector } from '@/components/canvas/FittingTypeSelector';

/**
 * Toolbar - Modern Engineering Design 2025
 * Clean tool selection bar with visual grouping and shortcuts
 */
export const Toolbar: React.FC = () => {
    const { currentTool: activeTool, setTool: setActiveTool } = useToolStore();
    const { toggleGrid } = useViewportStore();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
                e.preventDefault();
                toggleGrid();
                return;
            }

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
        <div
            className="h-11 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0"
            data-testid="toolbar"
        >
            {/* Tool Selection */}
            <div className="flex gap-0.5 bg-slate-100 p-1 rounded-lg" role="toolbar" aria-label="Drawing tools">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                                isActive
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                            )}
                            data-testid={`tool-${tool.id}`}
                            aria-label={tool.label}
                            aria-pressed={isActive}
                            title={`${tool.label} (${tool.shortcut})`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden lg:inline text-xs">{tool.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Conditional Type Selectors */}
            {activeTool === 'equipment' && <EquipmentTypeSelector />}
            {activeTool === 'fitting' && <FittingTypeSelector />}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Undo/Redo Group */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg" role="group" aria-label="History">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    data-testid="undo-button"
                    aria-label="Undo"
                    title="Undo (Ctrl+Z)"
                    className="h-7 w-7 p-0 rounded-md"
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
                    className="h-7 w-7 p-0 rounded-md"
                >
                    <Redo className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
