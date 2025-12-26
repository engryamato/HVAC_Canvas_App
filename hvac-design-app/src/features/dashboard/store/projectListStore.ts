import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from '@/core/store/auth.store';

export interface ProjectListItem {
  projectId: string;
  projectName: string;
  projectNumber?: string;
  clientName?: string;
  createdAt: string;
  modifiedAt: string;
  storagePath: string;
  isArchived: boolean;
  userId: string; // Associate project with user
}

interface ProjectListState {
  projects: ProjectListItem[];
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
}

type ProjectListStore = ProjectListState & ProjectListActions;

const INDEX_KEY = 'sws.projectIndex';

export const useProjectListStore = create<ProjectListStore>()(
  persist(
    (set, get) => ({
      projects: [],
      loading: false,

      addProject: (project) => {
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
    }),
    { name: INDEX_KEY }
  )
);

export const useProjects = () => {
  const currentUserId = useAuthStore.getState().user?.id;
  return useProjectListStore((state) =>
    state.projects.filter((p) => p.userId === currentUserId)
  );
};

export const useActiveProjects = () => {
  const currentUserId = useAuthStore.getState().user?.id;
  return useProjectListStore((state) =>
    state.projects.filter((p) => !p.isArchived && p.userId === currentUserId)
  );
};

export const useArchivedProjects = () => {
  const currentUserId = useAuthStore.getState().user?.id;
  return useProjectListStore((state) =>
    state.projects.filter((p) => p.isArchived && p.userId === currentUserId)
  );
};
export const useProjectListActions = () =>
  useProjectListStore((state) => ({
    addProject: state.addProject,
    updateProject: state.updateProject,
    removeProject: state.removeProject,
    archiveProject: state.archiveProject,
    restoreProject: state.restoreProject,
    duplicateProject: state.duplicateProject,
  }));
