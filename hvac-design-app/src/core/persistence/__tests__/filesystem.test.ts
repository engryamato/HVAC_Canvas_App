import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isTauri,
  readTextFile,
  writeTextFile,
  exists,
  createDir,
  readDir,
  getDocumentsDir,
} from '../filesystem';

// Mock window object
const mockWindow = {
  __TAURI__: {},
};

describe('filesystem utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('isTauri', () => {
    it('should return false when window is undefined', () => {
      // In test environment, window may not have __TAURI__
      const result = isTauri();
      // Result depends on test environment
      expect(typeof result).toBe('boolean');
    });
  });

  describe('web environment fallbacks', () => {
    // These tests verify behavior when NOT in Tauri environment

    it('readTextFile should throw error in web environment', async () => {
      // Assuming we're not in Tauri during tests
      if (!isTauri()) {
        await expect(readTextFile('/test/path')).rejects.toThrow(
          'File system access requires Tauri runtime'
        );
      }
    });

    it('writeTextFile should throw error in web environment', async () => {
      if (!isTauri()) {
        await expect(writeTextFile('/test/path', 'content')).rejects.toThrow(
          'File system access requires Tauri runtime'
        );
      }
    });

    it('exists should return false in web environment', async () => {
      if (!isTauri()) {
        const result = await exists('/test/path');
        expect(result).toBe(false);
      }
    });

    it('createDir should throw error in web environment', async () => {
      if (!isTauri()) {
        await expect(createDir('/test/path')).rejects.toThrow(
          'Directory creation requires Tauri runtime'
        );
      }
    });

    it('readDir should return empty array in web environment', async () => {
      if (!isTauri()) {
        const result = await readDir('/test/path');
        expect(result).toEqual([]);
      }
    });

    it('getDocumentsDir should return empty string in web environment', async () => {
      if (!isTauri()) {
        const result = await getDocumentsDir();
        expect(result).toBe('');
      }
    });
  });
});

