'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import {
  useActiveProjects,
  useArchivedProjects,
  useProjectListActions,
  type ProjectListItem,
} from '@/features/dashboard/store/projectListStore';
import { useAuthStore } from '@/core/store/auth.store';
import { NewProjectDialog } from '@/features/dashboard/components/NewProjectDialog';
import { ConfirmDialog } from '@/features/dashboard/components/ConfirmDialog';
import { ProjectCard } from '@/features/dashboard/components/ProjectCard';
import styles from './page.module.css';

type TabType = 'active' | 'archived';

interface ConfirmState {
  type: 'delete' | 'archive' | null;
  projectId: string | null;
  projectName: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    type: null,
    projectId: null,
    projectName: null,
  });

  const activeProjects = useActiveProjects();
  const archivedProjects = useArchivedProjects();
  const {
    addProject,
    updateProject,
    removeProject,
    archiveProject,
    restoreProject,
    duplicateProject,
  } = useProjectListActions();

  const handleCreateProject = useCallback(
    (projectData: { projectName: string; projectNumber?: string; clientName?: string }) => {
      const now = new Date().toISOString();
      const projectId = crypto.randomUUID();
      const currentUserId = user?.id;

      if (!currentUserId) {
        console.error('No user logged in');
        return;
      }

      const newProject: ProjectListItem = {
        projectId,
        projectName: projectData.projectName,
        projectNumber: projectData.projectNumber,
        clientName: projectData.clientName,
        createdAt: now,
        modifiedAt: now,
        storagePath: `project-${projectId}`,
        isArchived: false,
        userId: currentUserId, // Associate with current user
      };

      addProject(newProject);
      setIsNewProjectOpen(false);
    },
    [addProject, user]
  );

  const handleDeleteConfirm = useCallback(
    (projectId: string) => {
      const project =
        activeProjects.find((p) => p.projectId === projectId) ||
        archivedProjects.find((p) => p.projectId === projectId);
      if (project) {
        setConfirmState({
          type: 'delete',
          projectId,
          projectName: project.projectName,
        });
      }
    },
    [activeProjects, archivedProjects]
  );

  const handleArchiveConfirm = useCallback(
    (projectId: string) => {
      const project = activeProjects.find((p) => p.projectId === projectId);
      if (project) {
        setConfirmState({
          type: 'archive',
          projectId,
          projectName: project.projectName,
        });
      }
    },
    [activeProjects]
  );

  const handleConfirmAction = useCallback(() => {
    if (!confirmState.projectId) {return;}

    if (confirmState.type === 'delete') {
      // Remove from project list store
      removeProject(confirmState.projectId);
      // TODO: Also delete the saved project data from localStorage
    } else if (confirmState.type === 'archive') {
      archiveProject(confirmState.projectId);
    }

    setConfirmState({ type: null, projectId: null, projectName: null });
  }, [confirmState, removeProject, archiveProject]);

  const handleDuplicate = useCallback(
    (projectId: string) => {
      const project =
        activeProjects.find((p) => p.projectId === projectId) ||
        archivedProjects.find((p) => p.projectId === projectId);
      if (project) {
        duplicateProject(projectId, `${project.projectName} (Copy)`);
      }
    },
    [activeProjects, archivedProjects, duplicateProject]
  );

  const handleRename = useCallback(
    (projectId: string, newName: string) => {
      updateProject(projectId, { projectName: newName });
    },
    [updateProject]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, router]);

  const currentProjects = activeTab === 'active' ? activeProjects : archivedProjects;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Project Dashboard</h1>
          <span className={styles.projectCount}>
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.newProjectButton} onClick={() => setIsNewProjectOpen(true)}>
            + New Project
          </button>
          <div className={styles.userSection}>
            {user?.picture && (
              <img src={user.picture} alt={user.name} className={styles.userAvatar} />
            )}
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Projects ({activeProjects.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'archived' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived ({archivedProjects.length})
        </button>
      </div>

      {currentProjects.length === 0 ? (
        <div className={styles.emptyState}>
          {activeTab === 'active' ? (
            <>
              <h2>No projects yet</h2>
              <p>Create your first HVAC design project to get started.</p>
              <button
                className={styles.newProjectButton}
                onClick={() => setIsNewProjectOpen(true)}
              >
                + Create Project
              </button>
            </>
          ) : (
            <>
              <h2>No archived projects</h2>
              <p>Projects you archive will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {currentProjects.map((project) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              onDelete={handleDeleteConfirm}
              onArchive={handleArchiveConfirm}
              onRestore={restoreProject}
              onDuplicate={handleDuplicate}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      <NewProjectDialog
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <ConfirmDialog
        isOpen={confirmState.type !== null}
        title={confirmState.type === 'delete' ? 'Delete Project' : 'Archive Project'}
        message={
          confirmState.type === 'delete'
            ? `Are you sure you want to permanently delete "${confirmState.projectName}"? This action cannot be undone.`
            : `Are you sure you want to archive "${confirmState.projectName}"? You can restore it later from the Archived tab.`
        }
        confirmLabel={confirmState.type === 'delete' ? 'Delete' : 'Archive'}
        variant={confirmState.type === 'delete' ? 'danger' : 'warning'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ type: null, projectId: null, projectName: null })}
      />
    </div>
  );
}
