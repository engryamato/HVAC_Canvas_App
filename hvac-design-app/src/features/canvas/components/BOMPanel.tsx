'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  Filter,
  Search,
} from 'lucide-react';
import { useBOM } from '../hooks/useBOM';
import { downloadBomCsv, type BomItem } from '@/features/export/csv';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useShallow } from 'zustand/react/shallow';
import styles from './BOMPanel.module.css';
import { useBomHighlightStore } from '../store/bomHighlightStore';
import type { ItemCost } from '@/core/services/cost/costCalculationService';

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
  { value: 'all', label: 'All Categories' },
  { value: 'Duct', label: 'Ducts' },
  { value: 'Fitting', label: 'Fittings' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Accessory', label: 'Accessories' },
];

const ALL_EXPANDED: Record<CategoryKey, boolean> = {
  Duct: true, Fitting: true, Equipment: true, Accessory: true,
};

const ALL_COLLAPSED: Record<CategoryKey, boolean> = {
  Duct: false, Fitting: false, Equipment: false, Accessory: false,
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

interface BOMPanelProps {
  highlightedEntityId?: string | null;
}

export function BOMPanel({ highlightedEntityId = null }: BOMPanelProps) {
  const highlightedEntityIdFromStore = useBomHighlightStore((s) => s.highlightedEntityId);
  const setHighlightedEntityId = useBomHighlightStore((s) => s.setHighlightedEntityId);
  const clearHighlightedEntityId = useBomHighlightStore((s) => s.clearHighlightedEntityId);
  const activeHighlightedEntityId = highlightedEntityId ?? highlightedEntityIdFromStore;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<CategoryKey, boolean>>(ALL_EXPANDED);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showPrice, setShowPrice] = useState(false);

  const firstMatchingRowRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const { all, totals, costEstimate } = useBOM();
  const entities = useEntityStore(
    useShallow((state) => ({ byId: state.byId, allIds: state.allIds }))
  );
  const projectName = useProjectStore(
    (state) => state.projectDetails?.projectName ?? 'Untitled'
  );

  const costByItemNumber = useMemo<Map<number, ItemCost> | null>(() => {
    if (!costEstimate || costEstimate.items.length === 0) return null;
    const map = new Map<number, ItemCost>();
    for (const cost of costEstimate.items) {
      const num = parseInt(cost.bomItemId.replace('bom-', ''), 10);
      if (!isNaN(num)) map.set(num, cost);
    }
    return map;
  }, [costEstimate]);

  const hasCostData = costByItemNumber !== null;

  useEffect(() => {
    if (!filterOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [filterOpen]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return all.filter((item) => {
      if (categoryFilter !== 'all' && normalizeCategory(item) !== categoryFilter) return false;
      if (!query) return true;
      return [item.name, item.description, item.specifications, item.type]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(query));
    });
  }, [all, categoryFilter, searchQuery]);

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((category) => {
      const items = filteredItems.filter((item) => normalizeCategory(item) === category);
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = hasCostData
        ? items.reduce(
            (sum, item) => sum + (costByItemNumber?.get(item.itemNumber)?.itemTotal ?? 0),
            0
          )
        : 0;
      return {
        category,
        label: CATEGORY_LABELS[category],
        items,
        count: items.length,
        totalQty,
        totalCost,
        primaryUnit: items[0]?.unit ?? '',
      };
    }).filter((g) => g.count > 0);
  }, [filteredItems, hasCostData, costByItemNumber]);

  const visibleCount = filteredItems.length;
  const allGroupsExpanded = groups.length > 0 && groups.every((g) => expandedGroups[g.category]);

  const toggleGroup = (category: CategoryKey) =>
    setExpandedGroups((cur) => ({ ...cur, [category]: !cur[category] }));

  const toggleAllGroups = () =>
    setExpandedGroups(allGroupsExpanded ? ALL_COLLAPSED : ALL_EXPANDED);

  const handleRowClick = (entityId: string | undefined) => {
    if (!entityId) return;
    if (activeHighlightedEntityId === entityId) {
      clearHighlightedEntityId();
    } else {
      setHighlightedEntityId(entityId);
    }
  };

  const handleExport = () => downloadBomCsv(entities, projectName);

  const firstMatchingItemNumber = useMemo(() => {
    if (!activeHighlightedEntityId) return null;
    return all.find((item) => item.entityId === activeHighlightedEntityId)?.itemNumber ?? null;
  }, [activeHighlightedEntityId, all]);

  useEffect(() => {
    if (!activeHighlightedEntityId) return;
    const cats = new Set(
      all
        .filter((item) => item.entityId === activeHighlightedEntityId)
        .map(normalizeCategory)
    );
    if (cats.size === 0) return;
    setExpandedGroups((cur) => {
      const next = { ...cur };
      cats.forEach((cat) => (next[cat] = true));
      return next;
    });
  }, [activeHighlightedEntityId, all]);

  useEffect(() => {
    if (!activeHighlightedEntityId) return;
    firstMatchingRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeHighlightedEntityId, firstMatchingItemNumber]);

  const activeFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === categoryFilter)?.label ?? 'All Categories';

  const priceVisible = showPrice && hasCostData;

  return (
    <div className={styles.panel} data-testid="bom-panel-content">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Bill of Materials</h3>
          <span className={styles.badge}>{totals.totalItems}</span>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.searchWrap}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <input
              aria-label="Search BOM"
              className={styles.searchInput}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              type="search"
              value={searchQuery}
            />
          </label>

          <div className={styles.filterWrap} ref={filterRef}>
            <button
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
              className={[styles.filterButton, categoryFilter !== 'all' && styles.filterButtonActive].filter(Boolean).join(' ')}
              onClick={() => setFilterOpen((v) => !v)}
              type="button"
            >
              <Filter className={styles.filterIcon} aria-hidden="true" />
              <span className={styles.filterLabel}>
                {categoryFilter === 'all' ? 'Filter' : activeFilterLabel}
              </span>
              <ChevronDown
                className={[styles.filterChevron, filterOpen && styles.filterChevronOpen].filter(Boolean).join(' ')}
                aria-hidden="true"
              />
            </button>

            {filterOpen && (
              <div className={styles.filterDropdown} role="listbox">
                {FILTER_OPTIONS.map((opt) => {
                  const count =
                    opt.value === 'all'
                      ? totals.totalItems
                      : all.filter((item) => normalizeCategory(item) === opt.value).length;
                  return (
                    <button
                      key={opt.value}
                      aria-selected={categoryFilter === opt.value}
                      className={[styles.filterOption, categoryFilter === opt.value && styles.filterOptionActive].filter(Boolean).join(' ')}
                      onClick={() => {
                        setCategoryFilter(opt.value);
                        setFilterOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      <span>{opt.label}</span>
                      <span className={styles.filterOptionCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {hasCostData && (
            <button
              className={[styles.priceToggle, showPrice && styles.priceToggleActive].filter(Boolean).join(' ')}
              onClick={() => setShowPrice((v) => !v)}
              title={showPrice ? 'Hide price column' : 'Show price column'}
              type="button"
            >
              {showPrice
                ? <EyeOff className={styles.priceToggleIcon} aria-hidden="true" />
                : <Eye className={styles.priceToggleIcon} aria-hidden="true" />}
              <span>Price</span>
            </button>
          )}

          <button
            className={styles.exportButton}
            onClick={handleExport}
            title="Export to CSV"
            type="button"
          >
            <Download className={styles.exportIcon} aria-hidden="true" />
          </button>
        </div>

        {costEstimate && (
          <div className={styles.budgetBar}>
            <span className={styles.budgetLabel}>Est. Budget</span>
            <span className={styles.budgetValue}>
              {formatCurrency(costEstimate.breakdown.totalCost)}
            </span>
          </div>
        )}
      </header>

      <div className={styles.content}>
        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardList className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>No items found</p>
            <p className={styles.emptyHint}>
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Add ducts, fittings, or equipment to populate the BOM.'}
            </p>
          </div>
        ) : (
          <section className={styles.listCard}>
            <div className={styles.tableTop}>
              <div
                className={styles.columnHeader}
                data-showprice={priceVisible ? 'true' : 'false'}
              >
                <span>Qty</span>
                <span>Description</span>
                <span>Unit</span>
                <span>Weight</span>
                {priceVisible && <span>Price</span>}
              </div>
              <button
                className={styles.expandToggle}
                onClick={toggleAllGroups}
                type="button"
              >
                {allGroupsExpanded ? 'Collapse all' : 'Expand all'}
              </button>
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
                    <span className={styles.groupLeft}>
                      {expanded
                        ? <ChevronDown className={styles.chevron} aria-hidden="true" />
                        : <ChevronRight className={styles.chevron} aria-hidden="true" />}
                      <span className={styles.groupTitle}>{group.label}</span>
                      <span className={styles.groupCount}>{group.count}</span>
                    </span>
                    {priceVisible && group.totalCost > 0
                      ? <span className={styles.groupCost}>{formatCurrency(group.totalCost)}</span>
                      : <span className={styles.groupQty}>{group.totalQty} {group.primaryUnit.toUpperCase()}</span>}
                  </button>

                  {expanded && (
                    <div className={styles.rows}>
                      {group.items.map((item) => {
                        const isHighlighted = item.entityId === activeHighlightedEntityId;
                        const isFirstMatch = isHighlighted && item.itemNumber === firstMatchingItemNumber;
                        const itemCost = costByItemNumber?.get(item.itemNumber);
                        const rowClass = [
                          styles.row,
                          isHighlighted && styles.rowHighlighted,
                          item.entityId && styles.rowClickable,
                        ].filter(Boolean).join(' ');

                        return (
                          <div
                            key={group.category + '-' + item.itemNumber}
                            ref={isFirstMatch ? firstMatchingRowRef : null}
                            className={rowClass}
                            data-showprice={priceVisible ? 'true' : 'false'}
                            data-highlighted={isHighlighted ? 'true' : 'false'}
                            data-testid={'bom-row-' + (item.entityId ?? item.itemNumber)}
                            onClick={() => handleRowClick(item.entityId)}
                            onKeyDown={item.entityId
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleRowClick(item.entityId);
                                  }
                                }
                              : undefined}
                            role={item.entityId ? 'button' : undefined}
                            tabIndex={item.entityId ? 0 : undefined}
                          >
                            <span className={styles.qty}>{item.quantity}</span>
                            <div className={styles.itemCell}>
                              <span className={styles.itemName}>{item.name}</span>
                              {item.specifications && (
                                <span className={styles.itemMeta}>{item.specifications}</span>
                              )}
                            </div>
                            <span className={styles.unit}>{item.unit.toUpperCase()}</span>
                            <span className={styles.weight}>&mdash;</span>
                            {priceVisible && (
                              <span className={styles.price}>
                                {itemCost ? formatCurrency(itemCost.itemTotal) : '—'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>

      {totals.totalItems > 0 && (
        <footer className={styles.footer}>
          <span className={styles.footerMuted}>
            {visibleCount === totals.totalItems
              ? totals.totalItems + (totals.totalItems === 1 ? ' item' : ' items')
              : visibleCount + ' of ' + totals.totalItems + ' shown'}
          </span>
          {costEstimate && (
            <span className={styles.footerStrong}>
              {formatCurrency(costEstimate.breakdown.totalCost)}
            </span>
          )}
        </footer>
      )}
    </div>
  );
}

export default BOMPanel;
