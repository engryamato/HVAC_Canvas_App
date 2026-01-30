'use client';

import React, { useMemo, useState } from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Dropdown } from '@/components/ui/Dropdown';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { useProjectActions, useProjectDetails } from '@/core/store/project.store';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ProjectSidebar } from './ProjectSidebar';
import { ProductCatalogPanel } from './ProductCatalogPanel';

interface LeftSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

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

type MaterialSelection = { type: string; grade?: string };

function toggleMaterial(materials: MaterialSelection[] | undefined, type: string): MaterialSelection[] {
  const current = materials ?? [];
  const exists = current.some((m) => m.type === type);
  if (exists) {
    return current.filter((m) => m.type !== type);
  }
  return [...current, { type }];
}

function setMaterialGrade(
  materials: MaterialSelection[] | undefined,
  type: string,
  grade: string
): MaterialSelection[] {
  return (materials ?? []).map((m) => (m.type === type ? { ...m, grade } : m));
}

function getMaterialGrade(materials: MaterialSelection[] | undefined, type: string): string | undefined {
  return (materials ?? []).find((m) => m.type === type)?.grade;
}

type LeftTabId = 'equipment' | 'layers' | 'recent' | 'project';

function normalizeLeftTab(value: string): LeftTabId {
  if (value === 'equipment' || value === 'layers' || value === 'recent' || value === 'project') {
    return value;
  }
  return 'equipment';
}

export function LeftSidebar({
  isOpen = true,
  onClose,
  defaultWidth = 300,
  minWidth = 250,
  maxWidth = 500,
  className = '',
}: LeftSidebarProps) {
  const activeLeftTab = useLayoutStore((state) => normalizeLeftTab(state.activeLeftTab));
  const setActiveLeftTab = useLayoutStore((state) => state.setActiveLeftTab);
  const leftSidebarCollapsed = useLayoutStore((state) => state.leftSidebarCollapsed);
  const toggleLeftSidebar = useLayoutStore((state) => state.toggleLeftSidebar);

  const projectDetails = useProjectDetails();
  const { setProject } = useProjectActions();
  const [sidebarWidth, setSidebarWidth] = useState<number>(defaultWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'project-details',
    'project-scope',
    'site-conditions',
  ]);

  const details = projectDetails;

  const projectScope = useMemo(() => {
    const scope = details?.scope ?? { details: [], materials: [], projectType: 'commercial' };
    const rawMaterials = (scope.materials ?? []) as unknown[];
    const normalizedMaterials = rawMaterials
      .map((material) => {
        if (typeof material === 'string') {
          return { type: material };
        }
        return material as MaterialSelection;
      })
      .filter((material) => Boolean(material?.type));
    return {
      details: scope.details ?? [],
      materials: normalizedMaterials,
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
    setProject(details.projectId, {
      ...details,
      ...partial,
    });
  };

  const updateScope = (partial: Record<string, unknown>) => {
    if (!details) {
      return;
    }
    setProject(details.projectId, {
      ...details,
      scope: {
        ...projectScope,
        ...partial,
      },
    });
  };

  const updateSiteConditions = (partial: Record<string, unknown>) => {
    if (!details) {
      return;
    }
    setProject(details.projectId, {
      ...details,
      siteConditions: {
        ...siteConditions,
        ...partial,
      },
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) {
      return;
    }
    const newWidth = e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (!isResizing) {
      return undefined;
    }
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={`left-sidebar ${leftSidebarCollapsed ? 'collapsed' : ''} ${className}`}
      style={{ width: leftSidebarCollapsed ? '0px' : `${sidebarWidth}px` }}
      data-testid="left-sidebar"
    >
      <div className="resize-handle" onMouseDown={handleResizeStart} />

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        {!leftSidebarCollapsed && (
          <div className="flex gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeLeftTab === 'equipment'}
              aria-controls="equipment-panel"
              onClick={() => setActiveLeftTab('equipment')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeLeftTab === 'equipment'
                  ? 'active bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-equipment"
            >
              Equipment
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeLeftTab === 'layers'}
              aria-controls="layers-panel"
              onClick={() => setActiveLeftTab('layers')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeLeftTab === 'layers'
                  ? 'active bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-layers"
            >
              Layers
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeLeftTab === 'recent'}
              aria-controls="recent-panel"
              onClick={() => setActiveLeftTab('recent')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeLeftTab === 'recent'
                  ? 'active bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-recent"
            >
              Recent
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeLeftTab === 'project'}
              aria-controls="project-panel"
              onClick={() => setActiveLeftTab('project')}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                activeLeftTab === 'project'
                  ? 'active bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid="tab-project"
            >
              Project
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={toggleLeftSidebar}
          className={`p-1 rounded hover:bg-slate-100 text-slate-500 transition-transform ${
            leftSidebarCollapsed ? 'rotate-180 absolute left-2 top-2 z-50 bg-white shadow-md border border-slate-200' : ''
          }`}
          data-testid="left-sidebar-toggle"
          aria-label={leftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      {!leftSidebarCollapsed && (
        <div className="sidebar-content overflow-y-auto">
          {activeLeftTab === 'equipment' && (
            <div className="p-3" data-testid="equipment-panel" id="equipment-panel" role="tabpanel">
              <ProductCatalogPanel />
            </div>
          )}

        {activeLeftTab === 'layers' && (
          <div className="p-3" data-testid="layers-panel" id="layers-panel" role="tabpanel">
            <h3 className="text-sm font-semibold mb-2">Layers</h3>
            <div className="text-xs text-slate-500">Layer management coming soon.</div>
          </div>
        )}

        {activeLeftTab === 'recent' && (
          <div className="p-3" data-testid="recent-panel" id="recent-panel" role="tabpanel">
            <h3 className="text-sm font-semibold mb-2">Recent Items</h3>
            <div className="text-xs text-slate-500">Recently used items will appear here.</div>
          </div>
        )}

        {activeLeftTab === 'project' && (
          <div className="space-y-4" id="project-panel" role="tabpanel">
            <ProjectSidebar className="w-full border-r-0" />
        <CollapsibleSection
          title="Project Details"
          defaultExpanded={expandedSections.includes('project-details')}
          onToggle={() => toggleSection('project-details')}
        >
          <ValidatedInput
            id="project-name"
            label="Name"
            type="text"
            value={details?.projectName ?? ''}
            onChange={(val) => updateProjectDetails({ projectName: String(val) })}
          />
          <ValidatedInput
            id="project-location"
            label="Location"
            type="text"
            value={details?.location ?? ''}
            onChange={(val) => updateProjectDetails({ location: String(val) })}
          />
          <ValidatedInput
            id="project-client"
            label="Client"
            type="text"
            value={details?.clientName ?? ''}
            onChange={(val) => updateProjectDetails({ clientName: String(val) })}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Project Scope"
          defaultExpanded={expandedSections.includes('project-scope')}
          onToggle={() => toggleSection('project-scope')}
        >
          <div className="scope-section">
            <div className="scope-title">Scope</div>
            {SCOPE_OPTIONS.map((option) => {
              const selected = projectScope.details.includes(option.value);
              return (
                <label key={option.value} className="scope-row">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      updateScope({
                        details: toggleArrayValue(projectScope.details, option.value),
                      })
                    }
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>

          <div className="scope-section">
            <div className="scope-title">Materials</div>
            {MATERIAL_OPTIONS.map((option) => {
              const selected = projectScope.materials.some((material) => material.type === option.value);
              return (
                <label key={option.value} className="scope-row">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      updateScope({
                        materials: toggleMaterial(projectScope.materials, option.value),
                      })
                    }
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}

            {projectScope.materials.some((material) => material.type === 'galvanized') && (
              <Dropdown
                label="Galvanized Grade"
                options={GALVANIZED_GRADES}
                value={getMaterialGrade(projectScope.materials, 'galvanized') ?? 'g-60'}
                onChange={(val) =>
                  updateScope({
                    materials: setMaterialGrade(projectScope.materials, 'galvanized', String(val)),
                  })
                }
              />
            )}

            {projectScope.materials.some((material) => material.type === 'stainless') && (
              <Dropdown
                label="Stainless Grade"
                options={STAINLESS_GRADES}
                value={getMaterialGrade(projectScope.materials, 'stainless') ?? '304'}
                onChange={(val) =>
                  updateScope({
                    materials: setMaterialGrade(projectScope.materials, 'stainless', String(val)),
                  })
                }
              />
            )}
          </div>

          <Dropdown
            label="Project Type"
            options={PROJECT_TYPE_OPTIONS}
            value={projectScope.projectType}
            onChange={(val) => updateScope({ projectType: String(val) })}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Site Conditions"
          defaultExpanded={expandedSections.includes('site-conditions')}
          onToggle={() => toggleSection('site-conditions')}
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
            label="Local Codes"
            type="text"
            value={siteConditions.localCodes ?? ''}
            onChange={(val) => updateSiteConditions({ localCodes: String(val) })}
          />
        </CollapsibleSection>
          </div>
        )}

        {activeLeftTab === 'catalog' && <ProductCatalogPanel />}
      </div>
      )}

      {onClose && (
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          Close
        </button>
      )}
    </aside>
  );
}

export default LeftSidebar;
