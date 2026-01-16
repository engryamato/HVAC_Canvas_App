export const PROJECT_STORAGE_PREFIX = 'hvac-project-';

export const PROJECT_BACKUP_SUFFIX = '-backup';

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
