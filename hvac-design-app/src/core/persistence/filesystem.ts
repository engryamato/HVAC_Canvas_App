/**
 * File system utilities for Tauri/web environments
 * Provides a unified API that works in both Tauri desktop and web contexts
 */

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
  throw new Error('File system access requires Tauri runtime');
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
  throw new Error('File system access requires Tauri runtime');
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
  return false;
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
  throw new Error('Directory creation requires Tauri runtime');
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
  return '';
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
  throw new Error('File copy requires Tauri runtime');
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
  throw new Error('File removal requires Tauri runtime');
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
  throw new Error('File rename requires Tauri runtime');
}


/**
 * Open file/directory selection dialog
 * @throws Error if not in Tauri environment
 */
export async function selectDirectory(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      recursive: true,
    });
    return selected as string | null;
  }
  throw new Error('Directory selection requires Tauri runtime');
}
