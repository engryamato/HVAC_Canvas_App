import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TauriStorageAdapter } from '../TauriStorageAdapter';
import type { ProjectFile, ProjectMetadata } from '../../../schema/project-file.schema';
import type { StorageConfig } from '../../types';

// Mock all Tauri filesystem APIs
vi.mock('../../filesystem', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  createDir: vi.fn(),
  readDir: vi.fn(),
  copyFile: vi.fn(),
  removeFile: vi.fn(),
  renameFile: vi.fn(),
  getDocumentsDir: vi.fn(() => '/mock/documents'),
  isTauri: vi.fn(() => true),
}));

// Mock serialization functions
vi.mock('../../serialization', () => ({
  serializeProject: vi.fn((project: ProjectFile) => ({
    success: true,
    data: JSON.stringify(project),
  })),
  deserializeProject: vi.fn((json: string) => ({
    success: true,
    data: JSON.parse(json),
  })),
  deserializeProjectLenient: vi.fn((json: string) => ({
    success: true,
    data: JSON.parse(json),
  })),
  migrateProject: vi.fn((project: unknown, _version: string) => ({
    success: true,
    data: project,
  })),
}));

// Import mocked modules
import * as filesystem from '../../filesystem';
import * as serialization from '../../serialization';

// Helper to create a mock project
function createMockProject(overrides?: Partial<ProjectFile>): ProjectFile {
  return {
    schemaVersion: '1.0.0',
    projectId: 'test-project-id',
    projectName: 'Test Project',
    projectNumber: 'PRJ-001',
    clientName: 'Test Client',
    location: 'Test Location',
    createdAt: '2024-01-01T00:00:00.000Z',
    modifiedAt: '2024-01-01T00:00:00.000Z',
    entities: {
      byId: {},
      allIds: [],
    },
    viewportState: {
      panX: 0,
      panY: 0,
      zoom: 1,
    },
    settings: {
      unitSystem: 'imperial',
      gridSize: 12,
      gridVisible: true,
      snapToGrid: true,
    },
    scope: {
      projectType: 'residential',
      details: [],
      materials: [],
    },
    siteConditions: {
      elevation: '100',
      outdoorTemp: '70',
      indoorTemp: '70',
      windSpeed: '90',
      humidity: '50',
      localCodes: 'IBC 2021',
    },
    isArchived: false,
    ...overrides,
  };
}

describe('TauriStorageAdapter', () => {
  let adapter: TauriStorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new TauriStorageAdapter();
  });

  describe('Constructor & Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultAdapter = new TauriStorageAdapter();
      expect(defaultAdapter).toBeDefined();
    });

    it('should accept custom base directory', () => {
      const config: StorageConfig = {
        baseDir: '/custom/path',
      };
      const customAdapter = new TauriStorageAdapter(config);
      expect(customAdapter).toBeDefined();
    });

    it('should accept custom auto-save configuration', () => {
      const config: StorageConfig = {
        autoSave: {
          enabled: false,
          intervalMs: 30000,
          maxCopies: 10,
          cleanupOnSave: false,
        },
      };
      const customAdapter = new TauriStorageAdapter(config);
      expect(customAdapter).toBeDefined();
    });
  });

  describe('saveProject()', () => {
    it('should create project folder structure on first save', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      await adapter.saveProject(project);

      // Should create all required directories
      expect(filesystem.createDir).toHaveBeenCalledWith(
        expect.stringContaining('test-project-id'),
        true
      );
      expect(filesystem.createDir).toHaveBeenCalledWith(
        expect.stringContaining('.autosave'),
        true
      );
      expect(filesystem.createDir).toHaveBeenCalledWith(
        expect.stringContaining('.metadata'),
        true
      );
      expect(filesystem.createDir).toHaveBeenCalledWith(
        expect.stringContaining('exports'),
        true
      );
    });

    it('should serialize project correctly', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      await adapter.saveProject(project);

      expect(serialization.serializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project-id',
          projectName: 'Test Project',
        })
      );
    });

    it('should create backup before overwriting', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.copyFile).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      await adapter.saveProject(project, { createBackup: true });

      expect(filesystem.exists).toHaveBeenCalled();
      expect(filesystem.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('.hvac'),
        expect.stringContaining('.hvac.bak')
      );
    });

    it('should use atomic write (temp file → rename pattern)', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      await adapter.saveProject(project, { atomic: true });

      // Should write to temp file
      expect(filesystem.writeTextFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String)
      );

      // Should rename temp to final
      expect(filesystem.renameFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('.hvac')
      );
    });

    it('should return SaveResult with filePath and sizeBytes', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      const result = await adapter.saveProject(project);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.filePath).toContain('.hvac');
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should handle permission denied errors', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockRejectedValue(
        new Error('permission denied')
      );

      const result = await adapter.saveProject(project);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PERMISSION_DENIED');
    });

    it('should handle disk full errors', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.exists).mockResolvedValue(false);
      vi.mocked(filesystem.writeTextFile).mockRejectedValue(
        new Error('disk full')
      );

      const result = await adapter.saveProject(project);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRITE_ERROR');
    });

    it('should handle validation errors', async () => {
      const invalidProject = { invalid: 'project' } as unknown as ProjectFile;

      const result = await adapter.saveProject(invalidProject);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('loadProject()', () => {
    it('should load valid project file', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));

      const result = await adapter.loadProject('test-project-id');

      expect(result.success).toBe(true);
      expect(result.project).toEqual(expect.objectContaining({
        projectId: 'test-project-id',
        projectName: 'Test Project',
      }));
    });

    it('should fallback to backup if main file corrupted', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce('corrupted data') // Main file
        .mockResolvedValueOnce(JSON.stringify(project)); // Backup file
      
      vi.mocked(serialization.deserializeProject)
        .mockReturnValueOnce({ success: false, error: 'Invalid JSON' })
        .mockReturnValueOnce({ success: true, data: project });

      const result = await adapter.loadProject('test-project-id');

      expect(result.success).toBe(true);
      expect(result.source).toBe('localStorage'); // Indicates backup
    });

    it('should fallback to auto-save if backup corrupted', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['2024-01-01T00-00-00.hvac']);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      
      vi.mocked(serialization.deserializeProject)
        .mockReturnValueOnce({ success: false, error: 'Invalid JSON' }) // Main
        .mockReturnValueOnce({ success: false, error: 'Invalid JSON' }) // Backup
        .mockReturnValueOnce({ success: true, data: project }); // Auto-save

      const result = await adapter.loadProject('test-project-id');

      expect(result.success).toBe(true);
      expect(result.source).toBe('indexedDB'); // Indicates autosave
    });

    it('should return FILE_NOT_FOUND for missing projects', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(false);

      const result = await adapter.loadProject('nonexistent-id');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FILE_NOT_FOUND');
    });

    it('should return CORRUPTED_FILE for invalid JSON', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue('corrupted data');
      vi.mocked(filesystem.readDir).mockResolvedValue([]);
      vi.mocked(serialization.deserializeProject).mockReturnValue({
        success: false,
        error: 'Invalid JSON',
      });
      vi.mocked(serialization.deserializeProjectLenient).mockReturnValue({
        success: false,
        error: 'Invalid JSON',
      });

      const result = await adapter.loadProject('test-project-id');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CORRUPTED_FILE');
    });
  });

  describe('deleteProject()', () => {
    it('should delete entire project directory', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.removeFile).mockResolvedValue();

      const result = await adapter.deleteProject('test-project-id');

      expect(result.success).toBe(true);
      expect(filesystem.removeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-project-id')
      );
    });

    it('should be idempotent (no error if already deleted)', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(false);

      const result = await adapter.deleteProject('test-project-id');

      expect(result.success).toBe(true);
      expect(filesystem.removeFile).not.toHaveBeenCalled();
    });

    it('should handle permission denied errors', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.removeFile).mockRejectedValue(
        new Error('permission denied')
      );

      const result = await adapter.deleteProject('test-project-id');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PERMISSION_DENIED');
    });
  });

  describe('duplicateProject()', () => {
    it('should create copy with new ID and name', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      const result = await adapter.duplicateProject('test-project-id', 'Duplicated Project');

      expect(result.success).toBe(true);
      expect(result.project?.projectName).toBe('Duplicated Project');
      expect(result.project?.projectId).not.toBe('test-project-id');
    });

    it('should preserve all entities and settings', async () => {
      const project = createMockProject({
        entities: {
          byId: { 'room-1': { id: 'room-1' } as any },
          allIds: ['room-1'],
        },
      });
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      const result = await adapter.duplicateProject('test-project-id', 'Copy');

      expect(result.success).toBe(true);
      expect(result.project?.entities.allIds).toContain('room-1');
    });

    it('should reset timestamps', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      const result = await adapter.duplicateProject('test-project-id', 'Copy');

      expect(result.success).toBe(true);
      expect(result.project?.createdAt).not.toBe(project.createdAt);
      expect(result.project?.modifiedAt).not.toBe(project.modifiedAt);
    });
  });

  describe('listProjects()', () => {
    it('should return empty array for empty directory', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([]);

      const projects = await adapter.listProjects();

      expect(projects).toEqual([]);
    });

    it('should scan directory and return metadata', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['test-project-id']);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));

      const projects = await adapter.listProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]!.projectId).toBe('test-project-id');
    });

    it('should skip corrupted files', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['project-1', 'project-2']);
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce(JSON.stringify(createMockProject({ projectId: 'project-1' })))
        .mockRejectedValueOnce(new Error('Corrupted'));

      const projects = await adapter.listProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]!.projectId).toBe('project-1');
    });

    it('should sort by modifiedAt descending', async () => {
      const project1 = createMockProject({ projectId: 'p1', modifiedAt: '2024-01-01T00:00:00.000Z' });
      const project2 = createMockProject({ projectId: 'p2', modifiedAt: '2024-01-02T00:00:00.000Z' });
      
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['p1', 'p2']);
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce(JSON.stringify(project1))
        .mockResolvedValueOnce(JSON.stringify(project2));

      const projects = await adapter.listProjects();

      expect(projects[0]!.projectId).toBe('p2'); // Most recent first
      expect(projects[1]!.projectId).toBe('p1');
    });
  });

  describe('searchProjects()', () => {
    beforeEach(() => {
      const project1 = createMockProject({ 
        projectId: 'p1',
        projectName: 'HVAC Design Project',
        projectNumber: 'PRJ-001',
      });
      const project2 = createMockProject({
        projectId: 'p2',
        projectName: 'Plumbing Project',
        clientName: 'ACME Corp',
      });

      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['p1', 'p2']);
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce(JSON.stringify(project1))
        .mockResolvedValueOnce(JSON.stringify(project2));
    });

    it('should filter by project name (case-insensitive)', async () => {
      const results = await adapter.searchProjects('hvac');

      expect(results).toHaveLength(1);
      expect(results[0]!.projectId).toBe('p1');
    });

    it('should filter by project number', async () => {
      const results = await adapter.searchProjects('PRJ-001');

      expect(results).toHaveLength(1);
      expect(results[0]!.projectId).toBe('p1');
    });

    it('should filter by client name', async () => {
      const results = await adapter.searchProjects('acme');

      expect(results).toHaveLength(1);
      expect(results[0]!.projectId).toBe('p2');
    });

    it('should return empty array for no matches', async () => {
      const results = await adapter.searchProjects('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('autoSave()', () => {
    it('should write to .autosave/ subdirectory', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.readDir).mockResolvedValue([]);

      await adapter.autoSave(project);

      expect(filesystem.writeTextFile).toHaveBeenCalledWith(
        expect.stringContaining('.autosave'),
        expect.any(String)
      );
    });

    it('should generate timestamp-based filename', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.readDir).mockResolvedValue([]);

      const result = await adapter.autoSave(project);

      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.autoSaveId).toContain(project.projectId);
    });

    it('should return AutoSaveResult with metadata', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.readDir).mockResolvedValue([]);

      const result = await adapter.autoSave(project);

      expect(result.success).toBe(true);
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
      expect(result.autoSaveId).toBeDefined();
    });

    it('should trigger cleanup after save', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([
        '2024-01-01.hvac',
        '2024-01-02.hvac',
        '2024-01-03.hvac',
        '2024-01-04.hvac',
        '2024-01-05.hvac',
        '2024-01-06.hvac',
      ]);
      vi.mocked(filesystem.removeFile).mockResolvedValue();

      await adapter.autoSave(project);

      // Should cleanup old auto-saves (keeping only 5)
      expect(filesystem.removeFile).toHaveBeenCalled();
    });
  });

  describe('listAutoSaves()', () => {
    it('should return empty array for no auto-saves', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(false);

      const autoSaves = await adapter.listAutoSaves('test-project-id');

      expect(autoSaves).toEqual([]);
    });

    it('should list all auto-saves sorted by timestamp', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([
        '2024-01-01T00:00:00.000Z.hvac',
        '2024-01-02T00:00:00.000Z.hvac',
      ]);

      const autoSaves = await adapter.listAutoSaves('test-project-id');

      expect(autoSaves).toHaveLength(2);
      expect(autoSaves[0]!.timestamp).toBe('2024-01-02T00:00:00.000Z'); // Newest first
      expect(autoSaves[1]!.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should include file sizes', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['2024-01-01T00:00:00.000Z.hvac']);

      const autoSaves = await adapter.listAutoSaves('test-project-id');

      expect(autoSaves[0]!.sizeBytes).toBeDefined();
    });
  });

  describe('restoreAutoSave()', () => {
    it('should load auto-save file', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.copyFile).mockResolvedValue();

      const result = await adapter.restoreAutoSave(
        'test-project-id',
        '2024-01-01T00:00:00.000Z'
      );

      expect(result.success).toBe(true);
      expect(result.project).toEqual(expect.objectContaining({
        projectId: 'test-project-id',
      }));
    });

    it('should promote to main file', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.copyFile).mockResolvedValue();

      await adapter.restoreAutoSave('test-project-id', '2024-01-01T00:00:00.000Z');

      expect(filesystem.writeTextFile).toHaveBeenCalledWith(
        expect.stringContaining('.hvac'),
        expect.any(String)
      );
    });

    it('should create backup of old main file', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.copyFile).mockResolvedValue();

      await adapter.restoreAutoSave('test-project-id', '2024-01-01T00:00:00.000Z');

      expect(filesystem.exists).toHaveBeenCalled();
    });
  });

  describe('cleanupAutoSaves()', () => {
    it('should keep only last N auto-saves', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([
        '2024-01-01.hvac',
        '2024-01-02.hvac',
        '2024-01-03.hvac',
        '2024-01-04.hvac',
        '2024-01-05.hvac',
      ]);
      vi.mocked(filesystem.removeFile).mockResolvedValue();

      await adapter.cleanupAutoSaves('test-project-id', 3);

      // Should delete 2 oldest auto-saves
      expect(filesystem.removeFile).toHaveBeenCalledTimes(2);
    });

    it('should delete older auto-saves', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([
        '2024-01-05.hvac',
        '2024-01-04.hvac',
        '2024-01-03.hvac',
      ]);
      vi.mocked(filesystem.removeFile).mockResolvedValue();

      await adapter.cleanupAutoSaves('test-project-id', 2);

      expect(filesystem.removeFile).toHaveBeenCalledTimes(1);
      expect(filesystem.removeFile).toHaveBeenCalledWith(
        expect.stringContaining('2024-01-03.hvac')
      );
    });

    it('should handle keepCount = 0', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([
        '2024-01-01.hvac',
        '2024-01-02.hvac',
      ]);
      vi.mocked(filesystem.removeFile).mockResolvedValue();

      await adapter.cleanupAutoSaves('test-project-id', 0);

      // Should delete all auto-saves
      expect(filesystem.removeFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateMetadata()', () => {
    it('should update metadata fields', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      const metadata: Partial<ProjectMetadata> = {
        projectName: 'Updated Name',
      };

      await adapter.updateMetadata('test-project-id', metadata);

      expect(serialization.serializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: 'Updated Name',
        })
      );
    });

    it('should preserve entities', async () => {
      const project = createMockProject({
        entities: {
          byId: { 'room-1': { id: 'room-1' } as any },
          allIds: ['room-1'],
        },
      });
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      await adapter.updateMetadata('test-project-id', { projectName: 'Updated' });

      expect(serialization.serializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          entities: expect.objectContaining({
            allIds: ['room-1'],
          }),
        })
      );
    });
  });

  describe('saveThumbnail()', () => {
    it('should write thumbnail to .metadata/ directory', async () => {
      const imageBlob = new Blob(['test image data'], { type: 'image/png' });
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();

      await adapter.saveThumbnail('test-project-id', imageBlob);

      expect(filesystem.createDir).toHaveBeenCalledWith(
        expect.stringContaining('.metadata'),
        true
      );
      expect(filesystem.writeTextFile).toHaveBeenCalledWith(
        expect.stringContaining('thumbnail.png'),
        expect.any(String)
      );
    });

    it('should handle Blob conversion', async () => {
      const imageBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();

      await expect(adapter.saveThumbnail('test-project-id', imageBlob)).resolves.not.toThrow();
    });
  });

  describe('getStorageInfo()', () => {
    it('should return platform: tauri', async () => {
      const info = await adapter.getStorageInfo();

      expect(info.platform).toBe('tauri');
    });

    it('should return storageType: filesystem', async () => {
      const info = await adapter.getStorageInfo();

      expect(info.storageType).toBe('filesystem');
    });
  });
});
