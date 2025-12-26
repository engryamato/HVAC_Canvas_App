/**
 * Type declarations for Tauri modules that may not be available in web builds
 * These modules are only used when running in Tauri desktop environment
 */

declare module '@tauri-apps/api/fs' {
  export function readTextFile(path: string): Promise<string>;
  export function writeTextFile(path: string, content: string): Promise<void>;
  export function exists(path: string): Promise<boolean>;
  export function createDir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readDir(path: string): Promise<Array<{ name?: string }>>;
  export function copyFile(source: string, destination: string): Promise<void>;
  export function removeFile(path: string): Promise<void>;
  export function renameFile(oldPath: string, newPath: string): Promise<void>;
}

declare module '@tauri-apps/api/path' {
  export function documentDir(): Promise<string>;
}
