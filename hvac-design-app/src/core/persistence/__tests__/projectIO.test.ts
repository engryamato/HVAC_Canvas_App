import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveProject, loadProject, loadBackup, projectExists, getBackupPath } from '../projectIO';
import * as filesystem from '../filesystem';
import * as serialization from '../serialization';
import { createEmptyProjectFile } from '@/core/schema';

// Mock the filesystem module
vi.mock('../filesystem', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  isTauri: vi.fn(() => true),
}));

// Mock the serialization module
vi.mock('../serialization', () => ({
  serializeProject: vi.fn(),
  deserializeProject: vi.fn(),
  migrateProject: vi.fn(),
}));

describe('projectIO', () => {
  const mockProject = createEmptyProjectFile('test-id', 'Test Project');
  const mockPath = '/projects/test-project.sws';
  const mockBackupPath = '/projects/test-project.sws.bak';
  const mockSerializedData = JSON.stringify(mockProject, null, 2);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveProject', () => {
    it('should serialize and save project to file', async () => {
      vi.mocked(serialization.serializeProject).mockReturnValue({
        success: true,
        data: mockSerializedData,
      });
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.writeTextFile).mockResolvedValue(undefined);

      const result = await saveProject(mockProject, mockPath);

      expect(result.success).toBe(true);
      expect(serialization.serializeProject).toHaveBeenCalledWith(mockProject);
      expect(filesystem.writeTextFile).toHaveBeenCalledWith(mockPath, mockSerializedData);
    });

    it('should create backup before overwriting existing file', async () => {
      const existingContent = '{"existing": true}';

      vi.mocked(serialization.serializeProject).mockReturnValue({
        success: true,
        data: mockSerializedData,
      });
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(existingContent);
      vi.mocked(filesystem.writeTextFile).mockResolvedValue(undefined);

      const result = await saveProject(mockProject, mockPath);

      expect(result.success).toBe(true);
      // Should have read existing file
      expect(filesystem.readTextFile).toHaveBeenCalledWith(mockPath);
      // Should have written backup
      expect(filesystem.writeTextFile).toHaveBeenCalledWith(mockBackupPath, existingContent);
      // Should have written new file
      expect(filesystem.writeTextFile).toHaveBeenCalledWith(mockPath, mockSerializedData);
    });

    it('should not create backup for new files', async () => {
      vi.mocked(serialization.serializeProject).mockReturnValue({
        success: true,
        data: mockSerializedData,
      });
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.writeTextFile).mockResolvedValue(undefined);

      await saveProject(mockProject, mockPath);

      expect(filesystem.readTextFile).not.toHaveBeenCalled();
      // Only one write call (no backup)
      expect(filesystem.writeTextFile).toHaveBeenCalledTimes(1);
    });

    it('should return error if serialization fails', async () => {
      vi.mocked(serialization.serializeProject).mockReturnValue({
        success: false,
        error: 'Serialization failed',
      });

      const result = await saveProject(mockProject, mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serialization failed');
      expect(filesystem.writeTextFile).not.toHaveBeenCalled();
    });

    it('should return error if write fails', async () => {
      vi.mocked(serialization.serializeProject).mockReturnValue({
        success: true,
        data: mockSerializedData,
      });
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.writeTextFile).mockRejectedValue(new Error('Write failed'));

      const result = await saveProject(mockProject, mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Write failed');
    });
  });

  describe('loadProject', () => {
    it('should load and deserialize project from file', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(mockSerializedData);
      vi.mocked(serialization.deserializeProject).mockReturnValue({
        success: true,
        data: mockProject,
      });

      const result = await loadProject(mockPath);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockProject);
      expect(result.loadedFromBackup).toBeUndefined();
    });

    it('should return error if file does not exist', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(false);

      const result = await loadProject(mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should fall back to backup if main file is corrupted', async () => {
      vi.mocked(filesystem.exists)
        .mockResolvedValueOnce(true) // Main file exists
        .mockResolvedValueOnce(true); // Backup exists
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce('corrupted data') // Main file read
        .mockResolvedValueOnce(mockSerializedData); // Backup read
      vi.mocked(serialization.deserializeProject)
        .mockReturnValueOnce({
          success: false,
          error: 'Invalid JSON',
        })
        .mockReturnValueOnce({
          success: true,
          data: mockProject,
        });

      const result = await loadProject(mockPath);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockProject);
      expect(result.loadedFromBackup).toBe(true);
    });

    it('should attempt migration if version mismatch detected', async () => {
      const oldVersionProject = { ...mockProject, schemaVersion: '0.9.0' };

      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(oldVersionProject));
      vi.mocked(serialization.deserializeProject).mockReturnValue({
        success: false,
        requiresMigration: true,
        foundVersion: '0.9.0',
        error: 'Version mismatch',
      });
      vi.mocked(serialization.migrateProject).mockReturnValue({
        success: true,
        data: mockProject,
      });

      const result = await loadProject(mockPath);

      expect(result.success).toBe(true);
      expect(serialization.migrateProject).toHaveBeenCalled();
    });

    it('should fall back to backup if migration fails', async () => {
      vi.mocked(filesystem.exists)
        .mockResolvedValueOnce(true) // Main file
        .mockResolvedValueOnce(true); // Backup
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce('{"schemaVersion": "0.9.0"}')
        .mockResolvedValueOnce(mockSerializedData);
      vi.mocked(serialization.deserializeProject)
        .mockReturnValueOnce({
          success: false,
          requiresMigration: true,
          foundVersion: '0.9.0',
        })
        .mockReturnValueOnce({
          success: true,
          data: mockProject,
        });
      vi.mocked(serialization.migrateProject).mockReturnValue({
        success: false,
        error: 'Migration failed',
      });

      const result = await loadProject(mockPath);

      expect(result.success).toBe(true);
      expect(result.loadedFromBackup).toBe(true);
    });

    it('should return error if both main and backup are corrupted', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue('corrupted');
      vi.mocked(serialization.deserializeProject).mockReturnValue({
        success: false,
        error: 'Invalid JSON',
      });

      const result = await loadProject(mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup file is also corrupted');
    });

    it('should return error if no backup available', async () => {
      vi.mocked(filesystem.exists)
        .mockResolvedValueOnce(true) // Main file exists
        .mockResolvedValueOnce(false); // Backup does not exist
      vi.mocked(filesystem.readTextFile).mockResolvedValue('corrupted');
      vi.mocked(serialization.deserializeProject).mockReturnValue({
        success: false,
        error: 'Invalid JSON',
      });

      const result = await loadProject(mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No backup file available');
    });
  });

  describe('loadBackup', () => {
    it('should load project from backup file', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(mockSerializedData);
      vi.mocked(serialization.deserializeProject).mockReturnValue({
        success: true,
        data: mockProject,
      });

      const result = await loadBackup(mockPath);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockProject);
      expect(result.loadedFromBackup).toBe(true);
      expect(filesystem.readTextFile).toHaveBeenCalledWith(mockBackupPath);
    });

    it('should return error if backup does not exist', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(false);

      const result = await loadBackup(mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No backup file available');
    });

    it('should return error if backup is corrupted', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue('corrupted');
      vi.mocked(serialization.deserializeProject).mockReturnValue({
        success: false,
        error: 'Invalid JSON',
      });

      const result = await loadBackup(mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup file is also corrupted');
    });
  });

  describe('projectExists', () => {
    it('should return true if project file exists', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);

      const result = await projectExists(mockPath);

      expect(result).toBe(true);
      expect(filesystem.exists).toHaveBeenCalledWith(mockPath);
    });

    it('should return false if project file does not exist', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(false);

      const result = await projectExists(mockPath);

      expect(result).toBe(false);
    });
  });

  describe('getBackupPath', () => {
    it('should append .bak extension to project path', () => {
      const result = getBackupPath('/projects/test.sws');
      expect(result).toBe('/projects/test.sws.bak');
    });

    it('should handle paths with existing extensions', () => {
      const result = getBackupPath('/path/to/project.sws');
      expect(result).toBe('/path/to/project.sws.bak');
    });
  });

  describe('error handling', () => {
    it('should handle filesystem errors gracefully during save', async () => {
      vi.mocked(serialization.serializeProject).mockReturnValue({
        success: true,
        data: mockSerializedData,
      });
      vi.mocked(filesystem.exists).mockRejectedValue(new Error('Filesystem error'));

      const result = await saveProject(mockProject, mockPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Filesystem error');
    });

    it('should handle filesystem errors gracefully during load', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockRejectedValue(new Error('Read error'));
      vi.mocked(filesystem.exists).mockResolvedValue(false); // No backup

      const result = await loadProject(mockPath);

      // Should try to load backup and fail
      expect(result.success).toBe(false);
    });
  });
});
