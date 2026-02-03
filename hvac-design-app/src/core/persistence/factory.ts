import { isTauri } from './filesystem';
import { StorageAdapter } from './StorageAdapter';
import { StorageConfig, SaveResult, LoadResult, DeleteResult, DuplicateResult, AutoSaveResult, SaveOptions, AutoSaveMetadata, StorageInfo } from './types';
import { ProjectFile, ProjectMetadata } from '../schema/ProjectFileSchema';

/**
 * Placeholder adapter for Tauri platform.
 * All methods throw "not implemented" errors until the actual adapter is built.
 */
class TauriPlaceholderAdapter implements StorageAdapter {
  // config is used in console.debug for diagnostics
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private config?: StorageConfig) {
    // eslint-disable-next-line no-console
    console.debug('[TauriPlaceholderAdapter] Created with config:', config);
  }

  async saveProject(_project: ProjectFile, _options?: SaveOptions): Promise<SaveResult> {
    throw new Error('TauriStorageAdapter.saveProject not implemented');
  }

  async loadProject(_projectId: string): Promise<LoadResult> {
    throw new Error('TauriStorageAdapter.loadProject not implemented');
  }

  async deleteProject(_projectId: string): Promise<DeleteResult> {
    throw new Error('TauriStorageAdapter.deleteProject not implemented');
  }

  async duplicateProject(_projectId: string, _newName: string): Promise<DuplicateResult> {
    throw new Error('TauriStorageAdapter.duplicateProject not implemented');
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    throw new Error('TauriStorageAdapter.listProjects not implemented');
  }

  async searchProjects(_query: string): Promise<ProjectMetadata[]> {
    throw new Error('TauriStorageAdapter.searchProjects not implemented');
  }

  async autoSave(_project: ProjectFile): Promise<AutoSaveResult> {
    throw new Error('TauriStorageAdapter.autoSave not implemented');
  }

  async listAutoSaves(_projectId: string): Promise<AutoSaveMetadata[]> {
    throw new Error('TauriStorageAdapter.listAutoSaves not implemented');
  }

  async restoreAutoSave(_projectId: string, _timestamp: string): Promise<LoadResult> {
    throw new Error('TauriStorageAdapter.restoreAutoSave not implemented');
  }

  async cleanupAutoSaves(_projectId: string, _keepCount: number): Promise<void> {
    throw new Error('TauriStorageAdapter.cleanupAutoSaves not implemented');
  }

  async updateMetadata(_projectId: string, _metadata: Partial<ProjectMetadata>): Promise<void> {
    throw new Error('TauriStorageAdapter.updateMetadata not implemented');
  }

  async saveThumbnail(_projectId: string, _imageData: Blob): Promise<void> {
    throw new Error('TauriStorageAdapter.saveThumbnail not implemented');
  }

  async getStorageInfo(): Promise<StorageInfo> {
    throw new Error('TauriStorageAdapter.getStorageInfo not implemented');
  }
}

/**
 * Placeholder adapter for Web platform.
 * All methods throw "not implemented" errors until the actual adapter is built.
 */
class WebPlaceholderAdapter implements StorageAdapter {
  // config is used in console.debug for diagnostics
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private config?: StorageConfig) {
    // eslint-disable-next-line no-console
    console.debug('[WebPlaceholderAdapter] Created with config:', config);
  }

  async saveProject(_project: ProjectFile, _options?: SaveOptions): Promise<SaveResult> {
    throw new Error('WebStorageAdapter.saveProject not implemented');
  }

  async loadProject(_projectId: string): Promise<LoadResult> {
    throw new Error('WebStorageAdapter.loadProject not implemented');
  }

  async deleteProject(_projectId: string): Promise<DeleteResult> {
    throw new Error('WebStorageAdapter.deleteProject not implemented');
  }

  async duplicateProject(_projectId: string, _newName: string): Promise<DuplicateResult> {
    throw new Error('WebStorageAdapter.duplicateProject not implemented');
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    throw new Error('WebStorageAdapter.listProjects not implemented');
  }

  async searchProjects(_query: string): Promise<ProjectMetadata[]> {
    throw new Error('WebStorageAdapter.searchProjects not implemented');
  }

  async autoSave(_project: ProjectFile): Promise<AutoSaveResult> {
    throw new Error('WebStorageAdapter.autoSave not implemented');
  }

  async listAutoSaves(_projectId: string): Promise<AutoSaveMetadata[]> {
    throw new Error('WebStorageAdapter.listAutoSaves not implemented');
  }

  async restoreAutoSave(_projectId: string, _timestamp: string): Promise<LoadResult> {
    throw new Error('WebStorageAdapter.restoreAutoSave not implemented');
  }

  async cleanupAutoSaves(_projectId: string, _keepCount: number): Promise<void> {
    throw new Error('WebStorageAdapter.cleanupAutoSaves not implemented');
  }

  async updateMetadata(_projectId: string, _metadata: Partial<ProjectMetadata>): Promise<void> {
    throw new Error('WebStorageAdapter.updateMetadata not implemented');
  }

  async saveThumbnail(_projectId: string, _imageData: Blob): Promise<void> {
    throw new Error('WebStorageAdapter.saveThumbnail not implemented');
  }

  async getStorageInfo(): Promise<StorageInfo> {
    throw new Error('WebStorageAdapter.getStorageInfo not implemented');
  }
}

/**
 * Factory to create the appropriate storage adapter for the current environment.
 * Detects whether running in Tauri (desktop) or Web context and returns
 * the corresponding implementation.
 * 
 * @param config - Optional configuration for the storage adapter
 * @returns Promise resolving to the initialized StorageAdapter
 * @throws Error if no suitable adapter can be initialized
 * 
 * @example
 * const storage = await createStorageAdapter({
 *   autoSave: { enabled: true, intervalMs: 60000 }
 * });
 */
export async function createStorageAdapter(config?: StorageConfig): Promise<StorageAdapter> {
  // Environment detection
  if (isTauri()) {
    console.debug('[StorageFactory] Detected Tauri environment');
    // TODO: Return actual TauriStorageAdapter (ticket TBD)
    return new TauriPlaceholderAdapter(config);
  } else {
    console.debug('[StorageFactory] Detected Web environment');
    // Check for web storage capabilities
    if (typeof window !== 'undefined' && window.localStorage) {
        // TODO: Return actual WebStorageAdapter (ticket TBD)
        return new WebPlaceholderAdapter(config);
    }
    
    throw new Error('No suitable storage mechanism available in this environment');
  }
}
