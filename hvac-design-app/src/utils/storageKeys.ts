export const PROJECT_STORAGE_PREFIX = 'hvac-project-';

export const PROJECT_BACKUP_SUFFIX = '-backup';

export const DELETED_PROJECTS_STORAGE_ARCHIVE_KEY = 'sws.deletedProjects.zip';

/**
 * Known storage keys:
 * - 'sws.inspector-preferences': Stores inspector width and section collapse state (managed by Zustand persist)
 */

export function getProjectStorageKey(projectId: string): string {
  return `${PROJECT_STORAGE_PREFIX}${projectId}`;
}

export function getProjectBackupKey(projectId: string): string {
  return `${PROJECT_STORAGE_PREFIX}${projectId}${PROJECT_BACKUP_SUFFIX}`;
}

export function estimateStorageSizeBytes(value: string | null): number {
  if (!value) {
    return 0;
  }

  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }

  return value.length * 2;
}
