'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useViewportStore } from '@/stores/useViewportStore';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityCount } from '@/core/store/entityStore';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, otherwise standard class strings

interface StatusBarProps {
    isConnected?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    isConnected = true
}) => {
    const { zoom, cursorPosition, gridVisible } = useViewportStore();
    const { currentTool } = useToolStore();
    const entityCount = useEntityCount();

    // Format coordinates
    const coords = `X: ${Math.round(cursorPosition.x)}, Y: ${Math.round(cursorPosition.y)}`;

    return (
        <Card
            className="h-8 bg-slate-100 border-t flex items-center px-4 text-xs text-slate-600 justify-between rounded-none shrink-0"
            data-testid="status-bar"
        >
            <div className="flex items-center gap-4">
                <div className="min-w-[120px] font-mono" title="Cursor Coordinates">
                    {coords}
                </div>

                <div className="h-3 w-px bg-slate-300" />

                <div title="Active Tool">
                    {currentTool === 'select' ? 'Ready' : `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Tool`}
                </div>

                <div className="h-3 w-px bg-slate-300" />

                <div title="Zoom Level">
                    Zoom: <span className="font-medium text-slate-900">{zoom}%</span>
                </div>

                <div className="h-3 w-px bg-slate-300" />

                <div title="Grid Status">
                    Grid: <span className={cn("font-medium", gridVisible ? "text-slate-900" : "text-slate-400")}>
                        {gridVisible ? 'On' : 'Off'}
                    </span>
                </div>

                <div className="h-3 w-px bg-slate-300" />

                <div>
                    <span className="font-medium text-slate-900">{entityCount}</span> items
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className={isConnected ? "text-slate-700" : "text-red-600"}>
                    {isConnected ? 'Online' : 'Offline'}
                </span>
            </div>
        </Card>
    );
};
