import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectFilters } from '../hooks/useProjectFilters';
import type { ProjectListItem } from '../store/projectListStore';

const mockProjects: ProjectListItem[] = [
    {
        projectId: '1',
        projectName: 'Alpha Project',
        clientName: 'Client A',
        modifiedAt: '2023-01-01T10:00:00Z',
        createdAt: '2023-01-01T10:00:00Z',
        isArchived: false,
        storagePath: 'path/1', 
        entityCount: 10
    },
    {
        projectId: '2',
        projectName: 'Beta Project',
        clientName: 'Client B',
        modifiedAt: '2023-01-02T10:00:00Z', // Newer
        createdAt: '2023-01-02T10:00:00Z',
        isArchived: false,
        storagePath: 'path/2',
        entityCount: 5
    },
    {
        projectId: '3',
        projectName: 'Archived Project',
        clientName: 'Client A',
        modifiedAt: '2022-01-01T10:00:00Z',
        createdAt: '2022-01-01T10:00:00Z',
        isArchived: true,
        storagePath: 'path/3',
        entityCount: 0
    }
];

describe('useProjectFilters', () => {
    it('should return all projects by default', () => {
        const { result } = renderHook(() => useProjectFilters(mockProjects));
        expect(result.current.filteredProjects).toHaveLength(3);
        expect(result.current.totalCount).toBe(3);
    });

    it('should filter by archive status', () => {
        const { result } = renderHook(() => useProjectFilters(mockProjects));

        act(() => {
            result.current.setFilterType('active');
        });
        expect(result.current.filteredProjects).toHaveLength(2);
        expect(result.current.filteredProjects.find(p => p.isArchived)).toBeUndefined();

        act(() => {
            result.current.setFilterType('archived');
        });
        expect(result.current.filteredProjects).toHaveLength(1);
        expect(result.current.filteredProjects[0]!.isArchived).toBe(true);
    });

    it('should filter by search query', () => {
        const { result } = renderHook(() => useProjectFilters(mockProjects));

        act(() => {
            result.current.setSearchQuery('Alpha');
        });
        expect(result.current.filteredProjects).toHaveLength(1);
        expect(result.current.filteredProjects[0]!.projectName).toBe('Alpha Project');

        act(() => {
            result.current.setSearchQuery('Client A');
        });
        expect(result.current.filteredProjects).toHaveLength(2); // Alpha and Archived
    });

    it('should sort projects', () => {
        const { result } = renderHook(() => useProjectFilters(mockProjects));

        // Sort by Name Asc
        act(() => {
            result.current.setSortBy('name');
            result.current.setSortOrder('asc');
        });
        expect(result.current.filteredProjects[0]!.projectName).toBe('Alpha Project');
        expect(result.current.filteredProjects[1]!.projectName).toBe('Archived Project'); // Alpha -> Archived -> Beta

        // Sort by Date Desc (Newest first)
        act(() => {
            result.current.setSortBy('date');
            result.current.setSortOrder('desc');
        });
        expect(result.current.filteredProjects[0]!.projectName).toBe('Beta Project'); // 2023-01-02
        expect(result.current.filteredProjects[2]!.projectName).toBe('Archived Project'); // 2022
    });
});
