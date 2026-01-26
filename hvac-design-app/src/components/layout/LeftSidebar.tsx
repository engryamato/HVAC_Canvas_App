'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ChevronLeft, Search, Box, Layers, Clock, ChevronDown, ChevronRight, GripVertical, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Dropdown } from '@/components/ui/Dropdown';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { useProjectActions, useProjectDetails } from '@/core/store/project.store';

// Project configuration constants
const PROJECT_TYPE_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
];

const SCOPE_OPTIONS = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'future', label: 'Future Systems' },
];

const MATERIAL_OPTIONS = [
  { value: 'galvanized', label: 'Galvanized Steel' },
  { value: 'stainless', label: 'Stainless Steel' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'pvs', label: 'PVS' },
];

const STAINLESS_GRADES = [
  { value: '304', label: '304 S.S.' },
  { value: '316', label: '316 S.S.' },
  { value: '409', label: '409 S.S.' },
  { value: '430', label: '430 S.S.' },
  { value: '444', label: '444 S.S.' },
];

const GALVANIZED_GRADES = [
  { value: 'g-60', label: 'G-60' },
  { value: 'g-90', label: 'G-90' },
];

function toggleArrayValue(values: string[] | undefined, value: string): string[] {
  const next = new Set(values ?? []);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return Array.from(next);
}

/**
 * LeftSidebar - Modern Engineering Design 2025
 * Clean equipment library with refined tabs and drag-friendly items
 */
export const LeftSidebar: React.FC = () => {
    const {
        leftSidebarCollapsed,
        toggleLeftSidebar,
        activeLeftTab,
        setActiveLeftTab
    } = useLayoutStore();

    // Project store integration
    const projectDetails = useProjectDetails();
    const { setProject } = useProjectActions();

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'air-handling-units': true,
        'vav-boxes': false,
        'fans': false,
        'ducts': false,
    });
    const [expandedProjectSections, setExpandedProjectSections] = useState<string[]>([
        'project-details',
        'project-scope',
        'site-conditions',
    ]);

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

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [toggleLeftSidebar]);

    // Project data helpers
    const details = projectDetails;

    const projectScope = useMemo(() => {
        const scope = details?.scope ?? { details: [], materials: [], projectType: 'commercial' };
        return {
            details: scope.details ?? [],
            materials: scope.materials ?? [],
            projectType: scope.projectType ?? 'commercial',
        };
    }, [details]);

    const siteConditions = useMemo(() => {
        return details?.siteConditions ?? {
            elevation: '',
            outdoorTemp: '',
            indoorTemp: '',
            windSpeed: '',
            humidity: '',
            localCodes: '',
        };
    }, [details]);

    const updateProjectDetails = (partial: Record<string, unknown>) => {
        if (!details) {
            return;
        }
        setProject(details.projectId, { ...details, ...partial });
    };

    const updateScope = (partial: Record<string, unknown>) => {
        if (!details) {
            return;
        }
        setProject(details.projectId, {
            ...details,
            scope: { ...projectScope, ...partial },
        });
    };

    const updateSiteConditions = (partial: Record<string, unknown>) => {
        if (!details) {
            return;
        }
        setProject(details.projectId, {
            ...details,
            siteConditions: { ...siteConditions, ...partial },
        });
    };

    const toggleProjectSection = (sectionId: string) => {
        setExpandedProjectSections((prev) =>
            prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
        );
    };

    const tabs = [
        { id: 'equipment', label: 'Equipment', icon: Box },
        { id: 'project', label: 'Project', icon: FileText },
        { id: 'layers', label: 'Layers', icon: Layers },
        { id: 'recent', label: 'Recent', icon: Clock },
    ];

    if (leftSidebarCollapsed) {
        return (
            <aside
                className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-3 transition-all duration-200 collapsed"
                data-testid="left-sidebar"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLeftSidebar}
                    className="h-8 w-8 p-0 mb-3"
                    data-testid="left-sidebar-toggle"
                    aria-label="Expand sidebar"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>

                <div className="flex flex-col gap-1 w-full px-1.5">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeLeftTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveLeftTab(tab.id);
                                    toggleLeftSidebar();
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
            className="w-72 bg-white border-r border-slate-200 flex flex-col transition-all duration-200"
            data-testid="left-sidebar"
        >
            {/* Header */}
            <div className="h-11 border-b border-slate-100 flex items-center justify-between px-3 shrink-0">
                <h3 className="font-semibold text-sm text-slate-800">Library</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLeftSidebar}
                    className="h-7 w-7 p-0"
                    data-testid="left-sidebar-toggle"
                    aria-label="Collapse sidebar"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-2 py-1.5 gap-1 bg-slate-50/50">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeLeftTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveLeftTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all",
                                isActive
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                            data-testid={`tab-${tab.id}`}
                            role="tab"
                            aria-selected={isActive}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeLeftTab === 'equipment' && (
                    <div className="flex-1 flex flex-col" data-testid="equipment-panel">
                        {/* Search */}
                        <div className="p-3 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search equipment..."
                                    className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
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
                                expanded={expandedCategories['air-handling-units'] ?? false}
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
                                expanded={expandedCategories['vav-boxes'] ?? false}
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
                                expanded={expandedCategories['fans'] ?? false}
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
                                expanded={expandedCategories['ducts'] ?? false}
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

                {activeLeftTab === 'project' && (
                    <div className="flex-1 overflow-y-auto p-3" data-testid="project-panel">
                        <CollapsibleSection
                            title="Project Details"
                            defaultExpanded={expandedProjectSections.includes('project-details')}
                            onToggle={() => toggleProjectSection('project-details')}
                        >
                            <ValidatedInput
                                id="project-name"
                                type="text"
                                label="Name"
                                value={details?.projectName ?? ''}
                                onChange={(val) => updateProjectDetails({ projectName: String(val) })}
                            />
                            <ValidatedInput
                                id="project-location"
                                type="text"
                                label="Location"
                                value={details?.location ?? ''}
                                onChange={(val) => updateProjectDetails({ location: String(val) })}
                            />
                            <ValidatedInput
                                id="project-client"
                                type="text"
                                label="Client"
                                value={details?.clientName ?? ''}
                                onChange={(val) => updateProjectDetails({ clientName: String(val) })}
                            />
                        </CollapsibleSection>

                        <CollapsibleSection
                            title="Project Scope"
                            defaultExpanded={expandedProjectSections.includes('project-scope')}
                            onToggle={() => toggleProjectSection('project-scope')}
                        >
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs font-semibold text-slate-600 mb-2">Scope</div>
                                    {SCOPE_OPTIONS.map((option) => {
                                        const selected = projectScope.details.includes(option.value);
                                        return (
                                            <label key={option.value} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50 rounded px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        updateScope({
                                                            details: toggleArrayValue(projectScope.details, option.value),
                                                        })
                                                    }
                                                    className="rounded border-slate-300"
                                                />
                                                <span className="text-slate-700">{option.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-slate-600 mb-2">Materials</div>
                                    {MATERIAL_OPTIONS.map((option) => {
                                        const selected = projectScope.materials.includes(option.value);
                                        return (
                                            <label key={option.value} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50 rounded px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        updateScope({
                                                            materials: toggleArrayValue(projectScope.materials, option.value),
                                                        })
                                                    }
                                                    className="rounded border-slate-300"
                                                />
                                                <span className="text-slate-700">{option.label}</span>
                                            </label>
                                        );
                                    })}

                                    {projectScope.materials.includes('galvanized') && (
                                        <div className="mt-2">
                                            <Dropdown
                                                label="Galvanized Grade"
                                                options={GALVANIZED_GRADES}
                                                value={(details?.scope as { galvanizedGrade?: string })?.galvanizedGrade ?? 'g-60'}
                                                onChange={(val) => updateScope({ galvanizedGrade: String(val) })}
                                            />
                                        </div>
                                    )}

                                    {projectScope.materials.includes('stainless') && (
                                        <div className="mt-2">
                                            <Dropdown
                                                label="Stainless Grade"
                                                options={STAINLESS_GRADES}
                                                value={(details?.scope as { stainlessGrade?: string })?.stainlessGrade ?? '304'}
                                                onChange={(val) => updateScope({ stainlessGrade: String(val) })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <Dropdown
                                    label="Project Type"
                                    options={PROJECT_TYPE_OPTIONS}
                                    value={projectScope.projectType}
                                    onChange={(val) => updateScope({ projectType: String(val) })}
                                />
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection
                            title="Site Conditions"
                            defaultExpanded={expandedProjectSections.includes('site-conditions')}
                            onToggle={() => toggleProjectSection('site-conditions')}
                        >
                            <ValidatedInput
                                id="site-elevation"
                                label="Elevation (ft)"
                                type="number"
                                value={siteConditions.elevation ?? ''}
                                onChange={(val) => updateSiteConditions({ elevation: String(val) })}
                            />
                            <ValidatedInput
                                id="site-outdoor-temp"
                                label="Outdoor Temperature (°F)"
                                type="number"
                                value={siteConditions.outdoorTemp ?? ''}
                                onChange={(val) => updateSiteConditions({ outdoorTemp: String(val) })}
                            />
                            <ValidatedInput
                                id="site-indoor-temp"
                                label="Indoor Temperature (°F)"
                                type="number"
                                value={siteConditions.indoorTemp ?? ''}
                                onChange={(val) => updateSiteConditions({ indoorTemp: String(val) })}
                            />
                            <ValidatedInput
                                id="site-wind-speed"
                                label="Wind Speed (MPH)"
                                type="number"
                                value={siteConditions.windSpeed ?? ''}
                                onChange={(val) => updateSiteConditions({ windSpeed: String(val) })}
                            />
                            <ValidatedInput
                                id="site-humidity"
                                label="Humidity (%)"
                                type="number"
                                value={siteConditions.humidity ?? ''}
                                onChange={(val) => updateSiteConditions({ humidity: String(val) })}
                            />
                            <ValidatedInput
                                id="site-local-codes"
                                type="text"
                                label="Local Codes"
                                value={siteConditions.localCodes ?? ''}
                                onChange={(val) => updateSiteConditions({ localCodes: String(val) })}
                            />
                        </CollapsibleSection>
                    </div>
                )}

                {activeLeftTab === 'layers' && (
                    <div className="flex-1 flex items-center justify-center p-6" data-testid="layers-panel">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <Layers className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">Layer Management</p>
                            <p className="text-xs text-slate-400 mt-1">Coming soon</p>
                        </div>
                    </div>
                )}

                {activeLeftTab === 'recent' && (
                    <div className="flex-1 flex items-center justify-center p-6" data-testid="recent-panel">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <Clock className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No recent items</p>
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
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isExpanded = searchQuery ? filteredItems.length > 0 : expanded;

    if (searchQuery && filteredItems.length === 0) { return null; }

    return (
        <div className="mb-1" data-testid={`category-${id}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-1.5 p-2 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
                <div data-testid="expand-icon" data-expanded={isExpanded}>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                </div>
                <span className="flex-1 text-left">{label}</span>
                <span className="badge badge-slate text-[10px]">{filteredItems.length}</span>
            </button>

            {isExpanded && (
                <div className="pl-3 mt-1 space-y-1">
                    {filteredItems.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 cursor-grab transition-all group"
                            data-testid="equipment-item"
                            draggable
                        >
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-slate-800 group-hover:text-blue-700 truncate">
                                    {item.name}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
