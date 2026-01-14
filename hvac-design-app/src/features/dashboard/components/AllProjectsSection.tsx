'use client';

import { ProjectGrid } from './ProjectGrid';
import type { ProjectListItem } from '../store/projectListStore';

interface AllProjectsSectionProps {
    projects: ProjectListItem[];
    searchTerm?: string;
    emptyMessage?: string;
}

/**
 * All Projects section - displays all active projects (filtered by search)
 * Implements UJ-PM-002 Step 1 & 2: Project list and search results
 */
export function AllProjectsSection({ projects, searchTerm, emptyMessage }: AllProjectsSectionProps) {

    return (
        <section data-testid="all-projects">
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                All Projects
            </h2>
            {projects.length > 0 ? (
                <ProjectGrid projects={projects} />
            ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                    {searchTerm
                        ? `No projects match "${searchTerm}"`
                        : emptyMessage || 'No projects yet. Create your first project!'}
                </p>
            )}
        </section>
    );
}
