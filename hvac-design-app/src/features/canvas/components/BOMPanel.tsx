'use client';

import { useMemo, useState } from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { BOMTable } from './BOMTable';
import { useBOM } from '../hooks/useBOM';
import { downloadBomCsv } from '@/features/export/csv';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '@/core/store/settingsStore';
import { ExportDialog, ExportDialogOptions } from '@/features/export/ExportDialog';
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Duct' | 'Equipment' | 'Fitting'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'type' | 'name'>('type');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { all, totals, costEstimate } = useBOM();
  const templates = useSettingsStore((state) => state.templates);
  const activeTemplateId = useSettingsStore((state) => state.activeTemplateId);
  const calculationSettings = useSettingsStore((state) => state.calculationSettings);
  const applyTemplate = useSettingsStore((state) => state.applyTemplate);
  const updateLaborRates = useSettingsStore((state) => state.updateLaborRates);
  const updateEngineeringLimits = useSettingsStore((state) => state.updateEngineeringLimits);
  const saveAsTemplate = useSettingsStore((state) => state.saveAsTemplate);
  
  const entities = useEntityStore(
    useShallow((state) => ({
      byId: state.byId,
      allIds: state.allIds,
    }))
  );
  
  const projectDetails = useProjectStore((state) => state.projectDetails);
  const projectName = projectDetails?.projectName || 'Untitled';

  const totalItems = totals.totalItems;

  const filteredItems = useMemo(() => {
    const byCategory = selectedCategory === 'all'
      ? all
      : all.filter((item) => item.type === selectedCategory);

    if (!searchQuery.trim()) {
      return byCategory;
    }

    const query = searchQuery.toLowerCase();
    return byCategory.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.specifications.toLowerCase().includes(query)
    );
  }, [all, selectedCategory, searchQuery]);

  const groupedFilteredItems = useMemo(() => {
    if (groupBy === 'type') {
      return {
        Ducts: filteredItems.filter((item) => item.type === 'Duct'),
        Equipment: filteredItems.filter((item) => item.type === 'Equipment'),
        Fittings: filteredItems.filter((item) => item.type === 'Fitting'),
      };
    }

    return filteredItems.reduce<Record<string, typeof filteredItems>>((acc, item) => {
      const key = item.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredItems, groupBy]);

  const handleExport = () => {
    downloadBomCsv(entities, projectName);
  };

  const handleExportExcel = () => {
    const header = ['Item #', 'Type', 'Name', 'Description', 'Quantity', 'Unit', 'Specifications'];
    const rows = filteredItems.map((item) => [
      String(item.itemNumber),
      item.type,
      item.name,
      item.description,
      String(item.quantity),
      item.unit,
      item.specifications,
    ]);
    const content = [header, ...rows].map((row) => row.join('\t')).join('\n');
    downloadFile(content, `${projectName}-bom.xls`, 'application/vnd.ms-excel;charset=utf-8');
  };

  const handleExportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    doc.setFontSize(16);
    doc.text('Bill of Materials', 14, 16);
    doc.setFontSize(10);
    doc.text(`Project: ${projectName}`, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);

    autoTable(doc, {
      startY: 36,
      head: [['#', 'Type', 'Name', 'Description', 'Qty', 'Unit', 'Specifications']],
      body: filteredItems.map((item) => [
        item.itemNumber.toString(),
        item.type,
        item.name,
        item.description,
        item.quantity.toString(),
        item.unit,
        item.specifications,
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
    });

    let nextY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 36;
    nextY += 8;
    doc.text(`Total line items: ${filteredItems.length}`, 14, nextY);
    nextY += 6;

    if (costEstimate) {
      doc.text(`Material: $${costEstimate.breakdown.materialCost.toFixed(2)}`, 14, nextY);
      nextY += 5;
      doc.text(`Labor: $${costEstimate.breakdown.laborCost.toFixed(2)}`, 14, nextY);
      nextY += 5;
      doc.text(`Total: $${costEstimate.breakdown.totalCost.toFixed(2)}`, 14, nextY);
    }

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}-bom.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = () => {
    const sanitizedName = newTemplateName.trim();
    if (!sanitizedName) {
      return;
    }

    saveAsTemplate(sanitizedName, 'Saved from BOM panel');
    setNewTemplateName('');
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
          <button
            className={styles.exportButtonSecondary}
            onClick={handleExportExcel}
            disabled={totalItems === 0}
            type="button"
          >
            Excel
          </button>
          <button
            className={styles.exportButtonSecondary}
            onClick={handleExportPdf}
            disabled={totalItems === 0}
            type="button"
          >
            PDF
          </button>
          <button
            className={styles.exportButtonSecondary}
            onClick={() => setExportDialogOpen(true)}
            disabled={totalItems === 0}
            type="button"
          >
            Export...
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
              <div className={styles.filters}>
                <input
                  className={styles.searchInput}
                  placeholder="Search BOM"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <select
                  className={styles.select}
                  aria-label="Filter BOM category"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value as 'all' | 'Duct' | 'Equipment' | 'Fitting')}
                >
                  <option value="all">All Categories</option>
                  <option value="Duct">Ducts</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Fitting">Fittings</option>
                </select>
                <select
                  className={styles.select}
                  value={groupBy}
                  onChange={(event) => setGroupBy(event.target.value as 'type' | 'name')}
                >
                  <option value="type">Group by Type</option>
                  <option value="name">Group by Name</option>
                </select>
              </div>

              {costEstimate ? (
                <div className={styles.costSummary}>
                  <span>Material: ${costEstimate.breakdown.materialCost.toFixed(2)}</span>
                  <span>Labor: ${costEstimate.breakdown.laborCost.toFixed(2)}</span>
                  <span>Total: ${costEstimate.breakdown.totalCost.toFixed(2)}</span>
                </div>
              ) : null}

              <div className={styles.settingsPanel} data-testid="bom-settings-panel">
                <div className={styles.settingsHeader}>Calculation Settings</div>
                <div className={styles.settingsGrid}>
                  <label className={styles.settingsLabel} htmlFor="bom-template-select">
                    Template
                  </label>
                  <select
                    id="bom-template-select"
                    className={styles.select}
                    data-testid="bom-template-select"
                    value={activeTemplateId ?? ''}
                    onChange={(event) => {
                      if (event.target.value) {
                        applyTemplate(event.target.value);
                        return;
                      }

                      updateLaborRates({ baseRate: calculationSettings.laborRates.baseRate });
                    }}
                  >
                    <option value="">Custom</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>

                  <label className={styles.settingsLabel} htmlFor="bom-base-rate-input">
                    Base Labor Rate ($/hr)
                  </label>
                  <input
                    id="bom-base-rate-input"
                    data-testid="bom-base-rate-input"
                    className={styles.searchInput}
                    type="number"
                    value={calculationSettings.laborRates.baseRate}
                    onChange={(event) => {
                      updateLaborRates({ baseRate: Number(event.target.value) || 0 });
                    }}
                  />

                  <label className={styles.settingsLabel} htmlFor="bom-max-velocity-supply-input">
                    Max Supply Velocity (FPM)
                  </label>
                  <input
                    id="bom-max-velocity-supply-input"
                    data-testid="bom-max-velocity-supply-input"
                    className={styles.searchInput}
                    type="number"
                    value={calculationSettings.engineeringLimits.maxVelocity.supply}
                    onChange={(event) => {
                      updateEngineeringLimits({
                        maxVelocity: {
                          ...calculationSettings.engineeringLimits.maxVelocity,
                          supply: Number(event.target.value) || 0,
                        },
                      });
                    }}
                  />

                  <label className={styles.settingsLabel} htmlFor="bom-save-template-name-input">
                    Save as Template
                  </label>
                  <div className={styles.saveTemplateRow}>
                    <input
                      id="bom-save-template-name-input"
                      data-testid="bom-save-template-name-input"
                      className={styles.searchInput}
                      type="text"
                      value={newTemplateName}
                      onChange={(event) => setNewTemplateName(event.target.value)}
                      placeholder="Template name"
                    />
                    <button
                      type="button"
                      data-testid="bom-save-template-button"
                      className={styles.exportButtonSecondary}
                      onClick={handleSaveTemplate}
                      disabled={!newTemplateName.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {Object.entries(groupedFilteredItems).map(([groupName, groupItems]) =>
                groupItems.length > 0 ? (
                  <CollapsibleSection key={groupName} title={`${groupName} (${groupItems.length})`} defaultExpanded>
                    <BOMTable items={groupItems} />
                  </CollapsibleSection>
                ) : null
              )}
            </>
          )}
        </div>
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={async (options: ExportDialogOptions) => {
          setIsExporting(true);
          try {
            if (options.format === 'csv') {
              downloadBomCsv(entities, projectName);
            }
          } finally {
            setIsExporting(false);
            setExportDialogOpen(false);
          }
        }}
        isExporting={isExporting}
      />
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

