import { readTextFile, writeTextFile, exists, removeFile } from './filesystem';
import { serializeProject, deserializeProject, migrateProject } from './serialization';
import type { ProjectFile } from '@/core/schema';

/**
 * Error codes for I/O operations
 */
export type IOErrorCode = 
  | 'FILE_NOT_FOUND' 
  | 'PERMISSION_DENIED' 
  | 'VALIDATION_ERROR' 
  | 'PARSE_ERROR' 
  | 'UNKNOWN';

/**
 * Result of an I/O operation
 */
export interface IOResult {
  success: boolean;
  error?: string;
  errorCode?: IOErrorCode;
}

/**
 * Result of a load operation
 */
export interface LoadResult extends IOResult {
  project?: ProjectFile;
  loadedFromBackup?: boolean;
  migrated?: boolean;
  originalVersion?: string;
}

/**
 * Save project to .sws file with backup
 * Creates a .bak backup of the existing file before overwriting
 */
export async function saveProject(project: ProjectFile, path: string): Promise<IOResult> {
  try {
    // Serialize project
    const serialized = serializeProject(project);
    if (!serialized.success || !serialized.data) {
      return { 
        success: false, 
        error: serialized.error,
        errorCode: 'VALIDATION_ERROR'
      };
    }

    // Create backup of existing file
    if (await exists(path)) {
      try {
        const currentContent = await readTextFile(path);
        await writeTextFile(`${path}.bak`, currentContent);
      } catch (backupError) {
        console.warn('[ProjectIO] Backup creation failed:', backupError);
        // Continue with save even if backup fails
      }
    }

    // Write new file
    await writeTextFile(path, serialized.data);

    return { success: true };
  } catch (error) {
    // Determine error code based on error message
    let errorCode: IOErrorCode = 'UNKNOWN';
    const errorMessage = error instanceof Error ? error.message : 'Save failed';
    
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      errorCode = 'PERMISSION_DENIED';
    } else if (errorMessage.includes('not found') || errorMessage.includes('ENOENT')) {
      errorCode = 'FILE_NOT_FOUND';
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode
    };
  }
}

/**
 * Load project from .sws file
 * Falls back to backup file if main file is corrupted
 */
export async function loadProject(path: string): Promise<LoadResult> {
  try {
    // Check if file exists
    if (!(await exists(path))) {
      return { success: false, error: 'File not found' };
    }

    // Read file
    const content = await readTextFile(path);

    // Deserialize
    const result = deserializeProject(content);

    if (!result.success) {
      // Check if migration is needed
      if (result.requiresMigration && result.foundVersion) {
        const parsed = JSON.parse(content);
        const migrated = migrateProject(parsed, result.foundVersion);
        if (migrated.success) {
          return { success: true, project: migrated.data };
        }
      }

      // Try loading backup if main file is corrupted
      return loadBackup(path);
    }

    return { success: true, project: result.data };
  } catch (error) {
    // Try backup on error
    return loadBackup(path);
  }
}

/**
 * Load project from backup file
 */
export async function loadBackup(originalPath: string): Promise<LoadResult> {
  const backupPath = `${originalPath}.bak`;

  try {
    if (!(await exists(backupPath))) {
      return { success: false, error: 'No backup file available' };
    }

    const content = await readTextFile(backupPath);
    const result = deserializeProject(content);

    if (!result.success) {
      return { success: false, error: 'Backup file is also corrupted' };
    }

    return {
      success: true,
      project: result.data,
      loadedFromBackup: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Backup load failed',
    };
  }
}

/**
 * Check if a project file exists at the given path
 */
export async function projectExists(path: string): Promise<boolean> {
  return exists(path);
}

/**
 * Get the backup path for a project file
 */
export function getBackupPath(projectPath: string): string {
  return `${projectPath}.bak`;
}

/**
 * Delete a project file and its backup
 * @param path Path to .sws file
 * @returns IOResult with success status
 */
export async function deleteProject(path: string): Promise<IOResult> {
  try {
    // Delete main file
    if (await exists(path)) {
      await removeFile(path);
    } else {
      return {
        success: false,
        error: 'Project file not found',
        errorCode: 'FILE_NOT_FOUND'
      };
    }
    
    // Delete backup if exists
    const backupPath = getBackupPath(path);
    if (await exists(backupPath)) {
      try {
        await removeFile(backupPath);
      } catch (backupError) {
        console.warn('[ProjectIO] Backup deletion failed:', backupError);
        // Continue even if backup deletion fails
      }
    }
    
    return { success: true };
  } catch (error) {
    let errorCode: IOErrorCode = 'UNKNOWN';
    const errorMessage = error instanceof Error ? error.message : 'Delete failed';
    
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      errorCode = 'PERMISSION_DENIED';
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode
    };
  }
}

/**
 * Duplicate a project file with a new name and UUID
 * @param sourcePath Path to source .sws file
 * @param newName Name for the duplicated project
 * @param destinationPath Optional destination path (defaults to same directory with "-Copy" suffix)
 * @returns LoadResult with duplicated project data
 */
export async function duplicateProject(
  sourcePath: string,
  newName: string,
  destinationPath?: string
): Promise<LoadResult> {
  try {
    // Load source project
    const loadResult = await loadProject(sourcePath);
    if (!loadResult.success || !loadResult.project) {
      return loadResult;
    }
    
    // Create duplicate with new ID and name
    const now = new Date().toISOString();
    const duplicate: ProjectFile = {
      ...loadResult.project,
      projectId: crypto.randomUUID(),
      projectName: newName,
      createdAt: now,
      modifiedAt: now
    };
    
    // Determine destination path
    const destPath = destinationPath || sourcePath.replace(/\.sws$/, '-Copy.sws');
    
    // Save duplicate
    const saveResult = await saveProject(duplicate, destPath);
    
    if (saveResult.success) {
      return {
        success: true,
        project: duplicate
      };
    } else {
      return {
        success: false,
        error: saveResult.error,
        errorCode: saveResult.errorCode
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Duplication failed',
      errorCode: 'UNKNOWN'
    };
  }
}
