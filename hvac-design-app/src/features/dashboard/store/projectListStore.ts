import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/utils/logger';
import { createStorageAdapter } from '@/core/persistence/factory';
import { StorageAdapter } from '@/core/persistence/StorageAdapter';
// type ProjectListItem as OriginalProjectListItem removed

export interface ProjectListItem {
  projectId: string;
  projectName: string;
  projectNumber?: string;
  clientName?: string;
  entityCount?: number;
  createdAt: string;
  modifiedAt: string;
  storagePath: string;
  isArchived: boolean;
  filePath?: string; // Kept for compatibility, may be mapped from storage result
}

interface ProjectListState {
  projects: ProjectListItem[];
  recentProjectIds: string[];
  loading: boolean;
  error?: string;
}

interface ProjectListActions {
  addProject: (project: ProjectListItem) => void;
  updateProject: (projectId: string, updates: Partial<ProjectListItem>) => void;
  removeProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  restoreProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string, newName: string) => Promise<void>;
  markAsOpened: (projectId: string) => void;
  
  /**
   * Refreshes the project list from the underlying storage adapter.
   * Works for both Tauri (filesystem) and Web (IndexedDB).
   */
  refreshProjects: () => Promise<void>;
  
  /**
   * Re-syncs a single project's metadata from storage.
   */
  syncProject: (projectId: string) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
}

type ProjectListStore = ProjectListState & ProjectListActions;

const INDEX_KEY = 'sws.projectIndex';

// Lazy adapter initialization
let adapterPromise: Promise<StorageAdapter> | null = null;
const getAdapter = () => {
  if (!adapterPromise) {
    adapterPromise = createStorageAdapter();
  }
  return adapterPromise;
};

export const useProjectListStore = create<ProjectListStore>()(
  persist(
    (set, get) => ({
      projects: [],
      recentProjectIds: [],
      loading: false,

      // === Local State Helpers (Optimistic Updates) ===
      addProject: (project) => {
        const validatedProject = {
          ...project,
          projectName: project.projectName?.trim() || 'Untitled Project',
        };
        logger.debug('[ProjectListStore] Adding project:', validatedProject);
        set((state) => ({ projects: [validatedProject, ...state.projects] }));
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

      // === Storage Operations ===

      removeProject: async (projectId) => {
        try {
          const adapter = await getAdapter();
          const result = await adapter.deleteProject(projectId);

          if (!result.success) {
             throw new Error(result.error || 'Failed to delete project');
          }

          // Update state
          set((state) => ({
            projects: state.projects.filter((p) => p.projectId !== projectId),
            recentProjectIds: state.recentProjectIds.filter((id) => id !== projectId),
          }));
          
          logger.info('[ProjectListStore] Project deleted:', projectId);
        } catch (error) {
          logger.error('[ProjectListStore] Error removing project:', error);
          throw error;
        }
      },

      archiveProject: async (projectId) => {
        const project = get().projects.find((p) => p.projectId === projectId);
        if (!project) {return;}

        // Optimistic update
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: true, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));

        try {
          const adapter = await getAdapter();
          await adapter.updateMetadata(projectId, { isArchived: true });
          logger.info('[ProjectListStore] Project archived:', projectId);
        } catch (error) {
          logger.error('[ProjectListStore] Failed to archive project:', error);
          // Rollback
          set((state) => ({
            projects: state.projects.map((p) =>
              p.projectId === projectId ? { ...p, isArchived: false } : p
            ),
          }));
          throw error;
        }
      },

      restoreProject: async (projectId) => {
        const project = get().projects.find((p) => p.projectId === projectId);
        if (!project) {return;}

        // Optimistic update
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: false, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));

        try {
          const adapter = await getAdapter();
          await adapter.updateMetadata(projectId, { isArchived: false });
          logger.info('[ProjectListStore] Project restored:', projectId);
        } catch (error) {
          logger.error('[ProjectListStore] Failed to restore project:', error);
          // Rollback
          set((state) => ({
            projects: state.projects.map((p) =>
              p.projectId === projectId ? { ...p, isArchived: true } : p
            ),
          }));
          throw error;
        }
      },

      duplicateProject: async (projectId, newName) => {
        try {
          const adapter = await getAdapter();
          const result = await adapter.duplicateProject(projectId, newName);

          if (!result.success || !result.project) {
            throw new Error(result.error || 'Failed to duplicate project');
          }

          // Add new project to state
          const newProject: ProjectListItem = {
            projectId: result.project.projectId,
            projectName: result.project.projectName,
            projectNumber: result.project.projectNumber,
            clientName: result.project.clientName,
            // entityCount not readily available in partial result unless extra logic
            // but adapter usually returns loaded project
            entityCount: 0, 
            createdAt: result.project.createdAt,
            modifiedAt: result.project.modifiedAt,
            // Use virtual path or file path
            storagePath: result.source === 'file' ? (result as any).filePath || '' : `indexeddb://${result.project.projectId}`,
            isArchived: false,
            filePath: (result as any).filePath, // Only present if 'file' source
          };

          set((state) => ({ projects: [newProject, ...state.projects] }));
          logger.info('[ProjectListStore] Project duplicated:', newName);
        } catch (error) {
          logger.error('[ProjectListStore] Duplicate failed:', error);
          throw error;
        }
      },

      refreshProjects: async () => {
        set({ loading: true, error: undefined });
        try {
          const adapter = await getAdapter();
          const projects = await adapter.listProjects();

          // Map metadata to ProjectListItem
          // Ideally we keep ProjectMetadata type consistent with ProjectListItem
          // But ProjectListItem has extra fields like 'storagePath'.
          
          const projectItems: ProjectListItem[] = projects.map(p => ({
            projectId: p.projectId,
            projectName: p.projectName,
            projectNumber: p.projectNumber,
            clientName: p.clientName,
            entityCount: 0, // Metadata doesn't usually carry entity count
            createdAt: p.createdAt,
            modifiedAt: p.modifiedAt,
            isArchived: !!p.isArchived,
            // In Tauri adapter, listProjects returns valid metadata. 
            // StoragePath/FilePath might need to be inferred or is not critical for list
            storagePath: '', 
            filePath: undefined // Can update this if adapter returns it, but listProjects returns ProjectMetadata[] which usually doesn't have system path
          }));

          set({ projects: projectItems, loading: false });
          logger.info(`[ProjectListStore] Refreshed ${projectItems.length} projects`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to refresh projects';
          logger.error('[ProjectListStore] Refresh failed:', error);
          set({ error: msg, loading: false });
        }
      },

      syncProject: async (projectId) => {
        try {
          const adapter = await getAdapter();
          const result = await adapter.loadProject(projectId);
          
          if (result.success && result.project) {
            get().updateProject(projectId, {
              projectName: result.project.projectName,
              projectNumber: result.project.projectNumber,
              clientName: result.project.clientName,
              modifiedAt: result.project.modifiedAt,
              isArchived: !!result.project.isArchived,
            });
            logger.debug('[ProjectListStore] Synced project:', projectId);
          }
        } catch (error) {
          logger.error('[ProjectListStore] Sync failed:', error);
        }
      },

      markAsOpened: (projectId) => {
        set((state) => {
          const updatedProjects = state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, modifiedAt: new Date().toISOString() }
              : p
          );
          const newRecent = [
            projectId,
            ...state.recentProjectIds.filter((id) => id !== projectId),
          ].slice(0, 5);
          return { projects: updatedProjects, recentProjectIds: newRecent };
        });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: INDEX_KEY,
      storage: createJSONStorage(() => {
        if (typeof globalThis.window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Simple merge logic
      merge: (persistedState: unknown, currentState: ProjectListStore): ProjectListStore => {
         const persisted = (persistedState && typeof persistedState === 'object') 
          ? persistedState as Partial<ProjectListState> 
          : null;
        
        if (!persisted) {return currentState;}

        const validProjects = Array.isArray(persisted.projects) ? persisted.projects : [];
        const validRecentIds = Array.isArray(persisted.recentProjectIds) ? persisted.recentProjectIds : [];

        return {
          ...currentState,
          projects: validProjects,
          recentProjectIds: validRecentIds,
        };
      },
      skipHydration: true,
    }
  )
);

export const rehydrateProjectList = async () => {
  await useProjectListStore.persist.rehydrate();
};

// Selectors
export const useProjects = () => useProjectListStore((state) => state.projects);
export const useActiveProjects = () => {
  const projects = useProjects();
  return useMemo(() => projects.filter((p) => !p.isArchived), [projects]);
};
export const useArchivedProjects = () => {
  const projects = useProjects();
  return useMemo(() => projects.filter((p) => p.isArchived), [projects]);
};
export const useRecentProjects = () => {
  const projects = useProjects();
  const recentProjectIds = useProjectListStore((state) => state.recentProjectIds);
  return useMemo(
    () =>
      recentProjectIds
        .map((id) => projects.find((p) => p.projectId === id))
        .filter((project): project is ProjectListItem => project !== undefined && !project.isArchived),
    [projects, recentProjectIds]
  );
};

export const useProjectListActions = () =>
  useProjectListStore(
    useShallow((state) => ({
      addProject: state.addProject,
      updateProject: state.updateProject,
      removeProject: state.removeProject,
      archiveProject: state.archiveProject,
      restoreProject: state.restoreProject,
      duplicateProject: state.duplicateProject,
      markAsOpened: state.markAsOpened,
      refreshProjects: state.refreshProjects,
      syncProject: state.syncProject,
    }))
  );
