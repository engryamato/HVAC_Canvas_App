'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import { ChevronRight, Settings, List, FileText, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RightSidebar: React.FC = () => {
    const {
        rightSidebarCollapsed,
        toggleRightSidebar,
        activeRightTab,
        setActiveRightTab
    } = useLayoutStore();
    const selectedIds = useSelectionStore((state) => state.selectedIds);
    const entities = useEntityStore((state) => state.byId);

    // Get the first selected entity for display
    const selectedEntity = selectedIds.length > 0 && selectedIds[0] ? entities[selectedIds[0]] : null;

    /**
     * Get display name for an entity
     * Returns the configured name from props, or a sensible default
     */
    function getEntityDisplayName(entity: typeof selectedEntity): string {
        if (!entity) {return '';}
        
        // Most entities have a name in props
        if ('props' in entity && entity.props && 'name' in entity.props) {
            return entity.props.name as string;
        }
        
        // Note entity uses content as identifier
        if (entity.type === 'note') {
            return 'Note';
        }
        
        // Fallback to capitalized type
        return entity.type.charAt(0).toUpperCase() + entity.type.slice(1);
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle sidebar (Ctrl+Shift+B)
            if (e.ctrlKey && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                toggleRightSidebar();
                return;
            }

            // Tab shortcuts
            if (e.ctrlKey) {
                if (!e.shiftKey && (e.key === 'p' || e.key === 'P')) { // Ctrl+P -> Properties
                    e.preventDefault();
                    if (rightSidebarCollapsed) { toggleRightSidebar(); }
                    setActiveRightTab('properties');
                } else if (!e.shiftKey && (e.key === 'm' || e.key === 'M')) { // Ctrl+M -> BOM
                    e.preventDefault();
                    if (rightSidebarCollapsed) { toggleRightSidebar(); }
                    setActiveRightTab('bom');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleRightSidebar, rightSidebarCollapsed, setActiveRightTab]);

    const tabs = [
        { id: 'properties', label: 'Properties', icon: Settings },
        { id: 'calculations', label: 'Calculations', icon: Calculator },
        { id: 'bom', label: 'BOM', icon: List },
        { id: 'notes', label: 'Notes', icon: FileText },
    ];

    if (rightSidebarCollapsed) {
        return (
            <div
                className="w-12 bg-white border-l flex flex-col items-center pt-4 transition-all duration-300 collapsed"
                data-testid="right-sidebar"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRightSidebar}
                    data-testid="right-sidebar-toggle"
                    aria-label="Expand sidebar"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>

                {/* Vertical Tabs */}
                <div className="mt-4 flex flex-col gap-2 w-full px-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeRightTab === tab.id;
                        return (
                            <Button
                                key={tab.id}
                                variant={isActive ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setActiveRightTab(tab.id);
                                    toggleRightSidebar();
                                }}
                                className={cn("w-full h-10 p-0 justify-center") + (isActive ? " active" : "")}
                                title={tab.label}
                                data-testid={`tab-${tab.id}`}
                                role="tab"
                                aria-selected={isActive}
                            >
                                <Icon className="w-4 h-4" />
                            </Button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <aside
            className="w-80 bg-white border-l flex flex-col transition-all duration-300"
            data-testid="right-sidebar"
        >
            {/* Header with Tabs */}
            <div className="h-12 border-b flex items-center justify-between px-2">
                <div className="flex gap-0.5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeRightTab === tab.id;
                        return (
                            <Button
                                key={tab.id}
                                variant={isActive ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveRightTab(tab.id)}
                                className={cn("gap-1 px-2 h-8", !isActive && "text-slate-500") + (isActive ? " active" : "")}
                                data-testid={`tab-${tab.id}`}
                                aria-label={tab.label}
                                aria-selected={isActive}
                                role="tab"
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline text-xs">{tab.label}</span>
                            </Button>
                        );
                    })}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRightSidebar}
                    data-testid="right-sidebar-toggle"
                    className="h-8 w-8 p-0"
                    aria-label="Collapse sidebar"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeRightTab === 'properties' && (
                    <div data-testid="properties-panel">
                        <h3 className="font-semibold mb-4">Properties</h3>
                        {selectedEntity ? (
                            <div className="space-y-4">
                                <div className="text-sm">
                                    <div className="font-medium text-lg mb-2">{getEntityDisplayName(selectedEntity)}</div>
                                    <div className="space-y-2">
                                        {selectedEntity.type === 'room' && 'props' in selectedEntity && selectedEntity.props && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Width:</span>
                                                    <span>{(selectedEntity.props.width / 12).toFixed(1)}&apos;</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Length:</span>
                                                    <span>{(selectedEntity.props.length / 12).toFixed(1)}&apos;</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 border rounded p-4 bg-slate-50">
                                No item selected
                                <div className="mt-2 text-xs text-slate-400">
                                    Project: Office HVAC<br />
                                    Created: Jan 10, 2026
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeRightTab === 'calculations' && (
                    <div data-testid="calculations-panel">
                        <h3 className="font-semibold mb-4">Calculations</h3>
                        <div className="text-sm text-slate-500">
                            Select entities to view load calculations.
                        </div>
                    </div>
                )}

                {activeRightTab === 'bom' && (
                    <div data-testid="bom-panel">
                        <h3 className="font-semibold mb-4">Bill of Materials</h3>
                        {Object.values(entities).length === 0 ? (
                            <div className="text-sm text-slate-500">No items in BOM</div>
                        ) : (
                            <div className="space-y-4">
                                {Object.values(entities).map((entity) => (
                                    <div key={entity.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                                        <span className="font-medium">{getEntityDisplayName(entity)}</span>
                                        <span className="text-slate-500 text-xs capitalize">{entity.type.replace('_', ' ')}</span>
                                    </div>
                                ))}
                                <div className="pt-2 border-t font-semibold text-sm flex justify-between">
                                    <span>Total Items</span>
                                    <span>{Object.values(entities).length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeRightTab === 'notes' && (
                    <div data-testid="notes-panel">
                        <h3 className="font-semibold mb-4">Project Notes</h3>
                        <textarea
                            className="w-full h-32 p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Add project notes here..."
                        />
                    </div>
                )}
            </div>
        </aside>
    );
};
