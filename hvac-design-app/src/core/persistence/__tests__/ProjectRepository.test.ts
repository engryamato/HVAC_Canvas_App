import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationQueue } from '../../services/OperationQueue';
import { ProjectRepository } from '../ProjectRepository';
import type { StorageAdapter } from '../StorageAdapter';
import * as filesystem from '../filesystem';

vi.mock('../filesystem');
vi.mock('../../services/StorageRootService', () => ({
  getStorageRootService: vi.fn(async () => ({
    getStorageRoot: () => '/root',
  })),
}));

function createAdapterMock(): StorageAdapter {
  return {
    saveProject: vi.fn(),
    loadProject: vi.fn(),
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

describe('ProjectRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(filesystem.isTauri).mockReturnValue(true);
    vi.mocked(filesystem.exists).mockImplementation(async () => true);
    vi.mocked(filesystem.createDir).mockResolvedValue(undefined);
    vi.mocked(filesystem.renameFile).mockResolvedValue(undefined);
    vi.mocked(filesystem.removeFile).mockResolvedValue(undefined);
    vi.mocked(filesystem.removePath).mockResolvedValue(undefined);
  });

  it('archives canonical tauri project storage and prunes project index', async () => {
    localStorage.setItem(
      'sws.projectIndex',
      JSON.stringify({
        state: {
          projects: [{ projectId: 'proj-1', storagePath: '/root/projects/proj-1/project.sws' }],
          recentProjectIds: ['proj-1', 'other'],
        },
      })
    );

    const repository = new ProjectRepository(createAdapterMock(), new OperationQueue(), {});
    const result = await repository.deleteProject('proj-1');

    expect(result.success).toBe(true);
    expect(filesystem.createDir).toHaveBeenCalledWith('/root/deleted-projects', true);
    expect(filesystem.renameFile).toHaveBeenCalledWith(
      '/root/projects/proj-1',
      expect.stringMatching(/^\/root\/deleted-projects\/\d{8}T\d{6}-proj-1$/)
    );
    expect(filesystem.removeFile).not.toHaveBeenCalled();
    expect(filesystem.removePath).not.toHaveBeenCalled();

    const parsed = JSON.parse(localStorage.getItem('sws.projectIndex') ?? '{}');
    expect(parsed.state.projects).toEqual([]);
    expect(parsed.state.recentProjectIds).toEqual(['other']);
  });
});
