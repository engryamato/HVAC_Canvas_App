/// <reference lib="dom.iterable" />

/**
 * Minimal type extensions for File System Access API
 * (These may not be in older TypeScript versions)
 */
declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }
}

export {};
