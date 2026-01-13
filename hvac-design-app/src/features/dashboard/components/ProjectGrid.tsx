'use client';

import ProjectCard from './ProjectCard';
import type { ProjectListItem } from '../store/projectListStore';
import { useProjectListActions } from '../store/projectListStore';

interface ProjectGridProps {
    projects: ProjectListItem[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
    const actions = useProjectListActions();

    return (
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
    );
}
