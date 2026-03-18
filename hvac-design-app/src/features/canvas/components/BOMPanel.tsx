'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Download, Search } from 'lucide-react';
import { useBOM } from '../hooks/useBOM';
import { downloadBomCsv, type BomItem } from '@/features/export/csv';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useShallow } from 'zustand/react/shallow';
import styles from './BOMPanel.module.css';
import { useBomHighlightStore } from '../store/bomHighlightStore';

type CategoryKey = 'Duct' | 'Fitting' | 'Equipment' | 'Accessory';
type CategoryFilter = 'all' | CategoryKey;

const CATEGORY_ORDER: CategoryKey[] = ['Duct', 'Fitting', 'Equipment', 'Accessory'];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  Duct: 'Ducts',
  Fitting: 'Fittings',
  Equipment: 'Equipment',
  Accessory: 'Accessories',
};

const FILTER_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Duct', label: 'Ducts' },
  { value: 'Fitting', label: 'Fittings' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Accessory', label: 'Accessories' },
];

const DEFAULT_EXPANDED_GROUPS: Record<CategoryKey, boolean> = {
  Duct: true,
  Fitting: false,
  Equipment: false,
  Accessory: false,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeCategory(item: BomItem): CategoryKey {
  if (item.type === 'Duct' || item.type === 'Fitting' || item.type === 'Equipment') {
    return item.type;
  }
  return 'Accessory';
}

function getItemMeta(item: BomItem): string {
  const segments = [item.description, item.specifications].filter(Boolean);
  return segments.join(' / ');
}

interface BOMPanelProps {
  highlightedEntityId?: string | null;
}

export function BOMPanel({ highlightedEntityId = null }: BOMPanelProps) {
  const highlightedEntityIdFromStore = useBomHighlightStore((state) => state.highlightedEntityId);
  const activeHighlightedEntityId = highlightedEntityId ?? highlightedEntityIdFromStore;
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expandedGroups, setExpandedGroups] =
    useState<Record<CategoryKey, boolean>>(DEFAULT_EXPANDED_GROUPS);
  const firstMatchingRowRef = useRef<HTMLDivElement | null>(null);

  const { all, totals, costEstimate } = useBOM();
  const entities = useEntityStore(
    useShallow((state) => ({
      byId: state.byId,
      allIds: state.allIds,
    }))
  );
  const projectName = useProjectStore((state) => state.projectDetails?.projectName ?? 'Untitled');

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return all.filter((item) => {
      const category = normalizeCategory(item);
      if (categoryFilter !== 'all' && category !== categoryFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [item.name, item.description, item.specifications, item.type]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [all, categoryFilter, searchQuery]);

  const groups = useMemo(() => {
    const grouped = CATEGORY_ORDER.map((category) => {
      const items = filteredItems.filter((item) => normalizeCategory(item) === category);
      const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        category,
        label: CATEGORY_LABELS[category],
        items,
        count: items.length,
        quantity,
      };
    }).filter((group) => group.count > 0);

    return grouped;
  }, [filteredItems]);

  const visibleCount = filteredItems.length;
  const visibleQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const budgetLabel = costEstimate
    ? `${formatCurrency(costEstimate.breakdown.totalCost)} Budget`
    : null;

  const handleExport = () => {
    downloadBomCsv(entities, projectName);
  };

  const toggleGroup = (category: CategoryKey) => {
    setExpandedGroups((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  const firstMatchingItemNumber = useMemo(() => {
    if (!activeHighlightedEntityId) {
      return null;
    }

    return all.find((item) => item.entityId === activeHighlightedEntityId)?.itemNumber ?? null;
  }, [activeHighlightedEntityId, all]);

  useEffect(() => {
    if (!activeHighlightedEntityId) {
      return;
    }

    const matchingCategories = new Set(
      all
        .filter((item) => item.entityId === activeHighlightedEntityId)
        .map((item) => normalizeCategory(item))
    );

    if (matchingCategories.size === 0) {
      return;
    }

    setExpandedGroups((current) => {
      const next = { ...current };
      matchingCategories.forEach((category) => {
        next[category] = true;
      });
      return next;
    });
  }, [activeHighlightedEntityId, all]);

  useEffect(() => {
    if (!activeHighlightedEntityId) {
      return;
    }

    firstMatchingRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [activeHighlightedEntityId, firstMatchingItemNumber]);

  return (
    <div className={styles.panel} data-testid="bom-panel-content">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Bill of Materials</h3>
          <span className={styles.subtitle}>
            {totals.totalItems} {totals.totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.searchWrap}>
            <Search className={styles.toolbarIcon} aria-hidden="true" />
            <input
              aria-label="Search BOM"
              className={styles.searchInput}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search BOM"
              type="search"
              value={searchQuery}
            />
          </label>

          <button className={styles.exportButton} onClick={handleExport} type="button">
            <Download className={styles.toolbarIconStrong} aria-hidden="true" />
            <span>CSV</span>
          </button>
        </div>

        {/* Category filter chips */}
        <div className={styles.chips} role="group" aria-label="Filter by category">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${categoryFilter === opt.value ? styles.chipActive : ''}`}
              onClick={() => setCategoryFilter(opt.value)}
              aria-pressed={categoryFilter === opt.value}
            >
              {opt.label}
            </button>
          ))}
          {budgetLabel && (
            <span className={`${styles.chip} ${styles.chipBudget}`}>{budgetLabel}</span>
          )}
          <span className={`${styles.chip} ${styles.chipWt}`}>Est. Wt — lb</span>
          <span className={styles.chip}>{groups.length} {groups.length === 1 ? 'group' : 'groups'}</span>
        </div>
      </header>

      <div className={styles.content}>
        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No BOM items found</p>
            <p className={styles.emptyHint}>Add ducts, fittings, or equipment to populate this panel.</p>
          </div>
        ) : (
          <>
            <section className={styles.listCard}>
              <div className={styles.columnHeader}>
                <span>Qty</span>
                <span>Item / Desc</span>
                <span>U</span>
                <span>Material / Size</span>
                <span>Wt</span>
              </div>

              {groups.map((group) => {
                const expanded = expandedGroups[group.category];

                return (
                  <div className={styles.group} key={group.category}>
                    <button
                      aria-expanded={expanded}
                      className={styles.groupHeader}
                      onClick={() => toggleGroup(group.category)}
                      type="button"
                    >
                      <span className={styles.groupTitle}>
                        {expanded ? (
                          <ChevronDown className={styles.chevron} aria-hidden="true" />
                        ) : (
                          <ChevronRight className={styles.chevron} aria-hidden="true" />
                        )}
                        <span>{group.label}</span>
                      </span>
                      <span className={styles.groupMeta}>
                        {group.count} {group.count === 1 ? 'item' : 'items'}
                        {group.category === 'Duct' && group.items[0]
                          ? ` • ${group.quantity} ${group.items[0].unit.toUpperCase()}`
                          : ''}
                      </span>
                    </button>

                    {expanded ? (
                      <div className={styles.rows}>
                        {group.items.map((item) => {
                          const isHighlighted = item.entityId === activeHighlightedEntityId;
                          const isFirstMatchingRow =
                            isHighlighted && item.itemNumber === firstMatchingItemNumber;

                          return (
                            <div
                              className={`${styles.row} ${isHighlighted ? styles.rowHighlighted : ''}`}
                              data-testid={`bom-row-${item.entityId ?? item.itemNumber}`}
                              data-highlighted={isHighlighted ? 'true' : 'false'}
                              key={`${group.category}-${item.itemNumber}`}
                              ref={isFirstMatchingRow ? firstMatchingRowRef : null}
                            >
                              <span className={styles.qty}>{item.quantity}</span>
                              <div className={styles.itemCopy}>
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemMeta}>{getItemMeta(item)}</span>
                              </div>
                              <span className={styles.unit}>{item.unit.toUpperCase()}</span>
                              <span className={styles.spec}>{item.specifications || 'Standard'}</span>
                              <span className={styles.wt}>—</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>

            <footer className={styles.footer}>
              <span className={styles.footerMuted}>
                Displayed: {visibleCount} / {totals.totalItems}
              </span>
              <span className={styles.footerStrong}>Subtotal {visibleQuantity} lb</span>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default BOMPanel;
