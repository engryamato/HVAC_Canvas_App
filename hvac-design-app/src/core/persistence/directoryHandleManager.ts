import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * IndexedDB schema for storing the FileSystemDirectoryHandle
 */
interface DirectoryHandleDB extends DBSchema {
  'directory-handles': {
    key: string;
    value: {
      id: string;
      handle: FileSystemDirectoryHandle;
      timestamp: string;
    };
  };
}

const DB_NAME = 'sizewise-directory-handles';
const DB_VERSION = 1;
const STORE_NAME = 'directory-handles';
const PROJECTS_DIR_KEY = 'projects-directory';

interface PermissionCapableHandle {
  queryPermission: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
}

/**
 * Directory Handle Manager
 * Manages FileSystemDirectoryHandle persistence and permission verification
 */
export class DirectoryHandleManager {
  private dbPromise: Promise<IDBPDatabase<DirectoryHandleDB>>;

  constructor() {
    this.dbPromise = openDB<DirectoryHandleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  /**
   * Request directory access from the user
   */
  async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
    try {
      if (!('showDirectoryPicker' in globalThis)) {
        throw new Error('File System Access API not supported in this browser');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dirHandle = await (globalThis as any).showDirectoryPicker({
        id: 'sizewise-projects',
        mode: 'readwrite',
        startIn: 'documents',
      });

      // Verify we have read/write permission
      const permission = await this.verifyPermission(dirHandle);
      if (!permission) {
        return null;
      }

      // Store the handle
      await this.saveDirectoryHandle(dirHandle);

      return dirHandle;
    } catch (error) {
      // User cancelled or browser doesn't support API
      console.info('Directory access cancelled or not supported:', error);
      return null;
    }
  }

  /**
   * Get the stored directory handle
   */
  async getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
      const db = await this.dbPromise;
      const record = await db.get(STORE_NAME, PROJECTS_DIR_KEY);

      if (!record?.handle) {
        return null;
      }

      // Verify permission is still granted
      const hasPermission = await this.verifyPermission(record.handle);
      if (!hasPermission) {
        // Permission revoked, clear stored handle
        await this.clearDirectoryHandle();
        return null;
      }

      return record.handle;
    } catch (error) {
      console.error('Failed to retrieve directory handle:', error);
      return null;
    }
  }

  /**
   * Verify we have read/write permission for the directory
   */
  async verifyPermission(
    dirHandle: FileSystemDirectoryHandle,
    requestIfNeeded = true
  ): Promise<boolean> {
    const opts = { mode: 'readwrite' } as const;
    const permissionHandle = dirHandle as unknown as PermissionCapableHandle;

    // Check current permission
    if ((await permissionHandle.queryPermission(opts)) === 'granted') {
      return true;
    }

    // Request permission if needed
    if (requestIfNeeded && (await permissionHandle.requestPermission(opts)) === 'granted') {
      return true;
    }

    return false;
  }

  /**
   * Save directory handle to IndexedDB
   */
  async saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, {
      id: PROJECTS_DIR_KEY,
      handle,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Clear the stored directory handle
   */
  async clearDirectoryHandle(): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, PROJECTS_DIR_KEY);
  }

  /**
   * Check if a directory handle is currently stored
   */
  async hasStoredHandle(): Promise<boolean> {
    const handle = await this.getDirectoryHandle();
    return handle !== null;
  }

  /**
   * Create the required folder structure (SizeWise/Projects) inside the parent handle
   */
  async createFolderStructure(
    parentHandle: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle | null> {
    try {
      // Create SizeWise folder
      const sizeWiseHandle = await parentHandle.getDirectoryHandle('SizeWise', {
        create: true,
      });

      // Create Projects subfolder
      const projectsHandle = await sizeWiseHandle.getDirectoryHandle('Projects', {
        create: true,
      });

      // Save the Projects handle to IndexedDB so next time we open straight to it
      await this.saveDirectoryHandle(projectsHandle);

      return projectsHandle;
    } catch (error) {
      console.error('Failed to create folder structure:', error);
      return null;
    }
  }

  /**
   * Verify if the handle points to the expected folder structure
   */
  async verifyFolderStructure(handle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      const name = handle.name;
      // Accept if it's "Projects" or "SizeWise" (though likely we want "Projects")
      return name === 'Projects' || name === 'SizeWise';
    } catch {
      return false;
    }
  }
}

// Singleton instance
let instance: DirectoryHandleManager | null = null;

export function getDirectoryHandleManager(): DirectoryHandleManager {
  if (!instance) {
    instance = new DirectoryHandleManager();
  }
  return instance;
}

// Convenience exports
export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return getDirectoryHandleManager().getDirectoryHandle();
}

export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  return getDirectoryHandleManager().requestDirectoryAccess();
}

export async function clearDirectoryHandle(): Promise<void> {
  return getDirectoryHandleManager().clearDirectoryHandle();
}

export async function verifyPermission(
  dirHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  return getDirectoryHandleManager().verifyPermission(dirHandle);
}

export async function createFolderStructure(
  parentHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle | null> {
  return getDirectoryHandleManager().createFolderStructure(parentHandle);
}

export async function verifyFolderStructure(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  return getDirectoryHandleManager().verifyFolderStructure(handle);
}
