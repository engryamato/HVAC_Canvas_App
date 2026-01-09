'use client';

import ProjectCard from './ProjectCard';
import type { ProjectListItem } from '../store/projectListStore';
import { useProjectListActions } from '../store/projectListStore';

interface AllProjectsSectionProps {
    projects: ProjectListItem[];
    searchTerm?: string;
}

/**
 * All Projects section - displays all active projects (filtered by search)
 * Implements UJ-PM-002 Step 1 & 2: Project list and search results
 */
export function AllProjectsSection({ projects, searchTerm }: AllProjectsSectionProps) {
    const actions = useProjectListActions();

    return (
        <section data-testid="all-projects">
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                All Projects
            </h2>
            {projects.length > 0 ? (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.projectId}
                            project={project}
                            onDelete={actions.removeProject}
                            onArchive={actions.archiveProject}
                            onRestore={actions.restoreProject}
                            onDuplicate={actions.duplicateProject}
                            onRename={(id, name) => actions.updateProject(id, { projectName: name })}
                        />
                    ))}
                </div>
            ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                    {searchTerm
                        ? `No projects match "${searchTerm}"`
                        : 'No projects yet. Create your first project!'}
                </p>
            )}
        </section>
    );
}
