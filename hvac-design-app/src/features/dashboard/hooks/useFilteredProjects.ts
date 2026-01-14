import { useMemo } from 'react';
import type { ProjectListItem } from '../store/projectListStore';

export type SortOption = 'name' | 'modified' | 'created';

/**
 * Hook to filter and sort projects based on search term and sort option
 * Searches in project name, client name, and project number
 * Implements UJ-PM-002 Step 2: Real-time project filtering
 * Implements UJ-PM-007: Search & Filter Projects with sorting
 */
export function useFilteredProjects(
    projects: ProjectListItem[],
    searchTerm: string,
    sortBy: SortOption = 'modified'
): ProjectListItem[] {
    return useMemo(() => {
        let filtered = projects;

        // Apply search filter
        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();

            filtered = projects.filter((project) => {
                const matchesName = project.projectName.toLowerCase().includes(term);
                const matchesClient = project.clientName?.toLowerCase().includes(term);
                const matchesNumber = project.projectNumber?.includes(term);

                return matchesName || matchesClient || matchesNumber;
            });
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.projectName.localeCompare(b.projectName);
                case 'modified':
                    return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
                case 'created':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default:
                    return 0;
            }
        });

        return sorted;
    }, [projects, searchTerm, sortBy]);
}
