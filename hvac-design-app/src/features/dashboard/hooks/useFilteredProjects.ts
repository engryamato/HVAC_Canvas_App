import { useMemo } from 'react';
import type { ProjectListItem } from '../store/projectListStore';

/**
 * Hook to filter projects based on search term
 * Searches in project name, client name, and project number
 * Implements UJ-PM-002 Step 2: Real-time project filtering
 */
export function useFilteredProjects(
    projects: ProjectListItem[],
    searchTerm: string
): ProjectListItem[] {
    return useMemo(() => {
        if (!searchTerm || searchTerm.trim() === '') {
            return projects;
        }

        const term = searchTerm.toLowerCase().trim();

        return projects.filter((project) => {
            const matchesName = project.projectName.toLowerCase().includes(term);
            const matchesClient = project.clientName?.toLowerCase().includes(term);
            const matchesNumber = project.projectNumber?.includes(term);

            return matchesName || matchesClient || matchesNumber;
        });
    }, [projects, searchTerm]);
}
