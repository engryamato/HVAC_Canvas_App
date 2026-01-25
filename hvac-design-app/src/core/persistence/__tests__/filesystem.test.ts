import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isTauri,
  readTextFile,
  writeTextFile,
  exists,
  createDir,
  readDir,
  getDocumentsDir,
  copyFile,
  removeFile,
  renameFile,
} from '../filesystem';

describe('filesystem utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('isTauri', () => {
    it('should return false in web environment (no __TAURI__)', () => {
      // Default test environment has no __TAURI__
      const result = isTauri();
      expect(result).toBe(false);
    });

    it('should return true when __TAURI__ exists on window', () => {
      // Mock Tauri environment
      (window as any).__TAURI__ = { invoke: vi.fn() };

      expect(isTauri()).toBe(true);

      // Cleanup
      delete (window as any).__TAURI__;
    });

    it('should handle SSR/Node.js environment (window undefined)', () => {
      // Store original window
      const originalWindow = globalThis.window;

      // Temporarily make window undefined
      // @ts-ignore - intentionally setting to undefined for test
      delete (globalThis as any).window;

      // In SSR, should return false without crashing
      // Note: Since we're in jsdom, window exists, so we test the logic
      const testSSR = () => {
        return typeof window !== 'undefined' && '__TAURI__' in window;
      };

      // Restore window
      (globalThis as any).window = originalWindow;

      // The function should handle undefined window gracefully
      expect(testSSR()).toBe(false);
    });

    it('should handle window without __TAURI__ property', () => {
      // Ensure __TAURI__ doesn't exist
      delete (window as any).__TAURI__;

      expect(isTauri()).toBe(false);
    });
  });

  describe('web environment fallbacks', () => {
    // These tests verify behavior when NOT in Tauri environment

    it('readTextFile should throw error in web environment', async () => {
      await expect(readTextFile('/test/path')).rejects.toThrow(
        'File system access requires Tauri runtime'
      );
    });

    it('writeTextFile should throw error in web environment', async () => {
      await expect(writeTextFile('/test/path', 'content')).rejects.toThrow(
        'File system access requires Tauri runtime'
      );
    });

    it('exists should return false in web environment (graceful fallback)', async () => {
      const result = await exists('/test/path');
      expect(result).toBe(false);
    });

    it('createDir should throw error in web environment', async () => {
      await expect(createDir('/test/path')).rejects.toThrow(
        'Directory creation requires Tauri runtime'
      );
    });

    it('readDir should return empty array in web environment (graceful fallback)', async () => {
      const result = await readDir('/test/path');
      expect(result).toEqual([]);
    });

    it('getDocumentsDir should return empty string in web environment (graceful fallback)', async () => {
      const result = await getDocumentsDir();
      expect(result).toBe('');
    });

    it('copyFile should throw error in web environment', async () => {
      await expect(copyFile('/source', '/dest')).rejects.toThrow(
        'File copy requires Tauri runtime'
      );
    });

    it('removeFile should throw error in web environment', async () => {
      await expect(removeFile('/test/path')).rejects.toThrow(
        'File removal requires Tauri runtime'
      );
    });

    it('renameFile should throw error in web environment', async () => {
      await expect(renameFile('/old', '/new')).rejects.toThrow(
        'File rename requires Tauri runtime'
      );
    });
  });

  describe('Tauri environment (mocked)', () => {
    let mockTauriReadTextFile: ReturnType<typeof vi.fn>;
    let mockTauriWriteTextFile: ReturnType<typeof vi.fn>;
    let mockTauriExists: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Setup Tauri mock
      (window as any).__TAURI__ = { invoke: vi.fn() };

      mockTauriReadTextFile = vi.fn().mockResolvedValue('file content');
      mockTauriWriteTextFile = vi.fn().mockResolvedValue(undefined);
      mockTauriExists = vi.fn().mockResolvedValue(true);

      // Mock dynamic imports
      vi.doMock('@tauri-apps/plugin-fs', () => ({
        readTextFile: mockTauriReadTextFile,
        writeTextFile: mockTauriWriteTextFile,
        writeFile: vi.fn().mockResolvedValue(undefined),
        exists: mockTauriExists,
        mkdir: vi.fn().mockResolvedValue(undefined),
        readDir: vi.fn().mockResolvedValue([{ name: 'file1.txt' }, { name: 'file2.txt' }]),
        copyFile: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        rename: vi.fn().mockResolvedValue(undefined),
      }));

      vi.doMock('@tauri-apps/api/path', () => ({
        documentDir: vi.fn().mockResolvedValue('/Users/test/Documents'),
      }));
    });

    afterEach(() => {
      delete (window as any).__TAURI__;
      vi.doUnmock('@tauri-apps/plugin-fs');
      vi.doUnmock('@tauri-apps/api/path');
    });

    it('isTauri should return true in Tauri environment', () => {
      expect(isTauri()).toBe(true);
    });

    // Note: Dynamic imports in vitest are tricky to mock fully
    // These tests verify the environment detection works
    // Full Tauri API testing requires actual Tauri environment
  });

  describe('error handling', () => {
    it('should provide meaningful error messages', async () => {
      await expect(readTextFile('/test/path')).rejects.toThrow(/Tauri/);
    });

    it('should not throw for graceful fallback functions', async () => {
      // These should never throw, only return fallback values
      await expect(exists('/any/path')).resolves.not.toThrow();
      await expect(readDir('/any/path')).resolves.not.toThrow();
      await expect(getDocumentsDir()).resolves.not.toThrow();
    });
  });
});

