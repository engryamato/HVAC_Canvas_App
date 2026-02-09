import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runMigration } from '../runMigration';
import { generateMetaJson, generateSlug } from '../utils';
import * as filesystem from '../../../persistence/filesystem';
import * as projectIO from '../../../persistence/projectIO';

vi.mock('../../../persistence/filesystem');
vi.mock('../../../persistence/projectIO');

describe('runMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(filesystem.exists).mockImplementation(async (path: string) => {
      const normalized = path.replace(/\\/g, '/');
      if (normalized.includes('/root/projects/')) {
        return false;
      }
      if (normalized.endsWith('/legacy')) {
        return true;
      }
      if (normalized.endsWith('/legacy/proj-1')) {
        return true;
      }
      if (normalized.endsWith('/legacy/proj-1/proj-1.hvac')) {
        return true;
      }
      return false;
    });
    vi.mocked(filesystem.readDir).mockImplementation(async (path: string) => {
      if (path.endsWith('/legacy')) {
        return ['proj-1'];
      }
      if (path.endsWith('/legacy/proj-1')) {
        return ['proj-1.hvac'];
      }
      return [];
    });
    vi.mocked(filesystem.getDiskSpace).mockResolvedValue({
      available_bytes: 500 * 1024 * 1024,
      total_bytes: 1024 * 1024 * 1024,
      percent_available: 50,
    });
    vi.mocked(filesystem.createDir).mockResolvedValue(undefined);
    vi.mocked(filesystem.copyFile).mockResolvedValue(undefined);
    vi.mocked(filesystem.renameFile).mockResolvedValue(undefined);
    vi.mocked(filesystem.removeFile).mockResolvedValue(undefined);
    vi.mocked(filesystem.writeTextFile).mockResolvedValue(undefined);
    vi.mocked(projectIO.loadProject).mockResolvedValue({
      success: true,
      project: {
        projectId: 'proj-1',
        projectName: 'Office Building',
        projectNumber: 'P-001',
        clientName: 'Client',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        version: '1.0.0',
        entities: [],
      } as any,
    });
  });

  it('migrates project and writes meta.json', async () => {
    const result = await runMigration({
      storageRootPath: '/root',
      scanLocations: ['/legacy'],
    });

    expect(result.migratedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(filesystem.writeTextFile).toHaveBeenCalledWith(
      '/root/projects/proj-1/meta.json',
      expect.stringContaining('"projectId": "proj-1"')
    );
  });

  it('skips migration when disk space is insufficient', async () => {
    vi.mocked(filesystem.getDiskSpace).mockResolvedValue({
      available_bytes: 10,
      total_bytes: 1000,
      percent_available: 1,
    });

    const result = await runMigration({
      storageRootPath: '/root',
      scanLocations: ['/legacy'],
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.stage).toBe('disk');
  });

  it('supports dry run', async () => {
    const result = await runMigration({
      storageRootPath: '/root',
      scanLocations: ['/legacy'],
      dryRun: true,
    });

    expect(result.migratedCount).toBe(1);
    expect(filesystem.copyFile).not.toHaveBeenCalled();
    expect(filesystem.writeTextFile).not.toHaveBeenCalled();
  });

  it('records copy errors and continues', async () => {
    vi.mocked(filesystem.copyFile).mockRejectedValue(new Error('copy failed'));

    const result = await runMigration({
      storageRootPath: '/root',
      scanLocations: ['/legacy'],
    });

    expect(result.failedCount).toBe(1);
    expect(result.errors[0]?.stage).toBe('copy');
  });
});

describe('migration utils', () => {
  it('generates slug from special chars', () => {
    expect(generateSlug('Office Building #1 (Main)')).toBe('office-building-1-main');
  });

  it('generates meta json', () => {
    const meta = generateMetaJson({
      projectId: 'id-1',
      projectName: 'My Project',
      createdAt: '2025-01-01T00:00:00.000Z',
      modifiedAt: '2025-01-01T00:00:00.000Z',
      version: '1.0.0',
      entities: [],
    } as any);
    expect(meta.projectId).toBe('id-1');
    expect(meta.slug).toBe('my-project');
    expect(meta.storageVersion).toBe(1);
  });
});
