import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface ProjectMeta {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  entityCount: number;
  archived?: boolean;
}

interface ProjectListState {
  projects: ProjectMeta[];
  loading: boolean;
  error?: string;
}

interface ProjectListActions {
  refresh: () => void;
  createProject: (name: string) => ProjectMeta;
  openProject: (path: string) => ProjectMeta | undefined;
  archiveProject: (path: string) => void;
  deleteProject: (path: string) => void;
  duplicateProject: (path: string, newName?: string) => ProjectMeta | undefined;
  renameProject: (path: string, newName: string) => void;
  updateEntityCount: (path: string, count: number) => void;
}

type ProjectListStore = ProjectListState & ProjectListActions;

const INDEX_KEY = 'sws.projectIndex';

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function createPath(name: string) {
  return `/projects/${name.replace(/[^a-z0-9\-]+/gi, '_')}.sws`;
}

function makeProject(name: string): ProjectMeta {
  const normalized = normalizeName(name);
  return {
    id: nanoid(),
    name: normalized,
    path: createPath(normalized),
    lastModified: new Date().toISOString(),
    entityCount: 0,
  };
}

export const useProjectListStore = create<ProjectListStore>()(
  persist(
    (set, get) => ({
      projects: [],
      loading: false,

      refresh: () => {
        const state = get();
        if (!state.loading) {
          set({ projects: [...state.projects] });
        }
      },

      createProject: (name) => {
        const project = makeProject(name);
        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },

      openProject: (path) => get().projects.find((p) => p.path === path),

      archiveProject: (path) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.path === path ? { ...p, archived: true, lastModified: new Date().toISOString() } : p
          ),
        })),

      deleteProject: (path) =>
        set((state) => ({ projects: state.projects.filter((p) => p.path !== path) })),

      duplicateProject: (path, newName) => {
        const source = get().projects.find((p) => p.path === path);
        if (!source) return undefined;
        const duplicate = makeProject(newName ?? `${source.name} Copy`);
        set((state) => ({ projects: [duplicate, ...state.projects] }));
        return duplicate;
      },

      renameProject: (path, newName) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.path === path
              ? { ...p, name: normalizeName(newName), path: createPath(newName), lastModified: new Date().toISOString() }
              : p
          ),
        })),

      updateEntityCount: (path, count) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.path === path ? { ...p, entityCount: count } : p)),
        })),
    }),
    { name: INDEX_KEY }
  )
);

export const useProjects = () => useProjectListStore((state) => state.projects);
export const useProjectListActions = () =>
  useProjectListStore((state) => ({
    refresh: state.refresh,
    createProject: state.createProject,
    openProject: state.openProject,
    archiveProject: state.archiveProject,
    deleteProject: state.deleteProject,
    duplicateProject: state.duplicateProject,
    renameProject: state.renameProject,
    updateEntityCount: state.updateEntityCount,
  }));
