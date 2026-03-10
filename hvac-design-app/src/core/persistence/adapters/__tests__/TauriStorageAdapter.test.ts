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
    projectId: '550e8400-e29b-41d4-a716-446655440000',
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
    // Use resetAllMocks to clear both call history AND mock implementations.
    // clearAllMocks only clears call counts; mockReturnValue() leaks across tests.
    vi.resetAllMocks();

    // Re-initialize default mock implementations after reset
    vi.mocked(filesystem.getDocumentsDir).mockResolvedValue('/mock/documents');
    vi.mocked(filesystem.isTauri).mockReturnValue(true);
    vi.mocked(serialization.serializeProject).mockImplementation((project: ProjectFile) => ({
      success: true,
      data: JSON.stringify(project),
    }));
    vi.mocked(serialization.deserializeProject).mockImplementation((json: string) => ({
      success: true,
      data: JSON.parse(json),
    }));
    vi.mocked(serialization.deserializeProjectLenient).mockImplementation((json: string) => ({
      success: true,
      data: JSON.parse(json),
    }));
    vi.mocked(serialization.migrateProject).mockImplementation((project: unknown) => ({
      success: true,
      data: project as ProjectFile,
    }));

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
        expect.stringContaining('550e8400-e29b-41d4-a716-446655440000'),
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
          projectId: '550e8400-e29b-41d4-a716-446655440000',
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

      const result = await adapter.loadProject('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.project).toEqual(expect.objectContaining({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
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

      const result = await adapter.loadProject('550e8400-e29b-41d4-a716-446655440000');

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

      const result = await adapter.loadProject('550e8400-e29b-41d4-a716-446655440000');

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

      const result = await adapter.loadProject('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CORRUPTED_FILE');
    });
  });

  describe('deleteProject()', () => {
    it('should delete entire project directory', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.removeFile).mockResolvedValue();
      // readDir is called internally when cleaning up autosave/metadata subdirs
      vi.mocked(filesystem.readDir).mockResolvedValue([]);

      const result = await adapter.deleteProject('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(filesystem.removeFile).toHaveBeenCalledWith(
        expect.stringContaining('550e8400-e29b-41d4-a716-446655440000')
      );
    });

    it('should be idempotent (no error if already deleted)', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(false);

      const result = await adapter.deleteProject('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(filesystem.removeFile).not.toHaveBeenCalled();
    });

    it('should handle permission denied errors', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([]);
      vi.mocked(filesystem.removeFile).mockRejectedValue(
        new Error('permission denied')
      );

      const result = await adapter.deleteProject('550e8400-e29b-41d4-a716-446655440000');

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

      const result = await adapter.duplicateProject('550e8400-e29b-41d4-a716-446655440000', 'Duplicated Project');

      expect(result.success).toBe(true);
      expect(result.project?.projectName).toBe('Duplicated Project');
      expect(result.project?.projectId).not.toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should preserve all entities and settings', async () => {
      const entityId = '660e8400-e29b-41d4-a716-446655440010';
      const project = createMockProject({
        entities: {
          byId: {
            [entityId]: {
              id: entityId,
              type: 'note',
              props: { content: 'Test note', fontSize: 14, color: '#000000' },
              transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
              zIndex: 0,
              createdAt: '2024-01-01T00:00:00.000Z',
              modifiedAt: '2024-01-01T00:00:00.000Z',
            } as any,
          },
          allIds: [entityId],
        },
      });
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();

      const result = await adapter.duplicateProject('550e8400-e29b-41d4-a716-446655440000', 'Copy');

      expect(result.success).toBe(true);
      expect(result.project?.entities.allIds).toContain(entityId);
    });

    it('should reset timestamps', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();

      const result = await adapter.duplicateProject('550e8400-e29b-41d4-a716-446655440000', 'Copy');

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
      vi.mocked(filesystem.readDir).mockResolvedValue(['550e8400-e29b-41d4-a716-446655440000']);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));

      const projects = await adapter.listProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]!.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should skip corrupted files', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']);
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce(JSON.stringify(createMockProject({ projectId: '550e8400-e29b-41d4-a716-446655440001' })))
        .mockRejectedValueOnce(new Error('Corrupted'));

      const projects = await adapter.listProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]!.projectId).toBe('550e8400-e29b-41d4-a716-446655440001');
    });

    it('should sort by modifiedAt descending', async () => {
      const project1 = createMockProject({ projectId: '550e8400-e29b-41d4-a716-446655440003', modifiedAt: '2024-01-01T00:00:00.000Z' });
      const project2 = createMockProject({ projectId: '550e8400-e29b-41d4-a716-446655440004', modifiedAt: '2024-01-02T00:00:00.000Z' });

      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004']);
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce(JSON.stringify(project1))
        .mockResolvedValueOnce(JSON.stringify(project2));

      const projects = await adapter.listProjects();

      expect(projects[0]!.projectId).toBe('550e8400-e29b-41d4-a716-446655440004'); // Most recent first
      expect(projects[1]!.projectId).toBe('550e8400-e29b-41d4-a716-446655440003');
    });
  });

  describe('searchProjects()', () => {
    beforeEach(() => {
      const project1 = createMockProject({
        projectId: '550e8400-e29b-41d4-a716-446655440003',
        projectName: 'HVAC Design Project',
        projectNumber: 'PRJ-001',
      });
      const project2 = createMockProject({
        projectId: '550e8400-e29b-41d4-a716-446655440004',
        projectName: 'Plumbing Project',
        projectNumber: 'PRJ-002',  // Different project number to avoid PRJ-001 match
        clientName: 'ACME Corp',
      });

      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004']);
      vi.mocked(filesystem.readTextFile)
        .mockResolvedValueOnce(JSON.stringify(project1))
        .mockResolvedValueOnce(JSON.stringify(project2));
    });

    it('should filter by project name (case-insensitive)', async () => {
      const results = await adapter.searchProjects('hvac');

      expect(results).toHaveLength(1);
      expect(results[0]!.projectId).toBe('550e8400-e29b-41d4-a716-446655440003');
    });

    it('should filter by project number', async () => {
      const results = await adapter.searchProjects('PRJ-001');

      expect(results).toHaveLength(1);
      expect(results[0]!.projectId).toBe('550e8400-e29b-41d4-a716-446655440003');
    });

    it('should filter by client name', async () => {
      const results = await adapter.searchProjects('acme');

      expect(results).toHaveLength(1);
      expect(results[0]!.projectId).toBe('550e8400-e29b-41d4-a716-446655440004');
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

      const autoSaves = await adapter.listAutoSaves('550e8400-e29b-41d4-a716-446655440000');

      expect(autoSaves).toEqual([]);
    });

    it('should list all auto-saves sorted by timestamp', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue([
        '2024-01-01T00:00:00.000Z.hvac',
        '2024-01-02T00:00:00.000Z.hvac',
      ]);

      const autoSaves = await adapter.listAutoSaves('550e8400-e29b-41d4-a716-446655440000');

      expect(autoSaves).toHaveLength(2);
      expect(autoSaves[0]!.timestamp).toBe('2024-01-02T00:00:00.000Z'); // Newest first
      expect(autoSaves[1]!.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should include file sizes', async () => {
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readDir).mockResolvedValue(['2024-01-01T00:00:00.000Z.hvac']);

      const autoSaves = await adapter.listAutoSaves('550e8400-e29b-41d4-a716-446655440000');

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
        '550e8400-e29b-41d4-a716-446655440000',
        '2024-01-01T00:00:00.000Z'
      );

      expect(result.success).toBe(true);
      expect(result.project).toEqual(expect.objectContaining({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      }));
    });

    it('should promote to main file', async () => {
      const project = createMockProject();
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.copyFile).mockResolvedValue();

      await adapter.restoreAutoSave('550e8400-e29b-41d4-a716-446655440000', '2024-01-01T00:00:00.000Z');

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

      await adapter.restoreAutoSave('550e8400-e29b-41d4-a716-446655440000', '2024-01-01T00:00:00.000Z');

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

      await adapter.cleanupAutoSaves('550e8400-e29b-41d4-a716-446655440000', 3);

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

      await adapter.cleanupAutoSaves('550e8400-e29b-41d4-a716-446655440000', 2);

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

      await adapter.cleanupAutoSaves('550e8400-e29b-41d4-a716-446655440000', 0);

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

      await adapter.updateMetadata('550e8400-e29b-41d4-a716-446655440000', metadata);

      expect(serialization.serializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: 'Updated Name',
        })
      );
    });

    it('should preserve entities', async () => {
      const entityId = '660e8400-e29b-41d4-a716-446655440010';
      const project = createMockProject({
        entities: {
          byId: {
            [entityId]: {
              id: entityId,
              type: 'note',
              props: { content: 'Test note', fontSize: 14, color: '#000000' },
              transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
              zIndex: 0,
              createdAt: '2024-01-01T00:00:00.000Z',
              modifiedAt: '2024-01-01T00:00:00.000Z',
            } as any,
          },
          allIds: [entityId],
        },
      });
      vi.mocked(filesystem.exists).mockResolvedValue(true);
      vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(project));
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();
      vi.mocked(filesystem.renameFile).mockResolvedValue();

      await adapter.updateMetadata('550e8400-e29b-41d4-a716-446655440000', { projectName: 'Updated' });

      expect(serialization.serializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          entities: expect.objectContaining({
            allIds: [entityId],
          }),
        })
      );
    });
  });

  describe('saveThumbnail()', () => {
    it('should write thumbnail to .metadata/ directory', async () => {
      const imageBlob = { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)) } as unknown as Blob;
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();

      await adapter.saveThumbnail('550e8400-e29b-41d4-a716-446655440000', imageBlob);

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
      const imageBlob = { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(3)) } as unknown as Blob;
      vi.mocked(filesystem.createDir).mockResolvedValue();
      vi.mocked(filesystem.writeTextFile).mockResolvedValue();

      await expect(adapter.saveThumbnail('550e8400-e29b-41d4-a716-446655440000', imageBlob)).resolves.not.toThrow();
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
