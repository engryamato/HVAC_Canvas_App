'use client';

import React from 'react';
import { useViewportStore } from '@/stores/useViewportStore';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityCount } from '@/core/store/entityStore';
import { cn } from '@/lib/utils';
import { WifiOff, Grid3X3, MousePointer2 } from 'lucide-react';

interface StatusBarProps {
    isConnected?: boolean;
}

/**
 * StatusBar - Modern Engineering Design 2025
 * Clean status bar with refined typography and visual indicators
 */
export const StatusBar: React.FC<StatusBarProps> = ({
    isConnected = true
}) => {
    const { zoom, cursorPosition, gridVisible } = useViewportStore();
    const { currentTool } = useToolStore();
    const entityCount = useEntityCount();

    const coords = `${Math.round(cursorPosition.x)}, ${Math.round(cursorPosition.y)}`;

    return (
        <footer
            className="h-7 bg-slate-50 border-t border-slate-200 flex items-center px-4 text-xs justify-between shrink-0"
            data-testid="status-bar"
        >
            <div className="flex items-center gap-4">
                {/* Coordinates */}
                <div 
                    className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] min-w-[90px]" 
                    title="Cursor Coordinates"
                >
                    <span className="text-slate-400">X,Y:</span>
                    <span className="text-slate-700">{coords}</span>
                </div>

                <div className="h-3 w-px bg-slate-200" />

                {/* Active Tool */}
                <div className="flex items-center gap-1.5" title="Active Tool">
                    <MousePointer2 className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600">
                        {currentTool === 'select' ? 'Ready' : `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}`}
                    </span>
                </div>

                <div className="h-3 w-px bg-slate-200" />

                {/* Zoom Level */}
                <div className="flex items-center gap-1" title="Zoom Level">
                    <span className="text-slate-400">Zoom</span>
                    <span className="font-semibold text-slate-700">{zoom}%</span>
                </div>

                <div className="h-3 w-px bg-slate-200" />

                {/* Grid Status */}
                <div className="flex items-center gap-1.5" title="Grid Status">
                    <Grid3X3 className={cn(
                        "w-3 h-3",
                        gridVisible ? "text-blue-500" : "text-slate-300"
                    )} />
                    <span className={cn(
                        "font-medium",
                        gridVisible ? "text-blue-600" : "text-slate-400"
                    )}>
                        {gridVisible ? 'Grid On' : 'Grid Off'}
                    </span>
                </div>

                <div className="h-3 w-px bg-slate-200" />

                {/* Entity Count */}
                <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{entityCount}</span>
                    <span className="text-slate-400">items</span>
                </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-1.5">
                {isConnected ? (
                    <>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-600 font-medium">Online</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-3 h-3 text-red-500" />
                        <span className="text-red-600 font-medium">Offline</span>
                    </>
                )}
            </div>
        </footer>
    );
};
