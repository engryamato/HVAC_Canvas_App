import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationQueue } from '../../services/OperationQueue';
import { ProjectRepository } from '../ProjectRepository';
import type { StorageAdapter } from '../StorageAdapter';
import * as filesystem from '../filesystem';
import { loadProject as loadProjectFromPath } from '../projectIO';
import { getStorageRootService } from '../../services/StorageRootService';
import { detectCorruption } from '../../services/validation/detectCorruption';
import { quarantineFile } from '../../services/validation/quarantineFile';

vi.mock('../filesystem');
vi.mock('../projectIO', () => ({
  loadProject: vi.fn(),
  saveProject: vi.fn(),
}));
vi.mock('../../services/StorageRootService', () => ({
  getStorageRootService: vi.fn(),
}));
vi.mock('../../services/validation/detectCorruption', () => ({
  detectCorruption: vi.fn(),
}));
vi.mock('../../services/validation/quarantineFile', () => ({
  quarantineFile: vi.fn(),
}));

function createAdapterMock(): StorageAdapter {
  return {
    saveProject: vi.fn(),
    loadProject: vi.fn(async () => ({ success: false, errorCode: 'NOT_FOUND' })),
    listProjects: vi.fn(async () => []),
    deleteProject: vi.fn(async () => ({ success: true })),
    duplicateProject: vi.fn(),
    searchProjects: vi.fn(async () => []),
    autoSave: vi.fn(),
    listAutoSaves: vi.fn(async () => []),
    restoreAutoSave: vi.fn(),
    cleanupAutoSaves: vi.fn(),
    updateMetadata: vi.fn(),
    saveThumbnail: vi.fn(),
    getStorageInfo: vi.fn(),
  } as unknown as StorageAdapter;
}

const validProject = {
  projectId: 'valid-project',
  projectName: 'Valid Project',
  projectNumber: 'P-001',
  clientName: 'Client',
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  version: '1.0.0',
  spaces: [],
  equipment: [],
  zones: [],
  calculations: {},
};

describe('ProjectRepository - Corruption Detection & Quarantine Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(filesystem.isTauri).mockReturnValue(true);
    vi.mocked(getStorageRootService).mockResolvedValue({
      getStorageRoot: () => '/root',
      getQuarantinedFiles: vi.fn(async () => [
        {
          path: '/root/.quarantine/project-a/project_20260210_154900.sws.corrupted',
          reason: 'corrupted_or_unmigrated',
          timestamp: Date.now(),
        },
      ]),
    } as any);
  });

  it('detects corrupted files, quarantines them, and returns CORRUPTED_FILE', async () => {
    vi.mocked(detectCorruption).mockResolvedValue({
      isValid: false,
      error: 'Invalid JSON',
      corruptionType: 'INVALID_JSON',
    });
    vi.mocked(quarantineFile).mockResolvedValue({
      success: true,
      quarantinedPath: '/root/.quarantine/test-corrupted-project/project_20260210_154900.sws.corrupted',
    });

    const repository = new ProjectRepository(createAdapterMock(), new OperationQueue(), {});
    const result = await repository.loadProject('test-corrupted-project');

    expect(detectCorruption).toHaveBeenCalledWith('/root/projects/test-corrupted-project/project.sws');
    expect(quarantineFile).toHaveBeenCalledWith(
      '/root/projects/test-corrupted-project/project.sws',
      '/root',
      'test-corrupted-project'
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('CORRUPTED_FILE');
    expect(result.error).toContain('Invalid JSON');
  });

  it('emits project:quarantined event with details', async () => {
    vi.mocked(detectCorruption).mockResolvedValue({
      isValid: false,
      error: 'Missing required fields',
      corruptionType: 'MISSING_REQUIRED_FIELDS',
    });
    vi.mocked(quarantineFile).mockResolvedValue({
      success: true,
      quarantinedPath: '/root/.quarantine/corrupted-test/project_20260210_154901.sws.corrupted',
    });

    const repository = new ProjectRepository(createAdapterMock(), new OperationQueue(), {});
    const listener = vi.fn();
    repository.addEventListener('project:quarantined', listener as EventListener);

    await repository.loadProject('corrupted-test');

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.projectId).toBe('corrupted-test');
    expect(event.detail.originalPath).toBe('/root/projects/corrupted-test/project.sws');
    expect(event.detail.quarantinedPath).toContain('/root/.quarantine/corrupted-test/');
    expect(event.detail.reason).toContain('Missing required fields');
  });

  it('keeps timestamped quarantine naming format', async () => {
    const quarantinedPath =
      '/root/.quarantine/timestamp-test/project_20260210_154902.sws.corrupted';
    vi.mocked(detectCorruption).mockResolvedValue({
      isValid: false,
      error: 'Invalid JSON',
      corruptionType: 'INVALID_JSON',
    });
    vi.mocked(quarantineFile).mockResolvedValue({
      success: true,
      quarantinedPath,
    });

    const repository = new ProjectRepository(createAdapterMock(), new OperationQueue(), {});
    await repository.loadProject('timestamp-test');

    expect(quarantinedPath).toMatch(/_\d{8}_\d{6}\.sws\.corrupted$/);
  });

  it('returns quarantined files from storage root service', async () => {
    const repository = new ProjectRepository(createAdapterMock(), new OperationQueue(), {});
    const quarantined = await repository.getQuarantinedFiles();

    expect(quarantined).toHaveLength(1);
    expect(quarantined[0]).toHaveProperty('path');
    expect(quarantined[0]).toHaveProperty('reason');
    expect(quarantined[0]).toHaveProperty('timestamp');
  });

  it('loads valid files without quarantine', async () => {
    vi.mocked(detectCorruption).mockResolvedValue({ isValid: true });
    vi.mocked(loadProjectFromPath).mockResolvedValue({
      success: true,
      project: validProject as any,
      migrated: false,
    });

    const repository = new ProjectRepository(createAdapterMock(), new OperationQueue(), {});
    const result = await repository.loadProject('valid-project');

    expect(result.success).toBe(true);
    expect(result.project?.projectId).toBe('valid-project');
    expect(quarantineFile).not.toHaveBeenCalled();
  });

  it('surfaces corruption reason in load error and logs detection', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(detectCorruption).mockResolvedValue({
      isValid: false,
      error: 'projectName must be a non-empty string',
      corruptionType: 'INVALID_SCHEMA',
    });
    vi.mocked(quarantineFile).mockResolvedValue({
      success: false,
      error: 'Failed to quarantine',
    });

    const repository = new ProjectRepository(createAdapterMock(), new OperationQueue(), {});
    const result = await repository.loadProject('detailed-error-test');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('CORRUPTED_FILE');
    expect(result.error).toContain('projectName must be a non-empty string');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
