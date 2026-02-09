'use client';

import { useState } from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { BOMTable } from './BOMTable';
import { useBOM } from '../hooks/useBOM';
import { downloadBomCsv } from '@/features/export/csv';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useShallow } from 'zustand/react/shallow';
import styles from './BOMPanel.module.css';

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
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div className={styles.panel}>
      <div className={styles.header}>
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          type="button"
        >
          <span className={`${styles.icon} ${isExpanded ? styles.expanded : ''}`}>
            ▲
          </span>
          <span className={styles.title}>
            Bill of Materials ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
        </button>
        <div className={styles.actions}>
          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={totalItems === 0}
            type="button"
          >
            Export CSV
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className={styles.content}>
          {totalItems === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyMessage}>No entities on canvas</p>
              <p className={styles.hint}>Add rooms, ducts, or equipment to generate BOM</p>
            </div>
          ) : (
            <>
              {ducts.length > 0 && (
                <CollapsibleSection title={`Ducts (${ducts.length})`} defaultExpanded>
                  <BOMTable items={ducts} />
                </CollapsibleSection>
              )}
              {equipment.length > 0 && (
                <CollapsibleSection title={`Equipment (${equipment.length})`} defaultExpanded>
                  <BOMTable items={equipment} />
                </CollapsibleSection>
              )}
              {fittings.length > 0 && (
                <CollapsibleSection title={`Fittings (${fittings.length})`} defaultExpanded>
                  <BOMTable items={fittings} />
                </CollapsibleSection>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

