'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ChevronRight, Settings, List, FileText } from 'lucide-react';

export const RightSidebar: React.FC = () => {
    const { rightSidebarCollapsed, toggleRightSidebar, activeRightTab, setActiveRightTab } =
        useLayoutStore();

    // Keyboard shortcut: Ctrl+I
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'i' || e.key === 'I' || e.code === 'KeyI')) {
                e.preventDefault();
                toggleRightSidebar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleRightSidebar]);

    if (rightSidebarCollapsed) {
        return (
            <div
                className="w-12 bg-white border-l flex flex-col items-center pt-4"
                data-testid="right-sidebar"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRightSidebar}
                    data-testid="right-sidebar-toggle"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
            </div>
        );
    }

    const tabs = [
        { id: 'properties', label: 'Properties', icon: Settings },
        { id: 'bom', label: 'BOM', icon: List },
        { id: 'notes', label: 'Notes', icon: FileText },
    ];

    return (
        <aside
            className="w-80 bg-white border-l flex flex-col"
            data-testid="right-sidebar"
        >
            {/* Header with Tabs */}
            <div className="h-12 border-b flex items-center justify-between px-4">
                <div className="flex gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Button
                                key={tab.id}
                                variant={activeRightTab === tab.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveRightTab(tab.id)}
                                className="gap-1"
                                data-testid={`tab-${tab.id}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </Button>
                        );
                    })}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRightSidebar}
                    data-testid="right-sidebar-toggle"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeRightTab === 'properties' && (
                    <div data-testid="properties-panel">
                        <h3 className="font-semibold mb-4">Properties</h3>
                        <div className="text-sm text-slate-500">No selection</div>
                    </div>
                )}

                {activeRightTab === 'bom' && (
                    <div data-testid="bom-panel">
                        <h3 className="font-semibold mb-4">Bill of Materials</h3>
                        <div className="text-sm text-slate-500">No items</div>
                    </div>
                )}

                {activeRightTab === 'notes' && (
                    <div data-testid="notes-panel">
                        <h3 className="font-semibold mb-4">Project Notes</h3>
                        <div className="text-sm text-slate-500">No notes</div>
                    </div>
                )}
            </div>
        </aside>
    );
};
