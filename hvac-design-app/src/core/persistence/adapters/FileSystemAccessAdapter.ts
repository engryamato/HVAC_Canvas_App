import { StorageAdapter } from '../StorageAdapter';
import {
  ProjectFile,
  ProjectMetadata,
  ProjectFileSchema,
  ProjectMetadataSchema,
} from '../../schema/project-file.schema';
import type {
  StorageConfig,
  SaveOptions,
  SaveResult,
  LoadResult,
  DeleteResult,
  DuplicateResult,
  AutoSaveResult,
  AutoSaveMetadata,
  StorageInfo,
} from '../types';
import {
  serializeProject,
  deserializeProject,
  deserializeProjectLenient,
  migrateProject,
} from '../serialization';

/**
 * File System Access API Storage Adapter
 * Allows Web App to access the same local folder structure as Tauri
 */
export class FileSystemAccessAdapter implements StorageAdapter {
  private readonly rootHandle: FileSystemDirectoryHandle;
  constructor(
    rootHandle: FileSystemDirectoryHandle,
    _config?: StorageConfig
  ) {
    this.rootHandle = rootHandle;
  }

  // ==================== Helper Methods ====================

  private sanitizeTimestamp(timestamp: string): string {
    return timestamp.replace(/:/g, '-');
  }

  private unsanitizeTimestamp(sanitized: string): string {
    const parts = sanitized.split('T');
    if (parts.length === 2 && parts[1]) {
      return `${parts[0]}T${parts[1].replace(/-/g, ':')}`;
    }
    return sanitized;
  }

  /**
   * Get or create project directory
   */
  private async getProjectDir(
    projectId: string,
    create = false
  ): Promise<FileSystemDirectoryHandle | null> {
    try {
      return await this.rootHandle.getDirectoryHandle(projectId, { create });
    } catch {
      return null;
    }
  }

  /**
   * Get project file handle
   */
  private async getProjectFileHandle(
    projectId: string,
    create = false
  ): Promise<FileSystemFileHandle | null> {
    const projectDir = await this.getProjectDir(projectId, create);
    if (!projectDir) {return null;}

    try {
      return await projectDir.getFileHandle(`${projectId}.hvac`, { create });
    } catch {
      return null;
    }
  }

  /**
   * Read file contents as text
   */
  private async readFileContent(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile();
    return await file.text();
  }

  /**
   * Write text content to file
   */
  private async writeFileContent(
    fileHandle: FileSystemFileHandle,
    content: string
  ): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }


  // ==================== StorageAdapter Implementation ====================

  async saveProject(project: ProjectFile, options?: SaveOptions): Promise<SaveResult> {
    try {
      // Validate
      const validationResult = ProjectFileSchema.safeParse(project);
      if (!validationResult.success) {
        return { success: false, errorCode: 'VALIDATION_ERROR' };
      }

      const updatedProject = {
        ...project,
        modifiedAt: new Date().toISOString(),
      };

      const serializationResult = serializeProject(updatedProject);
      if (!serializationResult.success || !serializationResult.data) {
        return { success: false, errorCode: 'WRITE_ERROR' };
      }

      const content = serializationResult.data;

      // Create backup if requested
      if (options?.createBackup !== false) {
        const existingHandle = await this.getProjectFileHandle(project.projectId);
        if (existingHandle) {
          const existingContent = await this.readFileContent(existingHandle);
          await this.createBackup(project.projectId, existingContent);
        }
      }

      // Write main project file
      const fileHandle = await this.getProjectFileHandle(project.projectId, true);
      if (!fileHandle) {
        return { success: false, errorCode: 'WRITE_ERROR' };
      }

      await this.writeFileContent(fileHandle, content);

      // Write metadata.json for faster listing
      await this.saveMetadata(project.projectId, updatedProject);

      const sizeBytes = new Blob([content]).size;

      return {
        success: true,
        filePath: `${project.projectId}/${project.projectId}.hvac`,
        sizeBytes,
      };
    } catch (error) {
      console.error('FileSystemAccessAdapter.saveProject error:', error);
      return { success: false, errorCode: 'WRITE_ERROR' };
    }
  }

  async loadProject(projectId: string): Promise<LoadResult> {
    try {
      let source: 'file' | 'localStorage' | 'indexedDB' = 'file';

      // Try main file
      const fileHandle = await this.getProjectFileHandle(projectId);
      if (!fileHandle) {
        return { success: false, errorCode: 'FILE_NOT_FOUND' };
      }

      const content = await this.readFileContent(fileHandle);
      let deserializeResult = deserializeProject(content);

      // Fallback to backup if main is corrupted
      if (!deserializeResult.success) {
        const backupContent = await this.loadBackup(projectId);
        if (backupContent) {
          const backupResult = deserializeProject(backupContent);
          if (backupResult.success) {
            deserializeResult = backupResult;
            source = 'localStorage';
          }
        }
      }

      // Try lenient deserialization
      if (!deserializeResult.success) {
        deserializeResult = deserializeProjectLenient(content);
      }

      if (!deserializeResult.success || !deserializeResult.data) {
        return { success: false, errorCode: 'CORRUPTED_FILE' };
      }

      // Handle migration
      let project = deserializeResult.data;
      let migrated = false;

      if (deserializeResult.requiresMigration && deserializeResult.foundVersion) {
        const migrationResult = migrateProject(project, deserializeResult.foundVersion);
        if (migrationResult.success && migrationResult.data) {
          project = migrationResult.data;
          migrated = true;
        } else {
          return { success: false, errorCode: 'MIGRATION_REQUIRED' };
        }
      }

      return {
        success: true,
        project,
        source,
        migrated,
      };
    } catch (error) {
      console.error('FileSystemAccessAdapter.loadProject error:', error);
      return { success: false, errorCode: 'READ_ERROR' };
    }
  }

  async deleteProject(projectId: string): Promise<DeleteResult> {
    try {
      await this.rootHandle.removeEntry(projectId, { recursive: true });
      return { success: true };
    } catch (error) {
      console.error('FileSystemAccessAdapter.deleteProject error:', error);
      return { success: false, errorCode: 'DELETE_ERROR' };
    }
  }

  async duplicateProject(projectId: string, newName: string): Promise<DuplicateResult> {
    try {
      const loadResult = await this.loadProject(projectId);
      if (!loadResult.success || !loadResult.project) {
        return { success: false, errorCode: loadResult.errorCode };
      }

      const newProjectId = crypto.randomUUID();
      const now = new Date().toISOString();

      const duplicatedProject: ProjectFile = {
        ...loadResult.project,
        projectId: newProjectId,
        projectName: newName,
        createdAt: now,
        modifiedAt: now,
        isArchived: false,
      } as ProjectFile;

      const saveResult = await this.saveProject(duplicatedProject);
      if (!saveResult.success) {
        return { success: false, errorCode: saveResult.errorCode };
      }

      return {
        success: true,
        project: duplicatedProject,
        source: 'file',
        migrated: false,
      };
    } catch (error) {
      console.error('FileSystemAccessAdapter.duplicateProject error:', error);
      return { success: false, errorCode: 'WRITE_ERROR' };
    }
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    try {
      const projects: ProjectMetadata[] = [];

      for await (const [name, handle] of (this.rootHandle as any).entries()) {
        if (handle.kind === 'directory') {
          // Try to read metadata.json first (faster)
          const metadata = await this.loadMetadata(name);
          if (metadata) {
            projects.push(metadata);
          } else {
            // Fallback: load full project
            const loadResult = await this.loadProject(name);
            if (loadResult.success && loadResult.project) {
              const metadataResult = ProjectMetadataSchema.safeParse(loadResult.project);
              if (metadataResult.success) {
                projects.push(metadataResult.data);
              }
            }
          }
        }
      }

      // Sort by modifiedAt descending
      projects.sort(
        (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
      );

      return projects;
    } catch (error) {
      console.error('FileSystemAccessAdapter.listProjects error:', error);
      return [];
    }
  }

  async searchProjects(query: string): Promise<ProjectMetadata[]> {
    const allProjects = await this.listProjects();
    const lowerQuery = query.toLowerCase();

    return allProjects.filter(
      (project) =>
        project.projectName.toLowerCase().includes(lowerQuery) ||
        project.projectNumber?.toLowerCase().includes(lowerQuery) ||
        project.clientName?.toLowerCase().includes(lowerQuery) ||
        project.location?.toLowerCase().includes(lowerQuery)
    );
  }

  // ==================== Auto-Save (Simplified) ====================

  async autoSave(project: ProjectFile): Promise<AutoSaveResult> {
    const timestamp = new Date().toISOString();
    const sanitizedTimestamp = this.sanitizeTimestamp(timestamp);
    const autoSaveId = `${project.projectId}-${sanitizedTimestamp}`;

    try {
      const serializationResult = serializeProject(project);
      if (!serializationResult.success || !serializationResult.data) {
        return { success: false, errorCode: 'WRITE_ERROR', timestamp, autoSaveId };
      }

      const content = serializationResult.data;
      const projectDir = await this.getProjectDir(project.projectId, true);
      if (!projectDir) {
        return { success: false, errorCode: 'WRITE_ERROR', timestamp, autoSaveId };
      }

      const autoSavesDir = await projectDir.getDirectoryHandle('.autosaves', { create: true });
      const autoSaveFile = await autoSavesDir.getFileHandle(`${autoSaveId}.hvac`, {
        create: true,
      });

      await this.writeFileContent(autoSaveFile, content);

      return {
        success: true,
        timestamp,
        autoSaveId,
        sizeBytes: new Blob([content]).size,
      };
    } catch (error) {
      console.error('FileSystemAccessAdapter.autoSave error:', error);
      return { success: false, errorCode: 'WRITE_ERROR', timestamp, autoSaveId };
    }
  }

  async listAutoSaves(projectId: string): Promise<AutoSaveMetadata[]> {
    try {
      const projectDir = await this.getProjectDir(projectId);
      if (!projectDir) {return [];}

      const autoSavesDir = await projectDir.getDirectoryHandle('.autosaves').catch(() => null);
      if (!autoSavesDir) {return [];}

      const autoSaves: AutoSaveMetadata[] = [];

      for await (const [name, handle] of (autoSavesDir as any).entries()) {
        if (handle.kind === 'file' && name.endsWith('.hvac')) {
          const autoSaveId = name.replace('.hvac', '');
          const parts = autoSaveId.split('-');
          const timestampPart = parts.slice(1).join('-');
          const timestamp = this.unsanitizeTimestamp(timestampPart);

          const file = await (handle as FileSystemFileHandle).getFile();

          autoSaves.push({
            projectId,
            timestamp,
            autoSaveId,
            sizeBytes: file.size,
            source: 'file',
          });
        }
      }

      return autoSaves.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('FileSystemAccessAdapter.listAutoSaves error:', error);
      return [];
    }
  }

  async restoreAutoSave(projectId: string, timestamp: string): Promise<LoadResult> {
    try {
      const sanitizedTimestamp = this.sanitizeTimestamp(timestamp);
      const autoSaveId = `${projectId}-${sanitizedTimestamp}`;

      const projectDir = await this.getProjectDir(projectId);
      if (!projectDir) {
        return { success: false, errorCode: 'FILE_NOT_FOUND' };
      }

      const autoSavesDir = await projectDir.getDirectoryHandle('.autosaves').catch(() => null);
      if (!autoSavesDir) {
        return { success: false, errorCode: 'FILE_NOT_FOUND' };
      }

      const autoSaveFile = await autoSavesDir
        .getFileHandle(`${autoSaveId}.hvac`)
        .catch(() => null);
      if (!autoSaveFile) {
        return { success: false, errorCode: 'FILE_NOT_FOUND' };
      }

      const content = await this.readFileContent(autoSaveFile);
      const deserializeResult = deserializeProject(content);

      if (!deserializeResult.success || !deserializeResult.data) {
        return { success: false, errorCode: 'CORRUPTED_FILE' };
      }

      // Backup current before restore
      const currentHandle = await this.getProjectFileHandle(projectId);
      if (currentHandle) {
        const currentContent = await this.readFileContent(currentHandle);
        await this.createBackup(projectId, currentContent);
      }

      // Restore by saving
      await this.saveProject(deserializeResult.data as ProjectFile);

      return {
        success: true,
        project: deserializeResult.data,
        source: 'file',
        migrated: false,
      };
    } catch (error) {
      console.error('FileSystemAccessAdapter.restoreAutoSave error:', error);
      return { success: false, errorCode: 'READ_ERROR' };
    }
  }

  async updateMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<void> {
    try {
      const loadResult = await this.loadProject(projectId);
      if (!loadResult.success || !loadResult.project) {
        throw new Error('Project not found');
      }

      const updatedProject = { ...loadResult.project, ...metadata };
      await this.saveProject(updatedProject as ProjectFile);
    } catch (error) {
      console.error('FileSystemAccessAdapter.updateMetadata error:', error);
      throw error;
    }
  }

  async saveThumbnail(projectId: string, imageData: Blob): Promise<void> {
    try {
      const projectDir = await this.getProjectDir(projectId, true);
      if (!projectDir) {return;}

      const thumbnailFile = await projectDir.getFileHandle('thumbnail.png', { create: true });
      const writable = await thumbnailFile.createWritable();
      await writable.write(imageData);
      await writable.close();
    } catch (error) {
      console.error('FileSystemAccessAdapter.saveThumbnail error:', error);
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    let totalBytes, usedBytes;

    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        totalBytes = estimate.quota;
        usedBytes = estimate.usage;
      } catch (e) {
        console.debug('Unable to estimate storage:', e);
      }
    }

    return {
      platform: 'web',
      storageType: 'filesystem',
      totalBytes,
      usedBytes,
      quotaExceeded: false,
    };
  }

  // ==================== Private Helpers ====================

  private async saveMetadata(projectId: string, project: ProjectFile): Promise<void> {
    try {
      const projectDir = await this.getProjectDir(projectId, true);
      if (!projectDir) {return;}

      const metadataResult = ProjectMetadataSchema.safeParse(project);
      if (!metadataResult.success) {return;}

      const metadataFile = await projectDir.getFileHandle('metadata.json', { create: true });
      await this.writeFileContent(metadataFile, JSON.stringify(metadataResult.data, null, 2));
    } catch {
      // Non-critical, just for performance
    }
  }

  private async loadMetadata(projectId: string): Promise<ProjectMetadata | null> {
    try {
      const projectDir = await this.getProjectDir(projectId);
      if (!projectDir) {return null;}

      const metadataFile = await projectDir.getFileHandle('metadata.json').catch(() => null);
      if (!metadataFile) {return null;}

      const content = await this.readFileContent(metadataFile);
      const metadata = JSON.parse(content);
      const result = ProjectMetadataSchema.safeParse(metadata);

      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  private async createBackup(projectId: string, content: string): Promise<void> {
    try {
      const projectDir = await this.getProjectDir(projectId, true);
      if (!projectDir) {return;}

      const backupFile = await projectDir.getFileHandle(`${projectId}.hvac.backup`, {
        create: true,
      });
      await this.writeFileContent(backupFile, content);
    } catch {
      // Non-critical
    }
  }

  private async loadBackup(projectId: string): Promise<string | null> {
    try {
      const projectDir = await this.getProjectDir(projectId);
      if (!projectDir) {return null;}

      const backupFile = await projectDir
        .getFileHandle(`${projectId}.hvac.backup`)
        .catch(() => null);
      if (!backupFile) {return null;}

      return await this.readFileContent(backupFile);
    } catch {
      return null;
    }
  }

  async cleanupAutoSaves(projectId: string, keepCount: number): Promise<void> {
    try {
      const autoSaves = await this.listAutoSaves(projectId);
      if (autoSaves.length <= keepCount) {return;}

      const projectDir = await this.getProjectDir(projectId);
      if (!projectDir) {return;}

      const autoSavesDir = await projectDir.getDirectoryHandle('.autosaves').catch(() => null);
      if (!autoSavesDir) {return;}

      const toDelete = autoSaves.slice(keepCount);
      for (const autoSave of toDelete) {
        const filename = `${autoSave.autoSaveId}.hvac`;
        await autoSavesDir.removeEntry(filename).catch(() => {});
      }
    } catch (error) {
      console.error('FileSystemAccessAdapter.cleanupAutoSaves error:', error);
    }
  }
}
