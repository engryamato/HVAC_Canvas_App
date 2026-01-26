'use client';

import ProjectCard from './ProjectCard';
import type { ProjectListItem } from '../store/projectListStore';
import { useProjectListActions, useProjects } from '../store/projectListStore';

interface ProjectGridProps {
    projects: ProjectListItem[];
}

/**
 * ProjectGrid - Modern Engineering Bento Grid 2025
 * Responsive grid layout with staggered animation delays
 */
export function ProjectGrid({ projects }: ProjectGridProps) {
    const actions = useProjectListActions();
    const allProjects = useProjects();

    const handleDuplicate = (projectId: string) => {
        const project = allProjects.find(p => p.projectId === projectId);
        if (!project) {
            return;
        }

        const rawName = project.projectName;
        const sourceName = (rawName && rawName !== 'undefined' && rawName.trim() !== '') 
            ? rawName 
            : 'Untitled Project';

        let newName = `${sourceName} - Copy`;
        let counter = 2;

        while (allProjects.some(p => p.projectName === newName)) {
            newName = `${sourceName} - Copy ${counter}`;
            counter++;
        }

        actions.duplicateProject(projectId, newName);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((project, index) => (
                <ProjectCard
                    key={project.projectId}
                    project={project}
                    onDelete={actions.removeProject}
                    onArchive={actions.archiveProject}
                    onRestore={actions.restoreProject}
                    onDuplicate={handleDuplicate}
                    onRename={(id, name) => actions.updateProject(id, { projectName: name })}
                    animationDelay={index * 50}
                />
            ))}
        </div>
    );
}
