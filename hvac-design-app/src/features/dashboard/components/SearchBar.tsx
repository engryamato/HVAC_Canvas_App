'use client';

import { useEffect, useState } from 'react';
import type { SortBy, SortOrder } from '../hooks/useProjectFilters';
import { useAppStateStore } from '@/stores/useAppStateStore';

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
 * SearchBar component with search, sort, and rescan functionality
 * Implements UJ-PM-007: Search & Filter Projects
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
    const isTauri = useAppStateStore((state) => state.isTauri);

    // Debounce the onChange callback by 300ms
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px 32px 8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}
                    aria-label="Search projects"
                />
                {localValue && (
                    <button
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            color: '#999',
                        }}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="sort-select" style={{ fontSize: '14px', color: '#666' }}>
                    Sort:
                </label>
                <select
                    id="sort-select"
                    value={currentSortValue}
                    onChange={handleSortChange}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                </select>
            </div>

            {/* Project Count */}
            <div style={{ fontSize: '14px', color: '#666', whiteSpace: 'nowrap' }}>
                {filteredCount === totalCount
                    ? `${totalCount} project${totalCount !== 1 ? 's' : ''}`
                    : `${filteredCount} of ${totalCount} projects`}
            </div>

            {/* Rescan Button (Tauri only) */}
            {isTauri && onRescan && (
                <button
                    onClick={onRescan}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        background: 'white',
                        whiteSpace: 'nowrap',
                    }}
                    aria-label="Rescan project folder"
                >
                    🔄 Rescan Folder
                </button>
            )}
        </div>
    );
}
