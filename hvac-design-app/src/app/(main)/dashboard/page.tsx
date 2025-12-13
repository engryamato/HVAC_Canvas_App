'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './page.module.css';
import { NewProjectDialog } from '@/features/dashboard/components/NewProjectDialog';
import { ProjectCard } from '@/features/dashboard/components/ProjectCard';
import { useProjects, useProjectListActions } from '@/features/dashboard/store/projectListStore';

export default function Dashboard() {
  const projects = useProjects();
  const actions = useProjectListActions();
  const [showDialog, setShowDialog] = useState(false);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.lastModified.localeCompare(a.lastModified)),
    [projects]
  );

  const recentProjects = sortedProjects.slice(0, 4);

  const handleCreate = (name: string) => {
    const project = actions.createProject(name);
    actions.openProject(project.path);
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Projects</p>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>Manage, create, and open your HVAC design projects.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primary} onClick={() => setShowDialog(true)}>
            New Project
          </button>
          <Link href="/" className={styles.secondary}>
            Back to Home
          </Link>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Projects</h2>
          <span className={styles.badge}>{recentProjects.length}</span>
        </div>
        {recentProjects.length === 0 ? (
          <p className={styles.empty}>No recent projects yet. Create one to get started.</p>
        ) : (
          <div className={styles.grid}>
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => actions.openProject(project.path)}
                onArchive={() => actions.archiveProject(project.path)}
                onDelete={() => actions.deleteProject(project.path)}
                onDuplicate={() => actions.duplicateProject(project.path)}
                onRename={(p, name) => actions.renameProject(p.path, name)}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>All Projects</h2>
          <span className={styles.badge}>{sortedProjects.length}</span>
        </div>
        {sortedProjects.length === 0 ? (
          <p className={styles.empty}>Create your first project to see it here.</p>
        ) : (
          <div className={styles.grid}>
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => actions.openProject(project.path)}
                onArchive={() => actions.archiveProject(project.path)}
                onDelete={() => actions.deleteProject(project.path)}
                onDuplicate={() => actions.duplicateProject(project.path)}
                onRename={(p, name) => actions.renameProject(p.path, name)}
              />
            ))}
          </div>
        )}
      </section>

      <NewProjectDialog open={showDialog} onClose={() => setShowDialog(false)} onCreate={handleCreate} />
    </div>
  );
}
