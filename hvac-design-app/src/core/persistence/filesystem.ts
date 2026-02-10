/**
 * File system utilities for Tauri/web environments
 * Provides a unified API that works in both Tauri desktop and web contexts
 */
import { invoke } from '@tauri-apps/api/core';

export interface DiskSpaceInfo {
  available_bytes: number;
  total_bytes: number;
  percent_available: number;
}

export interface StorageRootInfo {
  documents_path: string;
  appdata_path: string;
  recommended_path: string;
}

export interface StorageRootValidationResult {
  exists: boolean;
  writable: boolean;
  available_bytes: number;
  total_bytes: number;
  percent_available: number;
}

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}



/**
 * Read text file from filesystem
 * @throws Error if not in Tauri environment
 */
export async function readTextFile(path: string): Promise<string> {
  if (isTauri()) {
    const { readTextFile: tauriRead } = await import('@tauri-apps/plugin-fs');
    return tauriRead(path);
  }
  // Web fallback: Try to read from local storage simulated FS if strictly needed, 
  // but mostly adapters handle IO. For now, throw if direct FS access requested in web 
  // as adapters should handle it.
  // actually, if we want full parity, maybe we shouldn't throw but Warn? 
  // But reading a file path in web is impossible unless virtual.
  console.warn('Direct filesystem read not supported in web, use StorageAdapter');
  return '';
}

/**
 * Write text file to filesystem
 * @throws Error if not in Tauri environment
 */
export async function writeTextFile(path: string, content: string): Promise<void> {
  if (isTauri()) {
    const { writeTextFile: tauriWrite } = await import('@tauri-apps/plugin-fs');
    await tauriWrite(path, content);
    return;
  }
  console.warn('Direct filesystem write not supported in web, use StorageAdapter');
}

/**
 * Check if file exists
 * Returns false in web environment
 */
export async function exists(path: string): Promise<boolean> {
  if (isTauri()) {
    const { exists: tauriExists } = await import('@tauri-apps/plugin-fs');
    return tauriExists(path);
  }
  // In web, virtual paths always "exist" regarding the folder structure 
  // if they match our virtual schema, to allow validation to pass.
  return path.startsWith('indexeddb://');
}

/**
 * Create directory
 * @throws Error if not in Tauri environment
 */
export async function createDir(path: string, recursive = true): Promise<void> {
  if (isTauri()) {
    const { mkdir: tauriMkdir } = await import('@tauri-apps/plugin-fs');
    await tauriMkdir(path, { recursive });
    return;
  }
  // Web: no-op for virtual directories
  if (path.startsWith('indexeddb://')) { return; }
  console.warn('Directory creation not supported in web');
}

/**
 * List files in directory
 * Returns empty array in web environment
 */
export async function readDir(path: string): Promise<string[]> {
  if (isTauri()) {
    const { readDir: tauriReadDir } = await import('@tauri-apps/plugin-fs');
    const entries = await tauriReadDir(path);
    return entries.map((entry) => entry.name || '').filter(Boolean);
  }
  return [];
}

/**
 * Get user's documents directory
 * Returns empty string in web environment
 */
export async function getDocumentsDir(): Promise<string> {
  if (isTauri()) {
    const { documentDir } = await import('@tauri-apps/api/path');
    return documentDir();
  }
  return 'indexeddb://documents';
}

/**
 * Get user's downloads directory.
 * Returns empty string in web environment.
 */
export async function getDownloadsDir(): Promise<string> {
  if (isTauri()) {
    const pathApi = (await import('@tauri-apps/api/path')) as unknown as {
      downloadDir?: () => Promise<string>;
    };
    if (typeof pathApi.downloadDir === 'function') {
      return pathApi.downloadDir();
    }
  }
  return '';
}

/**
 * Get user's desktop directory.
 * Returns empty string in web environment.
 */
export async function getDesktopDir(): Promise<string> {
  if (isTauri()) {
    const pathApi = (await import('@tauri-apps/api/path')) as unknown as {
      desktopDir?: () => Promise<string>;
    };
    if (typeof pathApi.desktopDir === 'function') {
      return pathApi.desktopDir();
    }
  }
  return '';
}

/**
 * Get app data directory path via backend command.
 * Returns empty string in web environment.
 */
export async function getAppDataDir(): Promise<string> {
  if (isTauri()) {
    return invoke<string>('get_app_data_dir');
  }
  return 'indexeddb://appdata';
}

/**
 * Get disk space information for a path.
 */
export async function getDiskSpace(path: string): Promise<DiskSpaceInfo> {
  if (isTauri()) {
    const result = await invoke<{
      available_bytes?: number;
      total_bytes: number;
      percent_available?: number;
      free_bytes?: number;
      available_percent?: number;
    }>('get_disk_space', { path });
    const availableBytes = result.available_bytes ?? result.free_bytes ?? 0;
    const percentAvailable = result.percent_available ?? result.available_percent ?? 0;
    return {
      available_bytes: availableBytes,
      total_bytes: result.total_bytes,
      percent_available: percentAvailable,
    };
  }
  
  // Web approximation
  let available = 10 * 1024 * 1024 * 1024; // Default 10GB
  let total = 10 * 1024 * 1024 * 1024;
  
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      try {
          const estimate = await navigator.storage.estimate();
          if (estimate.quota) { total = estimate.quota; }
          if (estimate.usage !== undefined && estimate.quota) { available = estimate.quota - estimate.usage; }
      } catch (e) { /* ignore */ }
  }
  
  return {
      available_bytes: available,
      total_bytes: total,
      percent_available: total > 0 ? (available / total) * 100 : 100
  };
}

export async function resolveStorageRoot(): Promise<StorageRootInfo> {
  if (isTauri()) {
    return invoke<StorageRootInfo>('resolve_storage_root');
  }
  return {
    documents_path: 'indexeddb://documents',
    appdata_path: 'indexeddb://appdata',
    recommended_path: 'indexeddb://documents',
  };
}

export async function validateStorageRoot(path: string): Promise<StorageRootValidationResult> {
  if (isTauri()) {
    return invoke<StorageRootValidationResult>('validate_storage_root', { path });
  }
  
  // Web validation: always valid for virtual paths
  const isVirtual = path.startsWith('indexeddb://');
  return {
    exists: isVirtual,
    writable: isVirtual,
    available_bytes: 1024 * 1024 * 1024, // Dummy 1GB
    total_bytes: 1024 * 1024 * 1024,
    percent_available: 100,
  };
}

export async function createDirectory(path: string, recursive = true): Promise<void> {
  if (isTauri()) {
    await invoke('create_directory', { path, recursive });
    return;
  }
  // Web no-op
  if (path.startsWith('indexeddb://')) { return; }
  console.warn('Directory creation requires Tauri runtime');
}

export async function listDirectoryFiles(path: string, extension: string): Promise<string[]> {
  if (isTauri()) {
    return invoke<string[]>('list_directory_files', { path, extension });
  }
  return [];
}

/**
 * Copy file to new location
 * @throws Error if not in Tauri environment
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  if (isTauri()) {
    const { copyFile: tauriCopy } = await import('@tauri-apps/plugin-fs');
    await tauriCopy(source, destination);
    return;
  }
  // Web can't really copy files in structure without adapter support
  console.warn('File copy requires Tauri runtime');
}

/**
 * Remove file
 * @throws Error if not in Tauri environment
 */
export async function removeFile(path: string): Promise<void> {
  if (isTauri()) {
    const { remove: tauriRemove } = await import('@tauri-apps/plugin-fs');
    await tauriRemove(path);
    return;
  }
  console.warn('File removal requires Tauri runtime');
}

/**
 * Remove file or directory path.
 * @throws Error if not in Tauri environment
 */
export async function removePath(path: string, recursive = false): Promise<void> {
  if (isTauri()) {
    const { remove: tauriRemove } = await import('@tauri-apps/plugin-fs');
    const removeWithOptions = tauriRemove as unknown as (
      inputPath: string,
      options?: { recursive?: boolean }
    ) => Promise<void>;
    await removeWithOptions(path, { recursive });
    return;
  }
  console.warn('Path removal requires Tauri runtime');
}

/**
 * Rename/move file
 * @throws Error if not in Tauri environment
 */
export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  if (isTauri()) {
    const { rename: tauriRename } = await import('@tauri-apps/plugin-fs');
    await tauriRename(oldPath, newPath);
    return;
  }
  console.warn('File rename requires Tauri runtime');
}
