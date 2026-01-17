import { useMemo, useState } from 'react';
import type { ProjectListItem } from '../store/projectListStore';

export type SortBy = 'name' | 'date';
export type SortOrder = 'asc' | 'desc';
export type FilterType = 'all' | 'active' | 'archived';

export interface ProjectFilters {
    searchQuery: string;
    sortBy: SortBy;
    sortOrder: SortOrder;
    filterType: FilterType;
}

export interface UseProjectFiltersResult {
    filteredProjects: ProjectListItem[];
    totalCount: number;
    filters: ProjectFilters;
    setSearchQuery: (query: string) => void;
    setSortBy: (sortBy: SortBy) => void;
    setSortOrder: (order: SortOrder) => void;
    setFilterType: (type: FilterType) => void;
}

/**
 * Custom hook for filtering, sorting, and searching projects
 * Implements UJ-PM-007: Search & Filter Projects
 */
export function useProjectFilters(projects: ProjectListItem[]): UseProjectFiltersResult {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [filterType, setFilterType] = useState<FilterType>('all');

    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // 1. Filter by archive status
        if (filterType === 'active') {
            result = result.filter((p) => !p.isArchived);
        } else if (filterType === 'archived') {
            result = result.filter((p) => p.isArchived);
        }

        // 2. Filter by search query (name, client, project number)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((p) => {
                const matchesName = p.projectName.toLowerCase().includes(query);
                const matchesClient = p.clientName?.toLowerCase().includes(query) ?? false;
                const matchesNumber = p.projectNumber?.toLowerCase().includes(query) ?? false;
                return matchesName || matchesClient || matchesNumber;
            });
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === 'name') {
                const comparison = a.projectName.localeCompare(b.projectName);
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                // Sort by date (modifiedAt)
                const dateA = new Date(a.modifiedAt).getTime();
                const dateB = new Date(b.modifiedAt).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
        });

        return result;
    }, [projects, searchQuery, sortBy, sortOrder, filterType]);

    return {
        filteredProjects,
        totalCount: projects.length,
        filters: { searchQuery, sortBy, sortOrder, filterType },
        setSearchQuery,
        setSortBy,
        setSortOrder,
        setFilterType,
    };
}
