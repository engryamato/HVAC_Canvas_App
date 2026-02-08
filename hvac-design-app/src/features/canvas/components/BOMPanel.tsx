'use client';


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BOMDataGrid } from './BOMDataGrid';
import { useBOM } from '../hooks/useBOM';
import { downloadBomCsv } from '@/features/export/csv';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useShallow } from 'zustand/react/shallow';

/**
 * BOM Panel Component
 * 
 * Displays bill of materials at the bottom of the canvas.
 * Features:
 * - Collapsible panel with item count

/**
 * BOM Panel Component
 * 
 * Displays bill of materials at the bottom of the canvas.
 * Features:
 * - Collapsible panel with item count
 * - Groups by Ducts, Equipment, Fittings
 * - Real-time updates when entities change
 * - CSV export functionality
 * - Empty state when no entities
 */
export function BOMPanel() {
  const { ducts, equipment, fittings } = useBOM();

  const entities = useEntityStore(
    useShallow((state) => ({
      byId: state.byId,
      allIds: state.allIds,
    }))
  );
  
  const projectDetails = useProjectStore((state) => state.projectDetails);
  const projectName = projectDetails?.projectName || 'Untitled';

  const totalItems = ducts.length + equipment.length + fittings.length;

  const handleExport = () => {
    downloadBomCsv(entities, projectName);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex shrink-0 items-center justify-between p-3 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-900">
          Items ({totalItems})
        </span>
        <button
          className="h-7 px-2 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleExport}
          disabled={totalItems === 0}
          aria-label="Export BOM as CSV"
          type="button"
        >
          Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {totalItems === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm text-slate-600">No entities on canvas</p>
            <p className="text-xs text-slate-500">Add rooms, ducts, or equipment to generate BOM</p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={['ducts', 'equipment', 'fittings']}
            className="w-full"
          >
            {ducts.length > 0 && (
              <AccordionItem value="ducts" className="border border-slate-200 rounded-md bg-white mb-2">
                <AccordionTrigger className="h-9 px-3 py-0 text-sm font-medium text-slate-900 hover:bg-slate-50 hover:no-underline">
                  Ducts ({ducts.length})
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0">
                  <BOMDataGrid items={ducts} />
                </AccordionContent>
              </AccordionItem>
            )}

            {equipment.length > 0 && (
              <AccordionItem value="equipment" className="border border-slate-200 rounded-md bg-white mb-2">
                <AccordionTrigger className="h-9 px-3 py-0 text-sm font-medium text-slate-900 hover:bg-slate-50 hover:no-underline">
                  Equipment ({equipment.length})
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0">
                  <BOMDataGrid items={equipment} />
                </AccordionContent>
              </AccordionItem>
            )}

            {fittings.length > 0 && (
              <AccordionItem value="fittings" className="border border-slate-200 rounded-md bg-white mb-0">
                <AccordionTrigger className="h-9 px-3 py-0 text-sm font-medium text-slate-900 hover:bg-slate-50 hover:no-underline">
                  Fittings ({fittings.length})
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0">
                  <BOMDataGrid items={fittings} />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
}
