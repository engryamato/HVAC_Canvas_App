'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import { ChevronRight, ChevronLeft, Settings, List, FileText, Calculator, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InspectorPanel } from '@/features/canvas/components/Inspector/InspectorPanel';

/**
 * RightSidebar - Modern Engineering Design 2025
 * Clean properties panel with refined tabs and content sections
 */
export const RightSidebar: React.FC = () => {
    const {
        rightSidebarCollapsed,
        toggleRightSidebar,
        activeRightTab,
        setActiveRightTab
    } = useLayoutStore();
    const selectedIds = useSelectionStore((state) => state.selectedIds);
    const entities = useEntityStore((state) => state.byId);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                toggleRightSidebar();
                return;
            }

            if (e.ctrlKey) {
                if (!e.shiftKey && (e.key === 'p' || e.key === 'P')) {
                    e.preventDefault();
                    if (rightSidebarCollapsed) { toggleRightSidebar(); }
                    setActiveRightTab('properties');
                } else if (!e.shiftKey && (e.key === 'm' || e.key === 'M')) {
                    e.preventDefault();
                    if (rightSidebarCollapsed) { toggleRightSidebar(); }
                    setActiveRightTab('bom');
                }
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [toggleRightSidebar, rightSidebarCollapsed, setActiveRightTab]);

    const tabs = [
        { id: 'properties', label: 'Props', icon: Settings },
        { id: 'calculations', label: 'Calc', icon: Calculator },
        { id: 'bom', label: 'BOM', icon: List },
        { id: 'notes', label: 'Notes', icon: FileText },
    ];

    if (rightSidebarCollapsed) {
        return (
            <aside
                className="w-12 bg-white border-l border-slate-200 flex flex-col items-center py-3 transition-all duration-200 collapsed"
                data-testid="right-sidebar"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRightSidebar}
                    className="h-8 w-8 p-0 mb-3"
                    data-testid="right-sidebar-toggle"
                    aria-label="Expand sidebar"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex flex-col gap-1 w-full px-1.5">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeRightTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveRightTab(tab.id);
                                    toggleRightSidebar();
                                }}
                                className={cn(
                                    "w-full h-9 flex items-center justify-center rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                )}
                                title={tab.label}
                                data-testid={`tab-${tab.id}`}
                                role="tab"
                                aria-selected={isActive}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>
            </aside>
        );
    }

    return (
        <aside
            className="w-80 bg-white border-l border-slate-200 flex flex-col transition-all duration-200"
            data-testid="right-sidebar"
        >
            {/* Header with Tabs */}
            <div className="h-11 border-b border-slate-100 flex items-center justify-between px-2">
                <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeRightTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveRightTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all",
                                    isActive
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                                data-testid={`tab-${tab.id}`}
                                aria-label={tab.label}
                                aria-selected={isActive}
                                role="tab"
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRightSidebar}
                    className="h-7 w-7 p-0"
                    data-testid="right-sidebar-toggle"
                    aria-label="Collapse sidebar"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
                {activeRightTab === 'properties' && (
                    <div className="h-full" data-testid="properties-panel">
                       <InspectorPanel className="h-full border-none shadow-none" />
                    </div>
                )}

                {activeRightTab === 'calculations' && (
                    <div className="p-4" data-testid="calculations-panel">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                                <Calculator className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">Load Calculations</p>
                            <p className="text-xs text-slate-400 mt-1">Select entities to view calculations</p>
                        </div>
                    </div>
                )}

                {activeRightTab === 'bom' && (
                    <div className="p-4" data-testid="bom-panel">
                        <h3 className="font-semibold text-sm text-slate-800 mb-4">Bill of Materials</h3>
                        {Object.values(entities).length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <List className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">No items in BOM</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {Object.values(entities).map((entity) => (
                                    <div 
                                        key={entity.id} 
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"
                                    >
                                        <span className="font-medium text-slate-800">{entity.type}</span>
                                        <span className="badge badge-slate capitalize">{entity.type}</span>
                                    </div>
                                ))}
                                <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between text-sm">
                                    <span className="font-semibold text-slate-700">Total Items</span>
                                    <span className="font-bold text-slate-900">{Object.values(entities).length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeRightTab === 'notes' && (
                    <div className="p-4" data-testid="notes-panel">
                        <h3 className="font-semibold text-sm text-slate-800 mb-4">Project Notes</h3>
                        <textarea
                            className="w-full h-40 p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none transition-all"
                            placeholder="Add project notes here..."
                        />
                    </div>
                )}
            </div>
        </aside>
    );
};
