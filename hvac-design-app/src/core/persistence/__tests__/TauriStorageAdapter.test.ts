import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TauriStorageAdapter } from '../adapters/TauriStorageAdapter';
import { TauriPathManager } from '../TauriPathManager';

// Mock dependencies
vi.mock('../filesystem', () => ({
  getDocumentsDir: vi.fn().mockResolvedValue('/Users/test/Documents'),
  exists: vi.fn().mockResolvedValue(true),
  createDir: vi.fn().mockResolvedValue(undefined),
  readDir: vi.fn().mockResolvedValue([]),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

vi.mock('../TauriPathManager', () => ({
  TauriPathManager: {
    getPath: vi.fn(),
  },
}));

describe('TauriStorageAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureInitialized', () => {
    it('should use default path when no custom path is set', async () => {
      // Setup
      vi.mocked(TauriPathManager.getPath).mockReturnValue(null);
      
      const adapter = new TauriStorageAdapter();
      
      // Trigger initialization (via listProjects)
      await adapter.listProjects();
      
      // Since baseDir is private, we verify behavior indirectly or check mocks if possible.
      // However, we can inspect the private property for testing purposes using "any" cast
      expect((adapter as any).baseDir).toBe('/Users/test/Documents/SizeWise/Projects');
    });

    it('should use custom path when set in TauriPathManager', async () => {
      // Setup
      const customPath = '/Custom/Project/Path';
      vi.mocked(TauriPathManager.getPath).mockReturnValue(customPath);
      
      const adapter = new TauriStorageAdapter();
      
      // Trigger initialization
      await adapter.listProjects();
      
      expect((adapter as any).baseDir).toBe(customPath);
    });
  });
});
