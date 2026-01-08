'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ChevronLeft, Search } from 'lucide-react';

export const LeftSidebar: React.FC = () => {
    const { leftSidebarCollapsed, toggleLeftSidebar } = useLayoutStore();

    // Keyboard shortcut: Ctrl+B
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'b' || e.key === 'B' || e.code === 'KeyB')) {
                e.preventDefault();
                toggleLeftSidebar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleLeftSidebar]);

    if (leftSidebarCollapsed) {
        return (
            <div
                className="w-12 bg-white border-r flex flex-col items-center pt-4"
                data-testid="left-sidebar"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLeftSidebar}
                    data-testid="left-sidebar-toggle"
                >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>
            </div>
        );
    }

    return (
        <aside
            className="w-64 bg-white border-r flex flex-col"
            data-testid="left-sidebar"
        >
            {/* Header */}
            <div className="h-12 border-b flex items-center justify-between px-4">
                <h3 className="font-semibold text-sm">Equipment Library</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLeftSidebar}
                    data-testid="left-sidebar-toggle"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search equipment..." className="pl-8" />
                </div>
            </div>

            {/* Equipment List */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                    <div className="p-3 border rounded hover:bg-blue-50 cursor-move transition-colors">
                        <div className="font-medium text-sm">Air Handler Unit</div>
                        <div className="text-xs text-slate-500">AHU</div>
                    </div>
                    <div className="p-3 border rounded hover:bg-blue-50 cursor-move transition-colors">
                        <div className="font-medium text-sm">VAV Box</div>
                        <div className="text-xs text-slate-500">Variable Air Volume</div>
                    </div>
                    <div className="p-3 border rounded hover:bg-blue-50 cursor-move transition-colors">
                        <div className="font-medium text-sm">Fan Coil Unit</div>
                        <div className="text-xs text-slate-500">FCU</div>
                    </div>
                    <div className="p-3 border rounded hover:bg-blue-50 cursor-move transition-colors">
                        <div className="font-medium text-sm">Chiller</div>
                        <div className="text-xs text-slate-500">Water-cooled</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
