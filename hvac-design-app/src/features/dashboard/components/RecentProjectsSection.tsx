'use client';

import ProjectCard from './ProjectCard';
import type { ProjectListItem } from '../store/projectListStore';
import { useProjectListActions } from '../store/projectListStore';

interface RecentProjectsSectionProps {
    projects: ProjectListItem[];
}

/**
 * Recent Projects section - displays last 10 accessed projects
 * Implements UJ-PM-002 Step 1: Recent Projects display
 */
export function RecentProjectsSection({ projects }: RecentProjectsSectionProps) {
    const actions = useProjectListActions();

    if (projects.length === 0) {
        return null; // Don't show section if no recent projects
    }

    return (
        <section data-testid="recent-projects" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                Recent Projects
            </h2>
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
        </section>
    );
}
