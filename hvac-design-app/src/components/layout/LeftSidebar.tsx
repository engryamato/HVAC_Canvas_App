'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ChevronLeft, Search, Box, Layers, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LeftSidebar: React.FC = () => {
    const {
        leftSidebarCollapsed,
        toggleLeftSidebar,
        activeLeftTab,
        setActiveLeftTab
    } = useLayoutStore();

    // Local state for search and categories
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'air-handling-units': true,
        'vav-boxes': false,
        'fans': false,
        'ducts': false,
    });

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    // Keyboard shortcut: Ctrl+B
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && !e.shiftKey && (e.key === 'b' || e.key === 'B' || e.code === 'KeyB')) {
                e.preventDefault();
                toggleLeftSidebar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleLeftSidebar]);

    const tabs = [
        { id: 'equipment', label: 'Equipment', icon: Box },
        { id: 'layers', label: 'Layers', icon: Layers },
        { id: 'recent', label: 'Recent', icon: Clock },
    ];

    if (leftSidebarCollapsed) {
        return (
            <div
                className="w-12 bg-white border-r flex flex-col items-center pt-4 transition-all duration-300 collapsed"
                data-testid="left-sidebar"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLeftSidebar}
                    data-testid="left-sidebar-toggle"
                    aria-label="Expand sidebar"
                >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>

                {/* Vertical Tabs */}
                <div className="mt-4 flex flex-col gap-2 w-full px-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeLeftTab === tab.id;
                        return (
                            <Button
                                key={tab.id}
                                variant={isActive ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setActiveLeftTab(tab.id);
                                    toggleLeftSidebar(); // Expand on tab click
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
            className="w-72 bg-white border-r flex flex-col transition-all duration-300"
            data-testid="left-sidebar"
        >
            {/* Header with Toggle */}
            <div className="h-12 border-b flex items-center justify-between px-3 shrink-0">
                <h3 className="font-semibold text-sm">Library</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLeftSidebar}
                    data-testid="left-sidebar-toggle"
                    aria-label="Collapse sidebar"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeLeftTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveLeftTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors border-b-2",
                                isActive
                                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                                    : "text-slate-600 border-transparent hover:bg-slate-50"
                            ) + (isActive ? " active" : "")}
                            data-testid={`tab-${tab.id}`}
                            role="tab"
                            aria-selected={isActive}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeLeftTab === 'equipment' && (
                    <div className="flex-1 flex flex-col" data-testid="equipment-panel">
                        {/* Search */}
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search equipment..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    data-testid="equipment-search"
                                />
                            </div>
                        </div>

                        {/* Category Tree */}
                        <div className="flex-1 overflow-y-auto p-2" data-testid="equipment-category-tree">
                            <EquipmentCategory
                                id="air-handling-units"
                                label="Air Handling Units"
                                expanded={expandedCategories['air-handling-units']}
                                onToggle={() => toggleCategory('air-handling-units')}
                                searchQuery={searchQuery}
                                items={[
                                    { name: 'AHU - York MCA', desc: '5000 CFM' },
                                    { name: 'AHU - Trane', desc: '3000 CFM' },
                                    { name: 'AHU - Carrier', desc: '7500 CFM' },
                                ]}
                            />
                            <EquipmentCategory
                                id="vav-boxes"
                                label="VAV Boxes"
                                expanded={expandedCategories['vav-boxes']}
                                onToggle={() => toggleCategory('vav-boxes')}
                                searchQuery={searchQuery}
                                items={[
                                    { name: 'VAV - Single Duct', desc: 'Cooling Only' },
                                    { name: 'VAV - Fan Powered', desc: 'Parallel' },
                                ]}
                            />
                            <EquipmentCategory
                                id="fans"
                                label="Fans"
                                expanded={expandedCategories['fans']}
                                onToggle={() => toggleCategory('fans')}
                                searchQuery={searchQuery}
                                items={[
                                    { name: 'Exhaust Fan', desc: 'Roof Mounted' },
                                    { name: 'Supply Fan', desc: 'Inline' },
                                ]}
                            />
                            <EquipmentCategory
                                id="ducts"
                                label="Ductwork"
                                expanded={expandedCategories['ducts']}
                                onToggle={() => toggleCategory('ducts')}
                                searchQuery={searchQuery}
                                items={[
                                    { name: 'Round Duct', desc: 'Galvanized' },
                                    { name: 'Rectangular Duct', desc: 'Galvanized' },
                                    { name: 'Flex Duct', desc: 'Insulated' },
                                ]}
                            />
                        </div>
                    </div>
                )}

                {activeLeftTab === 'layers' && (
                    <div className="flex-1 p-4" data-testid="layers-panel">
                        <div className="text-center text-slate-500">
                            <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Layer management</p>
                            <p className="text-xs text-slate-400 mt-1">Coming soon</p>
                        </div>
                    </div>
                )}

                {activeLeftTab === 'recent' && (
                    <div className="flex-1 p-4" data-testid="recent-panel">
                        <div className="text-center text-slate-500">
                            <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No recent items</p>
                            <p className="text-xs text-slate-400 mt-1">Recently used equipment will appear here</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

interface EquipmentItem {
    name: string;
    desc: string;
}

const EquipmentCategory: React.FC<{
    id: string;
    label: string;
    expanded: boolean;
    onToggle: () => void;
    searchQuery: string;
    items: EquipmentItem[];
}> = ({ id, label, expanded, onToggle, searchQuery, items }) => {
    // Filter items based on search
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If searching, always expand if matches found
    const isExpanded = searchQuery ? filteredItems.length > 0 : expanded;

    if (searchQuery && filteredItems.length === 0) { return null; }

    return (
        <div className="mb-1" data-testid={`category-${id}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-1 p-2 hover:bg-slate-100 rounded text-sm font-medium"
            >
                <div data-testid="expand-icon" data-expanded={isExpanded}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                <span>{label}</span>
                <span className="text-xs text-slate-400 ml-auto">{filteredItems.length}</span>
            </button>

            {isExpanded && (
                <div className="pl-4 mt-1 space-y-1">
                    {filteredItems.map((item, idx) => (
                        <div
                            key={idx}
                            className="p-2 border rounded hover:bg-blue-50 cursor-move transition-colors group bg-white"
                            data-testid="equipment-item"
                            draggable
                        >
                            <div className="font-medium text-sm group-hover:text-blue-700">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.desc}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
