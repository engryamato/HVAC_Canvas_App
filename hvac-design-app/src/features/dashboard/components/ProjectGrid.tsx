'use client';

import ProjectCard from './ProjectCard';
import type { ProjectListItem } from '../store/projectListStore';
import { useProjectListActions, useProjects } from '../store/projectListStore';

interface ProjectGridProps {
    projects: ProjectListItem[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
    const actions = useProjectListActions();
    const allProjects = useProjects();

    const handleDuplicate = (projectId: string) => {
        const project = allProjects.find(p => p.projectId === projectId);
        if (!project) return;

        let newName = `${project.projectName} - Copy`;
        let counter = 2;

        // Check against ALL projects to ensure unique name
        while (allProjects.some(p => p.projectName === newName)) {
            newName = `${project.projectName} - Copy ${counter}`;
            counter++;
        }

        actions.duplicateProject(projectId, newName);
    };

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
                    onDuplicate={handleDuplicate}
                    onRename={(id, name) => actions.updateProject(id, { projectName: name })}
                />
            ))}
        </div>
    );
}
