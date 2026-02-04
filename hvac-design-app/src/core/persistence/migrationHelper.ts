
import { WebStorageAdapter } from './adapters/WebStorageAdapter';
import { FileSystemAccessAdapter } from './adapters/FileSystemAccessAdapter';

export interface MigrationProgress {
  total: number;
  completed: number;
  current: string;
  errors: Array<{ projectId: string; error: string }>;
}

export async function migrateProjectsFromIndexedDB(
  targetHandle: FileSystemDirectoryHandle,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  const webAdapter = new WebStorageAdapter();
  // FileSystemAccessAdapter takes a handle in constructor
  const fsAdapter = new FileSystemAccessAdapter(targetHandle);

  const projects = await webAdapter.listProjects();
  const progress: MigrationProgress = {
    total: projects.length,
    completed: 0,
    current: '',
    errors: [],
  };

  for (const metadata of projects) {
    progress.current = metadata.projectName;
    onProgress?.(progress);

    try {
      // Load from IndexedDB
      const loadResult = await webAdapter.loadProject(metadata.projectId);

      if (loadResult.success && loadResult.project) {
        // Save to FileSystem
        const saveResult = await fsAdapter.saveProject(loadResult.project);

        if (saveResult.success) {
          // Delete from IndexedDB after successful migration
          await webAdapter.deleteProject(metadata.projectId);
          progress.completed++;
        } else {
          progress.errors.push({
            projectId: metadata.projectId,
            error: 'Failed to save to filesystem',
          });
        }
      } else {
        progress.errors.push({
          projectId: metadata.projectId,
          error: 'Failed to load from IndexedDB',
        });
      }
    } catch (error) {
      progress.errors.push({
        projectId: metadata.projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    onProgress?.(progress);
  }

  return progress;
}
