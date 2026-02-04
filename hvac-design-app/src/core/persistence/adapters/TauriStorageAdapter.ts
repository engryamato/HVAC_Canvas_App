import { StorageAdapter } from '../StorageAdapter';
import type { ProjectFile, ProjectMetadata } from '../../schema/project-file.schema';
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
import { ProjectFileSchema, ProjectMetadataSchema } from '../../schema/project-file.schema';
import {
  serializeProject,
  deserializeProject,
  deserializeProjectLenient,
  migrateProject,
} from '../serialization';
import {
  readTextFile,
  writeTextFile,
  exists,
  createDir,
  readDir,
  copyFile,
  removeFile,
  renameFile,
  getDocumentsDir,
} from '../filesystem';

/**
 * Tauri-based storage adapter implementing the StorageAdapter interface.
 * Uses the local filesystem with a nested folder structure.
 */
export class TauriStorageAdapter implements StorageAdapter {
  private baseDir: string = '';
  private readonly autoSaveConfig: {
    enabled: boolean;
    intervalMs: number;
    keepCount: number;
  };
  private initialized: boolean = false;

  constructor(config?: StorageConfig) {
    // baseDir will be initialized asynchronously via ensureInitialized()
    if (config?.baseDir) {
      this.baseDir = config.baseDir;
      this.initialized = true;
    }
    
    // Initialize auto-save configuration
    this.autoSaveConfig = {
      enabled: config?.autoSave?.enabled ?? true,
      intervalMs: config?.autoSave?.intervalMs ?? 60000, // 1 minute default
      keepCount: config?.autoSave?.maxCopies ?? 5,
    };
  }

  // ==================== Helper Methods (Private) ====================

  /**
   * Ensure baseDir is initialized with Documents directory
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const docsDir = await getDocumentsDir();
      this.baseDir = `${docsDir}/SizeWise/Projects`;
      this.initialized = true;
    }
  }

  /**
   * Sanitize timestamp for filesystem compatibility (replace colons with hyphens)
   */
  private sanitizeTimestamp(timestamp: string): string {
    return timestamp.replace(/:/g, '-');
  }

  /**
   * Unsanitize timestamp back to ISO format (replace hyphens with colons in time portion)
   */
  private unsanitizeTimestamp(sanitized: string): string {
    // Only replace hyphens in the time portion (after 'T')
    const parts = sanitized.split('T');
    if (parts.length === 2 && parts[1]) {
      return `${parts[0]}T${parts[1].replace(/-/g, ':')}`;
    }
    return sanitized;
  }

  private getProjectDir(projectId: string): string {
    return `${this.baseDir}/${projectId}`;
  }

  private getProjectFilePath(projectId: string): string {
    return `${this.getProjectDir(projectId)}/${projectId}.hvac`;
  }

  private getBackupFilePath(projectId: string): string {
    return `${this.getProjectFilePath(projectId)}.bak`;
  }

  private getAutoSaveDir(projectId: string): string {
    return `${this.getProjectDir(projectId)}/.autosave`;
  }

  private getAutoSaveFilePath(projectId: string, timestamp: string): string {
    return `${this.getAutoSaveDir(projectId)}/${timestamp}.hvac`;
  }

  private getMetadataDir(projectId: string): string {
    return `${this.getProjectDir(projectId)}/.metadata`;
  }

  private getThumbnailPath(projectId: string): string {
    return `${this.getMetadataDir(projectId)}/thumbnail.png`;
  }

  /**
   * Performs an atomic write by writing to a temp file and then renaming.
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    
    try {
      // Write to temp file
      await writeTextFile(tempPath, content);
      
      // Rename temp to target (atomic operation)
      await renameFile(tempPath, filePath);
    } catch (error) {
      // Cleanup temp file on failure
      try {
        if (await exists(tempPath)) {
          await removeFile(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Creates a backup of the main project file.
   */
  private async createBackup(projectId: string): Promise<void> {
    const mainPath = this.getProjectFilePath(projectId);
    const backupPath = this.getBackupFilePath(projectId);
    
    try {
      if (await exists(mainPath)) {
        await copyFile(mainPath, backupPath);
      }
    } catch (error) {
      // Non-fatal - log and continue
      console.warn(`Failed to create backup for project ${projectId}:`, error);
    }
  }

  /**
   * Ensures all required project directories exist.
   */
  private async ensureProjectDirectories(projectId: string): Promise<void> {
    const projectDir = this.getProjectDir(projectId);
    const autoSaveDir = this.getAutoSaveDir(projectId);
    const metadataDir = this.getMetadataDir(projectId);
    const exportsDir = `${projectDir}/exports`;

    await createDir(projectDir, true);
    await createDir(autoSaveDir, true);
    await createDir(metadataDir, true);
    await createDir(exportsDir, true);
  }

  // ==================== Project CRUD Operations ====================

  async saveProject(project: ProjectFile, options?: SaveOptions): Promise<SaveResult> {
    try {
      // Ensure initialized
      await this.ensureInitialized();

      // Validate project
      const validationResult = ProjectFileSchema.safeParse(project);
      if (!validationResult.success) {
        return {
          success: false,
          errorCode: 'VALIDATION_ERROR',
        };
      }

      // Ensure directories exist
      await this.ensureProjectDirectories(project.projectId);

      // Create backup if requested (default: true)
      if (options?.createBackup !== false) {
        await this.createBackup(project.projectId);
      }

      // Update modifiedAt timestamp
      const updatedProject: ProjectFile = {
        ...project,
        modifiedAt: new Date().toISOString(),
      };

      // Serialize project
      const serializationResult = serializeProject(updatedProject);
      if (!serializationResult.success || !serializationResult.data) {
        return {
          success: false,
          errorCode: 'WRITE_ERROR',
        };
      }

      // Write using atomic write (default: true)
      const filePath = this.getProjectFilePath(project.projectId);
      if (options?.atomic !== false) {
        await this.atomicWrite(filePath, serializationResult.data);
      } else {
        await writeTextFile(filePath, serializationResult.data);
      }

      // Calculate file size
      const sizeBytes = new TextEncoder().encode(serializationResult.data).length;

      return {
        success: true,
        filePath,
        sizeBytes,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific error types
      if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
        return {
          success: false,
          errorCode: 'PERMISSION_DENIED',
        };
      }
      
      if (errorMessage.includes('disk full') || errorMessage.includes('no space')) {
        return {
          success: false,
          errorCode: 'WRITE_ERROR',
        };
      }

      return {
        success: false,
        errorCode: 'WRITE_ERROR',
      };
    }
  }

  async loadProject(projectId: string): Promise<LoadResult> {
    try {
      // Ensure initialized
      await this.ensureInitialized();

      const filePath = this.getProjectFilePath(projectId);

      // Check if file exists
      if (!(await exists(filePath))) {
        return {
          success: false,
          errorCode: 'FILE_NOT_FOUND',
        };
      }

      // Read file content
      const content = await readTextFile(filePath);

      // Try to deserialize
      let deserializeResult = deserializeProject(content);
      let source: 'file' | 'localStorage' | 'indexedDB' = 'file';

      if (!deserializeResult.success) {
        // Try backup file
        const backupPath = this.getBackupFilePath(projectId);
        if (await exists(backupPath)) {
          const backupContent = await readTextFile(backupPath);
          const backupResult = deserializeProject(backupContent);
          if (backupResult.success) {
            deserializeResult = backupResult;
            source = 'localStorage'; // Using 'localStorage' to indicate backup
          }
        }

        // Try auto-saves (newest first)
        if (!deserializeResult.success) {
          const autoSaves = await this.listAutoSaves(projectId);
          for (const autoSave of autoSaves) {
            // Use sanitized timestamp for file path
            const sanitizedTimestamp = this.sanitizeTimestamp(autoSave.timestamp);
            const autoSavePath = this.getAutoSaveFilePath(projectId, sanitizedTimestamp);
            if (await exists(autoSavePath)) {
              const autoSaveContent = await readTextFile(autoSavePath);
              const autoSaveResult = deserializeProject(autoSaveContent);
              if (autoSaveResult.success) {
                deserializeResult = autoSaveResult;
                source = 'indexedDB'; // Using 'indexedDB' to indicate autosave
                break;
              }
            }
          }
        }

        // Try lenient deserialization
        if (!deserializeResult.success) {
          deserializeResult = deserializeProjectLenient(content);
        }
      }

      if (!deserializeResult.success || !deserializeResult.data) {
        return {
          success: false,
          errorCode: 'CORRUPTED_FILE',
        };
      }

      // Check if migration is needed
      let migrated = false;
      let project = deserializeResult.data;
      
      if (deserializeResult.requiresMigration && deserializeResult.foundVersion) {
        const migrationResult = migrateProject(project, deserializeResult.foundVersion);
        if (migrationResult.success && migrationResult.data) {
          project = migrationResult.data;
          migrated = true;
        } else {
          return {
            success: false,
            errorCode: 'MIGRATION_REQUIRED',
          };
        }
      }

      return {
        success: true,
        project,
        source,
        migrated,
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorCode: 'READ_ERROR',
      };
    }
  }

  async deleteProject(projectId: string): Promise<DeleteResult> {
    try {
      // Ensure initialized
      await this.ensureInitialized();

      const projectDir = this.getProjectDir(projectId);

      // Check if directory exists
      if (!(await exists(projectDir))) {
        // Idempotent - return success if already deleted
        return { success: true };
      }

      // Delete project directory and all contents recursively
      // Delete known subdirectories first
      const autoSaveDir = this.getAutoSaveDir(projectId);
      const metadataDir = this.getMetadataDir(projectId);
      const exportsDir = `${projectDir}/exports`;

      // Remove autosaves
      if (await exists(autoSaveDir)) {
        const autoSaves = await readDir(autoSaveDir);
        for (const filename of autoSaves) {
          await removeFile(`${autoSaveDir}/${filename}`);
        }
        await removeFile(autoSaveDir);
      }

      // Remove metadata
      if (await exists(metadataDir)) {
        const metadataFiles = await readDir(metadataDir);
        for (const filename of metadataFiles) {
          await removeFile(`${metadataDir}/${filename}`);
        }
        await removeFile(metadataDir);
      }

      // Remove exports
      if (await exists(exportsDir)) {
        const exports = await readDir(exportsDir);
        for (const filename of exports) {
          await removeFile(`${exportsDir}/${filename}`);
        }
        await removeFile(exportsDir);
      }

      // Remove main file and backup
      const mainFile = this.getProjectFilePath(projectId);
      const backupFile = this.getBackupFilePath(projectId);
      
      if (await exists(mainFile)) {
        await removeFile(mainFile);
      }
      if (await exists(backupFile)) {
        await removeFile(backupFile);
      }

      // Remove the project directory itself
      await removeFile(projectDir);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
        return {
          success: false,
          errorCode: 'PERMISSION_DENIED',
        };
      }

      return {
        success: false,
        errorCode: 'DELETE_ERROR',
      };
    }
  }

  async duplicateProject(projectId: string, newName: string): Promise<DuplicateResult> {
    try {
      // Load source project
      const loadResult = await this.loadProject(projectId);
      if (!loadResult.success || !loadResult.project) {
        return {
          success: false,
          errorCode: loadResult.errorCode,
        };
      }

      // Generate new UUID for duplicate
      const newProjectId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create duplicate with new ID and name
      const duplicatedProject: ProjectFile = {
        ...loadResult.project,
        projectId: newProjectId,
        projectName: newName,
        createdAt: now,
        modifiedAt: now,
      } as ProjectFile;

      // Save as new project
      const saveResult = await this.saveProject(duplicatedProject);
      if (!saveResult.success) {
        return {
          success: false,
          errorCode: saveResult.errorCode,
        };
      }

      return {
        success: true,
        project: duplicatedProject,
        source: 'file',
        migrated: false,
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorCode: 'WRITE_ERROR',
      };
    }
  }

  // ==================== Project Discovery Operations ====================

  async listProjects(): Promise<ProjectMetadata[]> {
    try {
      // Ensure initialized
      await this.ensureInitialized();

      // Ensure base directory exists
      if (!(await exists(this.baseDir))) {
        await createDir(this.baseDir, true);
        return [];
      }

      // Read directory contents
      const entries = await readDir(this.baseDir);
      const projects: ProjectMetadata[] = [];

      // readDir returns string[] of filenames
      for (const entryName of entries) {
        const projectId = entryName;
        const projectFilePath = this.getProjectFilePath(projectId);

        try {
          // Check if project file exists
          if (await exists(projectFilePath)) {
            const content = await readTextFile(projectFilePath);
            const deserializeResult = deserializeProject(content);
            
            if (deserializeResult.success && deserializeResult.data) {
              // Validate metadata
              const metadataResult = ProjectMetadataSchema.safeParse(deserializeResult.data);
              if (metadataResult.success) {
                projects.push(metadataResult.data);
              } else {
                console.warn(`Skipping corrupted project: ${projectId}`);
              }
            }
          }
        } catch (error) {
          console.warn(`Skipping corrupted project file: ${projectId}`, error);
        }
      }

      // Sort by modifiedAt descending
      projects.sort((a, b) => 
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
      );

      return projects;
    } catch (error: unknown) {
      console.error('Failed to list projects:', error);
      return [];
    }
  }

  async searchProjects(query: string): Promise<ProjectMetadata[]> {
    const allProjects = await this.listProjects();
    const lowerQuery = query.toLowerCase();

    return allProjects.filter((project) => {
      return (
        project.projectName.toLowerCase().includes(lowerQuery) ||
        project.projectNumber?.toLowerCase().includes(lowerQuery) ||
        project.clientName?.toLowerCase().includes(lowerQuery) ||
        project.location?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  // ==================== Auto-Save Operations ====================

  async autoSave(project: ProjectFile): Promise<AutoSaveResult> {
    try {
      // Ensure initialized
      await this.ensureInitialized();

      // Ensure auto-save directory exists
      await createDir(this.getAutoSaveDir(project.projectId), true);

      // Generate timestamp and sanitize for filesystem
      const timestamp = new Date().toISOString();
      const sanitizedTimestamp = this.sanitizeTimestamp(timestamp);
      const autoSaveId = `${project.projectId}-${sanitizedTimestamp}`;

      // Serialize project
      const serializationResult = serializeProject(project);
      if (!serializationResult.success || !serializationResult.data) {
        return {
          success: false,
          errorCode: 'WRITE_ERROR',
          timestamp,
          autoSaveId,
        };
      }

      // Write to auto-save file using sanitized timestamp
      const filePath = this.getAutoSaveFilePath(project.projectId, sanitizedTimestamp);
      await writeTextFile(filePath, serializationResult.data);

      // Calculate file size
      const sizeBytes = new TextEncoder().encode(serializationResult.data).length;

      // Cleanup old auto-saves
      await this.cleanupAutoSaves(project.projectId, this.autoSaveConfig.keepCount);

      return {
        success: true,
        timestamp,
        autoSaveId,
        sizeBytes,
      };
    } catch (error: unknown) {
      const timestamp = new Date().toISOString();
      return {
        success: false,
        errorCode: 'WRITE_ERROR',
        timestamp,
        autoSaveId: `${project.projectId}-${timestamp}`,
      };
    }
  }

  async listAutoSaves(projectId: string): Promise<AutoSaveMetadata[]> {
    try {
      // Ensure initialized
      await this.ensureInitialized();

      const autoSaveDir = this.getAutoSaveDir(projectId);

      // Check if directory exists
      if (!(await exists(autoSaveDir))) {
        return [];
      }

      // Read directory contents
      const entries = await readDir(autoSaveDir);
      const autoSaves: AutoSaveMetadata[] = [];

      for (const entryName of entries) {
        if (entryName.endsWith('.hvac')) {
          // Extract sanitized timestamp from filename and convert back to ISO format
          const sanitizedTimestamp = entryName.replace('.hvac', '');
          const timestamp = this.unsanitizeTimestamp(sanitizedTimestamp);
          
          autoSaves.push({
            projectId,
            timestamp,
            autoSaveId: `${projectId}-${timestamp}`,
            sizeBytes: 0, // File size not available from readDir
            source: 'file',
          });
        }
      }

      // Sort by timestamp descending (newest first)
      autoSaves.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return autoSaves;
    } catch (error: unknown) {
      console.error('Failed to list auto-saves:', error);
      return [];
    }
  }

  async restoreAutoSave(projectId: string, timestamp: string): Promise<LoadResult> {
    try {
      // Ensure initialized
      await this.ensureInitialized();

      // Use sanitized timestamp for file path
      const sanitizedTimestamp = this.sanitizeTimestamp(timestamp);
      const autoSavePath = this.getAutoSaveFilePath(projectId, sanitizedTimestamp);

      // Check if auto-save exists
      if (!(await exists(autoSavePath))) {
        return {
          success: false,
          errorCode: 'FILE_NOT_FOUND',
        };
      }

      // Read auto-save content
      const content = await readTextFile(autoSavePath);
      const deserializeResult = deserializeProject(content);

      if (!deserializeResult.success || !deserializeResult.data) {
        return {
          success: false,
          errorCode: 'CORRUPTED_FILE',
        };
      }

      // Create backup of current main file
      await this.createBackup(projectId);

      // Promote auto-save to main file
      const mainPath = this.getProjectFilePath(projectId);
      await writeTextFile(mainPath, content);

      return {
        success: true,
        project: deserializeResult.data,
        source: 'indexedDB', // Using 'indexedDB' to indicate autosave
        migrated: false,
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorCode: 'READ_ERROR',
      };
    }
  }

  async cleanupAutoSaves(projectId: string, keepCount: number): Promise<void> {
    try {
      const autoSaves = await this.listAutoSaves(projectId);

      // Keep only the first N auto-saves (already sorted by timestamp desc)
      const toDelete = autoSaves.slice(keepCount);

      for (const autoSave of toDelete) {
        const sanitizedTimestamp = this.sanitizeTimestamp(autoSave.timestamp);
        const filePath = this.getAutoSaveFilePath(projectId, sanitizedTimestamp);
        try {
          await removeFile(filePath);
        } catch (error) {
          console.warn(`Failed to delete auto-save ${autoSave.timestamp}:`, error);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to cleanup auto-saves:', error);
    }
  }

  // ==================== Metadata Operations ====================

  async updateMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<void> {
    // Load current project
    const loadResult = await this.loadProject(projectId);
    if (!loadResult.success || !loadResult.project) {
      throw new Error('Failed to load project for metadata update');
    }

    // Merge metadata changes
    const updatedProject: ProjectFile = {
      ...loadResult.project,
      ...metadata,
    } as ProjectFile;

    // Save project
    await this.saveProject(updatedProject, { createBackup: false });
  }

  async saveThumbnail(projectId: string, imageData: Blob): Promise<void> {
    // Ensure metadata directory exists
    await createDir(this.getMetadataDir(projectId), true);

    // Convert Blob to Uint8Array
    const arrayBuffer = await imageData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write to thumbnail file
    const thumbnailPath = this.getThumbnailPath(projectId);
    
    // For now, use text file write (Tauri doesn't have writeBinaryFile in filesystem module)
    // This is placeholder - actual binary write would need different Tauri API
    const base64 = btoa(String.fromCharCode(...uint8Array));
    await writeTextFile(thumbnailPath, base64);
  }

  async getStorageInfo(): Promise<StorageInfo> {
    return {
      platform: 'tauri',
      storageType: 'filesystem',
      quotaExceeded: false,
    };
  }
}
