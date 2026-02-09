'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Dropdown } from '@/components/ui/Dropdown';
import { useViewportStore } from '../../store/viewportStore';
import { useProjectStore } from '@/core/store/project.store';
import { usePreferencesStore } from '@/core/store/preferencesStore';

const GRID_SIZE_OPTIONS = [
  { value: '6', label: '1/4"' },
  { value: '12', label: '1/2"' },
  { value: '24', label: '1"' },
  { value: '48', label: '2"' },
];

const UNIT_SYSTEM_OPTIONS = [
  { value: 'imperial', label: 'Imperial (in, ft)' },
  { value: 'metric', label: 'Metric (mm, m)' },
];

/**
 * Canvas Properties Inspector
 *
 * Displays canvas-level settings when nothing is selected.
 * Replaces the empty "Select an entity" message with useful controls.
 *
 * Sections:
 * - Project Info (read-only)
 * - Grid Settings (editable)
 * - Units (editable - future)
 * - Canvas Info (read-only)
 */
export function CanvasPropertiesInspector() {
  const {
    gridSize,
    gridVisible,
    snapToGrid,
    setGridSize,
    toggleGrid,
    toggleSnap,
  } = useViewportStore();

  const preferencesUnitSystem = usePreferencesStore((state) => state.unitSystem);
  const setUnitSystem = usePreferencesStore((state) => state.setUnitSystem);

  const projectDetails = useProjectStore((state) => state.projectDetails);
  const projectUnitSystem = useProjectStore((state) => state.projectSettings?.unitSystem);
  const setProjectSettings = useProjectStore((state) => state.setProjectSettings);

  const unitSystem = projectUnitSystem ?? preferencesUnitSystem;
  const projectName = projectDetails?.projectName || 'Untitled';
  const projectNumber = projectDetails?.projectNumber;
  const clientName = projectDetails?.clientName;

  const readonlyClass = "px-2.5 py-2 rounded-md bg-slate-100 border border-slate-200 text-sm text-slate-900";
  const fieldClass = "flex flex-col gap-1.5 mb-3.5";
  const labelClass = "text-sm font-medium text-slate-700";

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="px-1 pt-2 pb-2 font-bold text-lg text-slate-900">
        <h3>Canvas Properties</h3>
      </div>

      <Accordion
        type="multiple"
        defaultValue={['project-info', 'grid-settings', 'units']}
        className="w-full bg-white rounded-lg border border-slate-200 shadow-sm"
      >
        <AccordionItem value="project-info" className="border-b border-slate-200 last:border-b-0">
          <AccordionTrigger className="flex flex-1 items-center justify-between py-3 px-4 font-medium text-sm text-slate-900 hover:bg-slate-100 hover:no-underline rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Project Info
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden text-sm px-4 pb-4">
            <div className="pt-2 space-y-3">
              <div className={fieldClass}>
                <label className={labelClass}>Project Name</label>
                <div className={readonlyClass}>{projectName}</div>
              </div>
              {projectNumber && (
                <div className={fieldClass}>
                  <label className={labelClass}>Project Number</label>
                  <div className={readonlyClass}>{projectNumber}</div>
                </div>
              )}
              {clientName && (
                <div className={fieldClass}>
                  <label className={labelClass}>Client Name</label>
                  <div className={readonlyClass}>{clientName}</div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="grid-settings" className="border-b border-slate-200 last:border-b-0">
          <AccordionTrigger className="flex flex-1 items-center justify-between py-3 px-4 font-medium text-sm text-slate-900 hover:bg-slate-100 hover:no-underline rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Grid Settings
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden text-sm px-4 pb-4">
            <div className="pt-2 space-y-3">
              <div className={fieldClass}>
                <Dropdown
                  label="Grid Size"
                  options={GRID_SIZE_OPTIONS}
                  value={String(gridSize)}
                  onChange={(value) => setGridSize(Number(value))}
                />
              </div>
              <div className={fieldClass}>
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={gridVisible}
                    onChange={toggleGrid}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span>Show Grid</span>
                </label>
              </div>
              <div className={fieldClass}>
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={toggleSnap}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span>Snap to Grid</span>
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="units" className="border-b border-slate-200 last:border-b-0">
          <AccordionTrigger className="flex flex-1 items-center justify-between py-3 px-4 font-medium text-sm text-slate-900 hover:bg-slate-100 hover:no-underline rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Units
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden text-sm px-4 pb-4">
            <div className="pt-2 space-y-3">
              <div className={fieldClass}>
                <Dropdown
                  label="Unit System"
                  options={UNIT_SYSTEM_OPTIONS}
                  value={unitSystem}
                  onChange={(value) => {
                    const nextUnitSystem = value === 'metric' ? 'metric' : 'imperial';
                    setUnitSystem(nextUnitSystem);
                    setProjectSettings({ unitSystem: nextUnitSystem });
                  }}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="canvas-info" className="border-b border-slate-200 last:border-b-0">
          <AccordionTrigger className="flex flex-1 items-center justify-between py-3 px-4 font-medium text-sm text-slate-900 hover:bg-slate-100 hover:no-underline rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Canvas Info
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden text-sm px-4 pb-4">
            <div className="pt-2 grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Background</span>
                <span className="text-sm text-slate-900">#FAFAFA</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Grid Color</span>
                <span className="text-sm text-slate-900">#E5E5E5</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}


