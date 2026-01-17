import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/utils/logger';
import { TauriFileSystem } from '@/core/persistence/TauriFileSystem';

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
  filePath?: string; // Absolute file path for Tauri (e.g., /path/to/project.sws)
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
  removeProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  restoreProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string, newName: string) => Promise<void>;
  markAsOpened: (projectId: string) => void; // Track project access for Recent Projects
  
  // Tauri-specific actions
  scanProjectsFromDisk: () => Promise<void>; // Scan default directory for .sws files
  syncProjectFromDisk: (projectId: string) => Promise<void>; // Re-read metadata from file
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
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

      removeProject: async (projectId) => {
        const project = get().projects.find((p) => p.projectId === projectId);
        
        // If in Tauri mode and project has a file path, delete the files
        if (TauriFileSystem.isTauriEnvironment() && project?.filePath) {
          try {
            const { deleteProject } = await import('@/core/persistence/projectIO');
            const result = await deleteProject(project.filePath);
            
            if (!result.success) {
              logger.error('[ProjectListStore] File deletion failed:', result.error);
              throw new Error(result.error || 'Failed to delete project files');
            }
            
            logger.info('[ProjectListStore] Project files deleted:', project.filePath);
          } catch (error) {
            logger.error('[ProjectListStore] Error deleting project files:', error);
            throw error; // Re-throw to let UI handle the error
          }
        }
        
        // Remove from state (both Tauri and web mode)
        set((state) => ({
          projects: state.projects.filter((p) => p.projectId !== projectId),
          recentProjectIds: state.recentProjectIds.filter((id) => id !== projectId),
        }));
      },

      archiveProject: async (projectId) => {
        const project = get().projects.find((p) => p.projectId === projectId);
        if (!project) {
          logger.warn('[ProjectListStore] Project not found for archiving:', projectId);
          return;
        }

        // Optimistically update local state
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: true, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));

        // If in Tauri mode with file path, persist to disk
        if (TauriFileSystem.isTauriEnvironment() && project.filePath) {
          try {
            const { loadProject, saveProject } = await import('@/core/persistence/projectIO');
            
            // Load full project
            const loadResult = await loadProject(project.filePath);
            if (!loadResult.success || !loadResult.project) {
              throw new Error(loadResult.error || 'Failed to load project');
            }

            // Update isArchived flag
            const updatedProject = {
              ...loadResult.project,
              isArchived: true,
              modifiedAt: new Date().toISOString(),
            };

            // Save back to file
            const saveResult = await saveProject(updatedProject, project.filePath);
            if (!saveResult.success) {
              throw new Error(saveResult.error || 'Failed to save project');
            }

            logger.info('[ProjectListStore] Project archived to file:', project.filePath);
          } catch (error) {
            logger.error('[ProjectListStore] Failed to archive project to file:', error);
            
            // Rollback local state on error
            set((state) => ({
              projects: state.projects.map((p) =>
                p.projectId === projectId
                  ? { ...p, isArchived: false }
                  : p
              ),
            }));
            
            throw error; // Re-throw for UI to handle
          }
        }
      },

      restoreProject: async (projectId) => {
        const project = get().projects.find((p) => p.projectId === projectId);
        if (!project) {
          logger.warn('[ProjectListStore] Project not found for restoring:', projectId);
          return;
        }

        // Optimistically update local state
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === projectId
              ? { ...p, isArchived: false, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));

        // If in Tauri mode with file path, persist to disk
        if (TauriFileSystem.isTauriEnvironment() && project.filePath) {
          try {
            const { loadProject, saveProject } = await import('@/core/persistence/projectIO');
            
            // Load full project
            const loadResult = await loadProject(project.filePath);
            if (!loadResult.success || !loadResult.project) {
              throw new Error(loadResult.error || 'Failed to load project');
            }

            // Update isArchived flag
            const updatedProject = {
              ...loadResult.project,
              isArchived: false,
              modifiedAt: new Date().toISOString(),
            };

            // Save back to file
            const saveResult = await saveProject(updatedProject, project.filePath);
            if (!saveResult.success) {
              throw new Error(saveResult.error || 'Failed to save project');
            }

            logger.info('[ProjectListStore] Project restored to file:', project.filePath);
          } catch (error) {
            logger.error('[ProjectListStore] Failed to restore project to file:', error);
            
            // Rollback local state on error
            set((state) => ({
              projects: state.projects.map((p) =>
                p.projectId === projectId
                  ? { ...p, isArchived: true }
                  : p
              ),
            }));
            
            throw error; // Re-throw for UI to handle
          }
        }
      },

      duplicateProject: async (projectId, newName) => {
        const source = get().projects.find((p) => p.projectId === projectId);
        if (!source) {
          logger.warn('[ProjectListStore] Source project not found for duplication:', projectId);
          return;
        }

        // If in Tauri mode with file path, duplicate the file
        if (TauriFileSystem.isTauriEnvironment() && source.filePath) {
          try {
            const { duplicateProject: duplicateProjectFile } = await import('@/core/persistence/projectIO');
            
            // Generate destination path (same directory, new filename based on newName)
            const sourceDir = source.filePath.substring(0, source.filePath.lastIndexOf('/'));
            const destinationPath = `${sourceDir}/${newName}.sws`;
            
            // Call ProjectIO to duplicate the file
            const result = await duplicateProjectFile(source.filePath, newName, destinationPath);
            
            if (!result.success || !result.project) {
              throw new Error(result.error || 'Failed to duplicate project file');
            }
            
            // Add the duplicated project to the store
            const newProject: ProjectListItem = {
              projectId: result.project.projectId,
              projectName: result.project.projectName,
              projectNumber: result.project.projectNumber,
              clientName: result.project.clientName,
              entityCount: source.entityCount,
              createdAt: result.project.createdAt,
              modifiedAt: result.project.modifiedAt,
              storagePath: destinationPath,
              isArchived: false,
              filePath: destinationPath,
            };
            
            set((state) => ({ projects: [newProject, ...state.projects] }));
            logger.info('[ProjectListStore] Project duplicated to file:', destinationPath);
          } catch (error) {
            logger.error('[ProjectListStore] Failed to duplicate project file:', error);
            throw error; // Re-throw for UI to handle
          }
        } else {
          // Web mode: existing in-memory duplication logic
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
        }
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
      
      // Tauri-specific actions
      scanProjectsFromDisk: async () => {
        if (!TauriFileSystem.isTauriEnvironment()) {
          logger.debug('[ProjectListStore] Not in Tauri environment, skipping disk scan');
          return;
        }
        
        set({ loading: true, error: undefined });
        
        try {
          const defaultPath = await TauriFileSystem.getDefaultProjectsPath();
          const scannedProjects = await TauriFileSystem.scanProjectDirectory(defaultPath);
          
          // Convert scanned metadata to ProjectListItems
          const projectItems: ProjectListItem[] = scannedProjects.map(p => ({
            projectId: p.projectId,
            projectName: p.projectName,
            projectNumber: p.projectNumber,
            clientName: p.clientName,
            entityCount: 0, // Would need to count entities from full file
            createdAt: p.createdAt,
            modifiedAt: p.modifiedAt,
            storagePath: p.filePath,
            isArchived: p.isArchived ?? false,
            filePath: p.filePath,
          }));
          
          set({ projects: projectItems, loading: false });
          logger.info(`[ProjectListStore] Scanned ${projectItems.length} projects from disk`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to scan projects';
          logger.error('[ProjectListStore] Scan failed:', error);
          set({ error: errorMsg, loading: false });
        }
      },
      
      syncProjectFromDisk: async (projectId) => {
        const project = get().projects.find(p => p.projectId === projectId);
        if (!project?.filePath) {
          logger.warn('[ProjectListStore] No file path for project:', projectId);
          return;
        }
        
        try {
          // Re-scan just this project's metadata
          const { loadProject } = await import('@/core/persistence/projectIO');
          const result = await loadProject(project.filePath);
          
          if (result.success && result.project) {
            get().updateProject(projectId, {
              projectName: result.project.projectName,
              projectNumber: result.project.projectNumber,
              clientName: result.project.clientName,
              modifiedAt: result.project.modifiedAt,
              isArchived: result.project.isArchived,
            });
            logger.debug('[ProjectListStore] Synced project from disk:', projectId);
          }
        } catch (error) {
          logger.error('[ProjectListStore] Sync failed:', error);
        }
      },
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: INDEX_KEY,
      storage: createJSONStorage(() => {
        // Handle SSR - return dummy storage if window is undefined
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      onRehydrateStorage: () => (state) => {
        console.log('[ProjectListStore] Hydration finished', state);
      },
      skipHydration: true, // Prevent hydration mismatch on SSR
    }
  )
);

export const rehydrateProjectList = async () => {
  await useProjectListStore.persist.rehydrate();
};

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
      .filter((p): p is ProjectListItem => p !== undefined && !p.isArchived);
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
    scanProjectsFromDisk: state.scanProjectsFromDisk,
    syncProjectFromDisk: state.syncProjectFromDisk,
  }));
