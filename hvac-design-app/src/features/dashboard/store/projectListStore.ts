import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/utils/logger';
import { getProjectRepository } from '@/core/persistence/ProjectRepository';
import { isTauri } from '@/core/persistence/filesystem';
import { useStorageStore } from '@/core/store/storageStore';

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
  status?: 'draft' | 'in-progress' | 'complete';
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

/**
 * Compute the canonical on-disk path for a project on Tauri.
 * Returns undefined on web (where IndexedDB is used instead).
 */
function canonicalFilePath(projectId: string): string | undefined {
  const storageRoot = useStorageStore.getState().storageRootPath;
  if (!storageRoot || !isTauri()) {
    return undefined;
  }
  const norm = storageRoot.replace(/[\\/]+$/, '');
  return `${norm}/projects/${projectId}/project.sws`;
}

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
          status: project.status || 'draft',
        };
        logger.debug('[ProjectListStore] Adding project:', validatedProject);
        if (get().projects.some((p) => p.projectId === validatedProject.projectId)) {
          logger.warn('[ProjectListStore] Duplicate project ID detected, skipping add:', validatedProject.projectId);
          return;
        }
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
        // Capture current state for rollback
        const removedProject = get().projects.find((p) => p.projectId === projectId);
        const removedRecentIdx = get().recentProjectIds.indexOf(projectId);

        // ── Optimistic update (synchronous) ──────────────────────────────────
        set((state) => ({
          projects: state.projects.filter((p) => p.projectId !== projectId),
          recentProjectIds: state.recentProjectIds.filter((id) => id !== projectId),
        }));

        // ── Persist deletion to storage (async) ──────────────────────────────
        try {
          const repo = await getProjectRepository();
          const result = await repo.deleteProject(projectId);

          if (!result.success) {
            throw new Error(result.error || 'Failed to delete project');
          }

          logger.info('[ProjectListStore] Project deleted:', projectId);
        } catch (error) {
          logger.error('[ProjectListStore] Error removing project, rolling back:', error);
          // Roll back the optimistic removal
          if (removedProject) {
            set((state) => {
              const projects = [...state.projects, removedProject];
              const recentProjectIds = [...state.recentProjectIds];
              if (removedRecentIdx !== -1) {
                recentProjectIds.splice(removedRecentIdx, 0, projectId);
              }
              return { projects, recentProjectIds };
            });
          }
          throw error;
        }
      },

      archiveProject: async (projectId) => {
        const project = get().projects.find((p) => p.projectId === projectId);
        if (!project) { return; }

        // Optimistic update
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: true, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));

        try {
          const repo = await getProjectRepository();
          const loadResult = await repo.loadProject(projectId);
          if (!loadResult.success || !loadResult.project) {
            throw new Error(loadResult.error || 'Failed to load project for archiving');
          }
          const saveResult = await repo.saveProject(
            { ...loadResult.project, isArchived: true },
            { createBackup: false }
          );
          if (!saveResult.success) {
            throw new Error(saveResult.error || 'Failed to persist archived state');
          }
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
        if (!project) { return; }

        // Optimistic update
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: false, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));

        try {
          const repo = await getProjectRepository();
          const loadResult = await repo.loadProject(projectId);
          if (!loadResult.success || !loadResult.project) {
            throw new Error(loadResult.error || 'Failed to load project for restoring');
          }
          const saveResult = await repo.saveProject(
            { ...loadResult.project, isArchived: false },
            { createBackup: false }
          );
          if (!saveResult.success) {
            throw new Error(saveResult.error || 'Failed to persist restored state');
          }
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
        // Find source in current store state so we can do an immediate optimistic
        // update (mirrors the pattern used by archiveProject / restoreProject).
        const sourceProject = get().projects.find((p) => p.projectId === projectId);
        if (!sourceProject) {
          return;
        }

        const newProjectId = crypto.randomUUID();
        const now = new Date().toISOString();
        const filePath = canonicalFilePath(newProjectId);

        const newProject: ProjectListItem = {
          ...sourceProject,
          projectId: newProjectId,
          projectName: newName,
          createdAt: now,
          modifiedAt: now,
          isArchived: false,
          // Use canonical on-disk path on Tauri; fall back to a project-prefixed
          // key for web / test environments.
          storagePath: filePath ?? `project-${newProjectId}`,
          filePath,
          status: 'draft',
        };

        // ── Optimistic update (synchronous) ──────────────────────────────────
        set((state) => ({ projects: [newProject, ...state.projects] }));
        logger.info('[ProjectListStore] Project duplicated (optimistic):', newName);

        // ── Persist to storage (async) ────────────────────────────────────────
        try {
          const repo = await getProjectRepository();
          const loadResult = await repo.loadProject(projectId);
          if (!loadResult.success || !loadResult.project) {
            throw new Error(loadResult.error || 'Failed to load source project for duplication');
          }

          const duplicated = {
            ...loadResult.project,
            projectId: newProjectId,
            projectName: newName,
            createdAt: now,
            modifiedAt: now,
            isArchived: false,
          };

          const saveResult = await repo.saveProject(duplicated);
          if (!saveResult.success) {
            throw new Error(saveResult.error || 'Failed to save duplicated project');
          }
          logger.info('[ProjectListStore] Project duplicated (persisted):', newName);
        } catch (error) {
          logger.error('[ProjectListStore] Duplicate persistence failed, rolling back:', error);
          // Roll back the optimistic entry
          set((state) => ({
            projects: state.projects.filter((p) => p.projectId !== newProjectId),
          }));
          throw error;
        }
      },

      refreshProjects: async () => {
        set({ loading: true, error: undefined });
        try {
          // Always go through ProjectRepository so Tauri uses the canonical
          // path ({storageRoot}/projects/{id}/project.sws) and web uses IndexedDB.
          const repo = await getProjectRepository();
          const projects = await repo.listProjects();

          const projectItems: ProjectListItem[] = projects.map(p => {
            // Compute the canonical on-disk path so useAutoSave can write back
            // to the right location without needing to re-resolve the root.
            const filePath = canonicalFilePath(p.projectId);
            return {
              projectId: p.projectId,
              projectName: p.projectName,
              projectNumber: p.projectNumber,
              clientName: p.clientName,
              entityCount: 0,
              createdAt: p.createdAt,
              modifiedAt: p.modifiedAt,
              isArchived: !!p.isArchived,
              storagePath: filePath ?? `indexeddb://${p.projectId}`,
              filePath,
              status: (p as any).status ?? 'draft',
            };
          });

          // Deduplicate by projectId, keeping the entry from the filesystem scan
          const uniqueProjects = Array.from(
            new Map(projectItems.map(p => [p.projectId, p])).values()
          );

          if (uniqueProjects.length !== projectItems.length) {
            logger.warn(
              `[ProjectListStore] Deduplicated ${projectItems.length - uniqueProjects.length} projects during refresh`
            );
          }

          set({ projects: uniqueProjects, loading: false });
          logger.info(`[ProjectListStore] Refreshed ${uniqueProjects.length} projects`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to refresh projects';
          logger.error('[ProjectListStore] Refresh failed:', error);
          set({ error: msg, loading: false });
        }
      },

      syncProject: async (projectId) => {
        try {
          const repo = await getProjectRepository();
          const result = await repo.loadProject(projectId);

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

        // Dedup validProjects
        // Create a Map with projectId as key to ensure uniqueness.
        // We use validProjects (from persisted state) as the source.
        const uniqueValidProjects = Array.from(new Map(validProjects.map((p: ProjectListItem) => [p.projectId, p])).values());

        return {
          ...currentState,
          projects: uniqueValidProjects,
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

// Subscribe to ProjectRepository events for automatic refresh
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const repository = await getProjectRepository();
      
      // Listen for project changes
      repository.addEventListener('project:changed', () => {
        logger.debug('[ProjectListStore] Project changed, refreshing list');
        useProjectListStore.getState().refreshProjects();
      });
      
      // Listen for bulk project changes
      repository.addEventListener('projects:changed', () => {
        logger.debug('[ProjectListStore] Projects changed, refreshing list');
        useProjectListStore.getState().refreshProjects();
      });
      
      logger.debug('[ProjectListStore] Event subscriptions initialized');
    } catch (error) {
      logger.warn('[ProjectListStore] Could not subscribe to repository events:', error);
    }
  })();
}

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
