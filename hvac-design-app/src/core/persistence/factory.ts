import { isTauri } from './filesystem';
import { StorageAdapter } from './StorageAdapter';
import { StorageConfig } from './types';
import { TauriStorageAdapter } from './adapters/TauriStorageAdapter';
import { WebStorageAdapter } from './adapters/WebStorageAdapter';
import { FileSystemAccessAdapter } from './adapters/FileSystemAccessAdapter';
import { getDirectoryHandle, verifyPermission } from './directoryHandleManager';

/**
 * Factory to create the appropriate storage adapter for the current environment.
 * 
 * Priority:
 * 1. Tauri (if in desktop app)
 * 2. File System Access (if user has granted folder permission in web)
 * 3. IndexedDB (fallback for web)
 * 
 * @param config - Optional configuration for the storage adapter
 * @returns Promise resolving to the initialized StorageAdapter
 * @throws Error if no suitable adapter can be initialized
 */
export async function createStorageAdapter(config?: StorageConfig): Promise<StorageAdapter> {
  // 1. Desktop app (Tauri)
  if (isTauri()) {
    console.debug('[StorageFactory] Detected Tauri environment');
    return new TauriStorageAdapter(config);
  }

  // 2. Web app - check for File System Access
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    const dirHandle = await getDirectoryHandle();
    if (dirHandle) {
      // Verify we still have permission
      const hasPermission = await verifyPermission(dirHandle);
      if (hasPermission) {
        console.debug('[StorageFactory] Using File System Access API');
        return new FileSystemAccessAdapter(dirHandle, config);
      }
    }
  }

  // 3. Fallback to IndexedDB
  console.debug('[StorageFactory] Detected Web environment, using IndexedDB');
  
  if (typeof window !== 'undefined' && window.indexedDB) {
    return new WebStorageAdapter(config);
  }
  
  // If running in SSR or environment without IndexedDB
  if (typeof window === 'undefined') {
    console.warn('[StorageFactory] storage adapter called on server/SSR');
    throw new Error('Storage adapter cannot be initialized on server');
  }
  
  throw new Error('No suitable storage mechanism available in this environment (IndexedDB or File System Access required)');
}

// ==================== Global Adapter Instance (with lazy initialization) ====================

let adapterInstance: StorageAdapter | null = null;

/**
 * Get or create the global storage adapter instance.
 * This ensures a single adapter instance is used throughout the app.
 */
export async function getAdapter(): Promise<StorageAdapter> {
  if (!adapterInstance) {
    adapterInstance = await createStorageAdapter();
  }
  return adapterInstance;
}

/**
 * Reset the global adapter instance.
 * Useful when switching between storage modes (e.g., after connecting a folder).
 */
export function resetAdapter(): void {
  adapterInstance = null;
}
