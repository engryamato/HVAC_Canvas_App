"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"
import { Button } from "./button"

// --- Types for Data Table ---

export interface DataTableColumn<TData> {
  key: keyof TData | string;
  header: React.ReactNode | ((props: { column: DataTableColumn<TData>, onSort: () => void, sortDirection: 'asc' | 'desc' | 'none' }) => React.ReactNode);
  cell: (props: { row: TData, rowIndex: number }) => React.ReactNode;
  isSortable?: boolean;
}

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortState {
  columnKey: string | null;
  direction: SortDirection;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: DataTableColumn<TData>[];
  sortState: SortState;
  onSortChange: (columnKey: string, direction: SortDirection) => void;
  onRowClick?: (row: TData, rowIndex: number) => void;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: TData) => string);
  keyExtractor: (row: TData, index: number) => string | number;
}

// --- Component Implementation ---

export function DataTable<TData>({
  data,
  columns,
  sortState,
  onSortChange,
  onRowClick,
  className,
  headerClassName,
  rowClassName,
  keyExtractor,
}: DataTableProps<TData>) {

  const handleSort = (columnKey: string, currentDirection: SortDirection) => {
    let newDirection: SortDirection = 'asc';
    if (currentDirection === 'asc') {
      newDirection = 'desc';
    } else if (currentDirection === 'desc') {
      newDirection = 'none';
    } else {
      newDirection = 'asc';
    }
    onSortChange(columnKey, newDirection);
  };

  return (
    <div className={cn("w-full overflow-auto rounded-lg border", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className={cn("sticky top-0 bg-gray-50 border-b", headerClassName)}>
          <tr>
            {columns.map((column) => {
              const columnKey = String(column.key);
              const isCurrentSort = sortState.columnKey === columnKey;
              const currentDirection = isCurrentSort ? sortState.direction : 'none';
              const ariaSort = column.isSortable
                ? currentDirection === 'asc'
                  ? 'ascending'
                  : currentDirection === 'desc'
                    ? 'descending'
                    : 'none'
                : undefined;

              const headerContent = (
                <div className="flex items-center gap-2">
                  {typeof column.header === 'function' 
                    ? column.header({ column, onSort: () => handleSort(columnKey, currentDirection), sortDirection: currentDirection })
                    : column.header
                  }
                  {column.isSortable && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSort(columnKey, currentDirection)}
                      aria-label={`Sort by ${String(column.key)}`}
                    >
                      <ArrowUpDown className={cn("h-4 w-4", { 
                        "text-blue-600": currentDirection !== 'none'
                      })} />
                    </Button>
                  )}
                </div>
              );

              return (
                <th
                  key={columnKey}
                  scope="col"
                  aria-sort={ariaSort}
                  className="h-12 px-4 text-left align-middle font-medium text-gray-600"
                >
                  {headerContent}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="[&>tr:last-child]:border-0">
          {data.map((row, rowIndex) => {
            const rowKey = keyExtractor(row, rowIndex);
            
            const dynamicRowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
            const isClickable = !!onRowClick;

            return (
              <tr 
                key={rowKey} 
                className={cn(
                  "border-b transition-colors data-[state=selected]:bg-gray-200",
                  isClickable && "hover:bg-gray-100 cursor-pointer",
                  dynamicRowClass
                )}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? () => onRowClick?.(row, rowIndex) : undefined}
                onKeyDown={
                  isClickable
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick?.(row, rowIndex);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                  >
                    {column.cell({ row, rowIndex })}
                  </td>
                ))}
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center text-gray-500"
              >
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
