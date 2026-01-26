'use client';

import React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Dropdown } from '@/components/ui/Dropdown';
import { useViewportStore } from '../../store/viewportStore';
import { useProjectStore } from '@/core/store/project.store';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import styles from './CanvasPropertiesInspector.module.css';

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
  } = useViewportStore();

  const setSnapToGrid = usePreferencesStore((state) => state.setSnapToGrid);

  const projectDetails = useProjectStore((state) => state.projectDetails);
  const projectName = projectDetails?.projectName || 'Untitled';
  const projectNumber = projectDetails?.projectNumber;
  const clientName = projectDetails?.clientName;

  return (
    <div className={styles.inspector}>
      <div className={styles.header}>
        <h3>Canvas Properties</h3>
      </div>

      <CollapsibleSection title="Project Info" defaultExpanded>
        <div className={styles.field}>
          <label>Project Name</label>
          <div className={styles.readOnly}>{projectName}</div>
        </div>
        {projectNumber && (
          <div className={styles.field}>
            <label>Project Number</label>
            <div className={styles.readOnly}>{projectNumber}</div>
          </div>
        )}
        {clientName && (
          <div className={styles.field}>
            <label>Client Name</label>
            <div className={styles.readOnly}>{clientName}</div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Grid Settings" defaultExpanded>
        <div className={styles.field}>
          <Dropdown
            label="Grid Size"
            options={GRID_SIZE_OPTIONS}
            value={String(gridSize)}
            onChange={(value) => setGridSize(Number(value))}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={gridVisible}
              onChange={toggleGrid}
              className={styles.checkbox}
            />
            <span>Show Grid</span>
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(event) => setSnapToGrid(event.target.checked)}
              className={styles.checkbox}
            />
            <span>Snap to Grid</span>
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Units" defaultExpanded>
        <div className={styles.field}>
          <Dropdown
            label="Unit System"
            options={UNIT_SYSTEM_OPTIONS}
            value="imperial"
            onChange={() => {
              // TODO: Implement unit system switching
              console.log('Unit system change not yet implemented');
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Canvas Info" defaultExpanded={false}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Background</span>
            <span className={styles.infoValue}>#FAFAFA</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Grid Color</span>
            <span className={styles.infoValue}>#E5E5E5</span>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
