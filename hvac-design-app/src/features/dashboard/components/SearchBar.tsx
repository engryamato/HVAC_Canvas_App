'use client';

import { useEffect, useState } from 'react';
import type { SortBy, SortOrder } from '../hooks/useProjectFilters';
// useAppStateStore import removed
import { Search, ChevronDown, RefreshCw, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    sortBy: SortBy;
    sortOrder: SortOrder;
    onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
    onRescan?: () => void;
    totalCount: number;
    filteredCount: number;
}

/**
 * SearchBar - Modern Engineering Design 2025
 * Clean input with icon, sort dropdown, and project count
 */
export function SearchBar({
    value,
    onChange,
    sortBy,
    sortOrder,
    onSortChange,
    onRescan,
    totalCount,
    filteredCount,
}: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    // isTauri removed

    // Debounce the onChange callback
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [localValue, onChange]);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortBy, SortOrder];
        onSortChange(newSortBy, newSortOrder);
    };

    const currentSortValue = `${sortBy}-${sortOrder}`;

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    aria-label="Search projects"
                />
                {localValue && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
                <select
                    id="sort-select"
                    data-testid="sort-select"
                    aria-label="Sort projects"
                    value={currentSortValue}
                    onChange={handleSortChange}
                    className="appearance-none pl-3 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="date-desc">Newest</option>
                    <option value="date-asc">Oldest</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Project Count Badge */}
            <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
                {filteredCount === totalCount
                    ? <span>{totalCount} project{totalCount !== 1 ? 's' : ''}</span>
                    : <span className="text-blue-600">{filteredCount}</span>
                }
                {filteredCount !== totalCount && (
                    <span className="text-slate-400"> of {totalCount}</span>
                )}
            </div>

            {/* Refresh Button */}
            {onRescan && (
                <button
                    onClick={onRescan}
                    className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Refresh project list"
                    aria-label="Refresh project list"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
