'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useViewportStore } from '@/stores/useViewportStore';

interface StatusBarProps {
    entityCount?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ entityCount = 0 }) => {
    const { zoom } = useViewportStore();

    return (
        <Card
            className="h-8 bg-slate-100 border-t flex items-center px-4 text-xs text-slate-600 gap-4 rounded-none"
            data-testid="status-bar"
        >
            <div>
                <span className="font-medium">Entities:</span> {entityCount}
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
                <span className="font-medium">Zoom:</span> {zoom}%
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
                <span className="font-medium">Cursor:</span> (0, 0)
            </div>
        </Card>
    );
};
