import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectDetails, ProjectFile } from '@/core/schema/project-file.schema';

/**
 * Storage key prefix for project data
 */
const getProjectStorageKey = (projectId: string) => `hvac-project-${projectId}`;

/**
 * Load project data from localStorage
 */
function loadProjectData(projectId: string): ProjectFile | null {
  try {
    const key = getProjectStorageKey(projectId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as ProjectFile;
  } catch {
    return null;
  }
}

/**
 * Save project data to localStorage
 */
function saveProjectData(projectId: string, project: ProjectFile): boolean {
  try {
    const key = getProjectStorageKey(projectId);
    localStorage.setItem(key, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

/**
 * Project list item with additional metadata
 */
export interface ProjectListItem extends ProjectDetails {
  /** File path for persistence (web uses localStorage key) */
  storagePath: string;
  /** Last opened timestamp */
  lastOpenedAt?: string;
  /** Whether the project is archived */
  isArchived?: boolean;
}

interface ProjectListState {
  /** List of all projects */
  projects: ProjectListItem[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

interface ProjectListActions {
  /** Add a new project to the list */
  addProject: (project: ProjectListItem) => void;
  /** Update project metadata */
  updateProject: (projectId: string, updates: Partial<ProjectListItem>) => void;
  /** Remove a project from the list */
  removeProject: (projectId: string) => void;
  /** Archive a project (soft delete) */
  archiveProject: (projectId: string) => void;
  /** Restore an archived project */
  restoreProject: (projectId: string) => void;
  /** Duplicate a project */
  duplicateProject: (projectId: string, newName: string) => ProjectListItem | null;
  /** Update last opened timestamp */
  markAsOpened: (projectId: string) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error */
  setError: (error: string | null) => void;
  /** Clear all projects */
  clearProjects: () => void;
}

type ProjectListStore = ProjectListState & ProjectListActions;

const initialState: ProjectListState = {
  projects: [],
  isLoading: false,
  error: null,
};

export const useProjectListStore = create<ProjectListStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects.filter((p) => p.projectId !== project.projectId)],
        })),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId ? { ...p, ...updates, modifiedAt: new Date().toISOString() } : p
          ),
        })),

      removeProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.projectId !== projectId),
        })),

      archiveProject: (projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId ? { ...p, isArchived: true } : p
          ),
        })),

      restoreProject: (projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId ? { ...p, isArchived: false } : p
          ),
        })),

      duplicateProject: (projectId, newName) => {
        const state = get();
        const original = state.projects.find((p) => p.projectId === projectId);
        if (!original) return null;

        const now = new Date().toISOString();
        const newId = crypto.randomUUID();
        const newProject: ProjectListItem = {
          ...original,
          projectId: newId,
          projectName: newName,
          createdAt: now,
          modifiedAt: now,
          storagePath: `project-${newId}`,
          lastOpenedAt: undefined,
          isArchived: false,
        };

        // Also duplicate the saved project data from localStorage
        const originalData = loadProjectData(projectId);
        if (originalData) {
          const duplicatedData: ProjectFile = {
            ...originalData,
            projectId: newId,
            projectName: newName,
            createdAt: now,
            modifiedAt: now,
          };
          saveProjectData(newId, duplicatedData);
        }

        set((state) => ({
          projects: [newProject, ...state.projects],
        }));

        return newProject;
      },

      markAsOpened: (projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId ? { ...p, lastOpenedAt: new Date().toISOString() } : p
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearProjects: () => set({ projects: [] }),
    }),
    {
      name: 'hvac-project-list',
      version: 1,
    }
  )
);

// Hook selectors
export const useProjects = () => useProjectListStore((state) => state.projects);
export const useActiveProjects = () =>
  useProjectListStore((state) => state.projects.filter((p) => !p.isArchived));
export const useArchivedProjects = () =>
  useProjectListStore((state) => state.projects.filter((p) => p.isArchived));
export const useProjectById = (projectId: string) =>
  useProjectListStore((state) => state.projects.find((p) => p.projectId === projectId));
export const useIsLoading = () => useProjectListStore((state) => state.isLoading);
export const useProjectListError = () => useProjectListStore((state) => state.error);

// Actions hook
export const useProjectListActions = () =>
  useProjectListStore((state) => ({
    addProject: state.addProject,
    updateProject: state.updateProject,
    removeProject: state.removeProject,
    archiveProject: state.archiveProject,
    restoreProject: state.restoreProject,
    duplicateProject: state.duplicateProject,
    markAsOpened: state.markAsOpened,
    setLoading: state.setLoading,
    setError: state.setError,
    clearProjects: state.clearProjects,
  }));
