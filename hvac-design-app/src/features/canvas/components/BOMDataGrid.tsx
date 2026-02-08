'use client';

import { useMemo, useState } from 'react';
import {
  DataTable,
  type DataTableColumn,
  type SortDirection,
  type SortState,
} from '@/components/ui/data-table';
import type { BomItem } from '@/features/export/csv';

interface BOMDataGridProps {
  items: BomItem[];
}

function compareBomItems(a: BomItem, b: BomItem, columnKey: string): number {
  if (columnKey === 'itemNumber') {
    return a.itemNumber - b.itemNumber;
  }
  if (columnKey === 'quantity') {
    return a.quantity - b.quantity;
  }

  const aValue = String(a[columnKey as keyof BomItem] ?? '');
  const bValue = String(b[columnKey as keyof BomItem] ?? '');
  return aValue.localeCompare(bValue, undefined, { sensitivity: 'base', numeric: true });
}

export function BOMDataGrid({ items }: BOMDataGridProps) {
  const [sortState, setSortState] = useState<SortState>({
    columnKey: null,
    direction: 'none',
  });

  const columns = useMemo<DataTableColumn<BomItem>[]>(() => {
    return [
      {
        key: 'itemNumber',
        header: <span className="text-xs font-medium text-slate-500">#</span>,
        isSortable: true,
        cell: ({ row }) => (
          <span className="tabular-nums text-slate-500">{row.itemNumber}</span>
        ),
      },
      {
        key: 'name',
        header: <span className="text-xs font-medium text-slate-500">Name</span>,
        isSortable: true,
        cell: ({ row }) => <span className="font-semibold text-slate-900">{row.name}</span>,
      },
      {
        key: 'description',
        header: <span className="text-xs font-medium text-slate-500">Description</span>,
        isSortable: true,
        cell: ({ row }) => <span className="text-slate-600">{row.description}</span>,
      },
      {
        key: 'quantity',
        header: <span className="text-xs font-medium text-slate-500">Qty</span>,
        isSortable: true,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-slate-900">
            {row.quantity}
          </div>
        ),
      },
      {
        key: 'specifications',
        header: <span className="text-xs font-medium text-slate-500">Specifications</span>,
        isSortable: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-500">{row.specifications || '-'}</span>
        ),
      },
    ];
  }, []);

  const sortedItems = useMemo(() => {
    if (!sortState.columnKey || sortState.direction === 'none') {
      return items;
    }

    const indexedItems = items.map((item, index) => ({ item, index }));
    indexedItems.sort((a, b) => {
      const baseCompare = compareBomItems(a.item, b.item, sortState.columnKey as string);
      if (baseCompare !== 0) {
        return sortState.direction === 'desc' ? -baseCompare : baseCompare;
      }
      return a.index - b.index;
    });

    return indexedItems.map(({ item }) => item);
  }, [items, sortState.columnKey, sortState.direction]);

  const handleSortChange = (columnKey: string, direction: SortDirection) => {
    if (direction === 'none') {
      setSortState({ columnKey: null, direction });
      return;
    }
    setSortState({ columnKey, direction });
  };

  return (
    <DataTable
      data={sortedItems}
      columns={columns}
      sortState={sortState}
      onSortChange={handleSortChange}
      keyExtractor={(row) => row.itemNumber}
      className="w-full overflow-x-auto border border-slate-200"
      headerClassName="bg-slate-50 border-b border-slate-200"
      rowClassName="hover:bg-slate-50"
    />
  );
}
