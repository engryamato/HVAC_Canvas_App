import { readTextFile, writeTextFile, exists } from './filesystem';
import { serializeProject, deserializeProject, migrateProject } from './serialization';
import type { ProjectFile } from '@/core/schema';

/**
 * Result of an I/O operation
 */
export interface IOResult {
  success: boolean;
  error?: string;
}

/**
 * Result of a load operation
 */
export interface LoadResult extends IOResult {
  project?: ProjectFile;
  loadedFromBackup?: boolean;
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
      return { success: false, error: serialized.error };
    }

    // Create backup of existing file
    if (await exists(path)) {
      const currentContent = await readTextFile(path);
      await writeTextFile(`${path}.bak`, currentContent);
    }

    // Write new file
    await writeTextFile(path, serialized.data);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Save failed',
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

