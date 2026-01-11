import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/utils/logger';

export interface ProjectListItem {
  projectId: string;
  projectName: string;
  projectNumber?: string;
  clientName?: string;
  entityCount?: number; // Number of entities in project
  createdAt: string;
  modifiedAt: string;
  storagePath: string;
  isArchived: boolean;
}

interface ProjectListState {
  projects: ProjectListItem[];
  recentProjectIds: string[]; // Max 10 project IDs, ordered by access time (most recent first)
  loading: boolean;
  error?: string;
}

interface ProjectListActions {
  addProject: (project: ProjectListItem) => void;
  updateProject: (projectId: string, updates: Partial<ProjectListItem>) => void;
  removeProject: (projectId: string) => void;
  archiveProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  duplicateProject: (projectId: string, newName: string) => void;
  markAsOpened: (projectId: string) => void; // Track project access for Recent Projects
}

type ProjectListStore = ProjectListState & ProjectListActions;

const INDEX_KEY = 'sws.projectIndex';

export const useProjectListStore = create<ProjectListStore>()(
  persist(
    (set, get) => ({
      projects: [],
      recentProjectIds: [],
      loading: false,

      addProject: (project) => {
        logger.debug('[ProjectListStore] Adding project:', project);
        set((state) => ({ projects: [project, ...state.projects] }));
      },

      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, ...updates, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      removeProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.projectId !== projectId),
        }));
      },

      archiveProject: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: true, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      restoreProject: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: false, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      duplicateProject: (projectId, newName) => {
        const source = get().projects.find((p) => p.projectId === projectId);
        if (!source) {
          return;
        }
        const now = new Date().toISOString();
        const newProjectId = crypto.randomUUID();
        const newProject: ProjectListItem = {
          ...source,
          projectId: newProjectId,
          projectName: newName,
          createdAt: now,
          modifiedAt: now,
          storagePath: `project-${newProjectId}`,
          isArchived: false,
        };
        set((state) => ({ projects: [newProject, ...state.projects] }));
      },

      markAsOpened: (projectId) => {
        set((state) => {
          // Update modifiedAt timestamp
          const updatedProjects = state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, modifiedAt: new Date().toISOString() }
              : p
          );

          // Update recent list: add to front, remove duplicates, limit to 5
          const newRecent = [
            projectId,
            ...state.recentProjectIds.filter((id) => id !== projectId),
          ].slice(0, 5);

          return {
            projects: updatedProjects,
            recentProjectIds: newRecent,
          };
        });
      },
    }),
    {
      name: INDEX_KEY,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        console.log('[ProjectListStore] Hydration finished', state);
      },
    }
  )
);

export const useProjects = () => useProjectListStore((state) => state.projects);
export const useActiveProjects = () =>
  useProjectListStore((state) => state.projects.filter((p) => !p.isArchived));
export const useArchivedProjects = () =>
  useProjectListStore((state) => state.projects.filter((p) => p.isArchived));

// Selector for recent projects (max 10, ordered by access time)
export const useRecentProjects = () =>
  useProjectListStore((state) => {
    // Ensure hydration has occurred or fallback
    return (state.recentProjectIds || [])
      .map((id) => (state.projects || []).find((p) => p.projectId === id))
      .filter((p): p is ProjectListItem => p !== undefined);
  });

export const useProjectListActions = () =>
  useProjectListStore((state) => ({
    addProject: state.addProject,
    updateProject: state.updateProject,
    removeProject: state.removeProject,
    archiveProject: state.archiveProject,
    restoreProject: state.restoreProject,
    duplicateProject: state.duplicateProject,
    markAsOpened: state.markAsOpened,
  }));
