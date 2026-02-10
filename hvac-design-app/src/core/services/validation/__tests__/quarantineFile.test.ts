import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listQuarantinedFiles, quarantineFile } from '../quarantineFile';
import * as filesystem from '../../../persistence/filesystem';

vi.mock('../../../persistence/filesystem', () => ({
  createDir: vi.fn(),
  exists: vi.fn(),
  readDir: vi.fn(),
  renameFile: vi.fn(),
}));

describe('quarantineFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesystem.exists).mockResolvedValue(true);
    vi.mocked(filesystem.createDir).mockResolvedValue(undefined);
    vi.mocked(filesystem.renameFile).mockResolvedValue(undefined);
  });

  it('creates quarantine directory and moves file', async () => {
    const sourcePath = '/storage/projects/test/project.sws';
    const result = await quarantineFile(sourcePath, '/storage', 'test');

    expect(result.success).toBe(true);
    expect(filesystem.createDir).toHaveBeenCalledWith('/storage/.quarantine/test', true);
    expect(filesystem.renameFile).toHaveBeenCalledWith(
      sourcePath,
      expect.stringMatching(/\/storage\/.quarantine\/test\/project_\d{8}_\d{6}\.sws\.corrupted$/)
    );
  });

  it('preserves original file name in quarantined path', async () => {
    const result = await quarantineFile('/storage/projects/test/my-hvac-design.sws', '/storage', 'test');

    expect(result.success).toBe(true);
    expect(result.quarantinedPath).toContain('my-hvac-design');
  });

  it('returns an error when source file is missing', async () => {
    vi.mocked(filesystem.exists).mockResolvedValue(false);

    const result = await quarantineFile('/storage/projects/test/missing.sws', '/storage', 'test');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Source file does not exist');
  });

  it('returns an error when rename fails', async () => {
    vi.mocked(filesystem.renameFile).mockRejectedValue(new Error('Permission denied'));

    const result = await quarantineFile('/storage/projects/test/file.sws', '/storage', 'test');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Permission denied');
  });
});

describe('listQuarantinedFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesystem.readDir).mockReset();
  });

  it('returns empty list when quarantine root does not exist', async () => {
    vi.mocked(filesystem.exists).mockResolvedValue(false);

    const files = await listQuarantinedFiles('/storage');

    expect(files).toEqual([]);
  });

  it('lists quarantined files across project subfolders', async () => {
    vi.mocked(filesystem.exists).mockImplementation(async (path: string) => {
      return (
        path === '/storage/.quarantine' ||
        path === '/storage/.quarantine/project1' ||
        path === '/storage/.quarantine/project2'
      );
    });
    vi.mocked(filesystem.readDir)
      .mockResolvedValueOnce(['project1', 'project2'])
      .mockResolvedValueOnce(['file1_20250210_120000.sws.corrupted'])
      .mockResolvedValueOnce(['file2_20250210_130000.sws.corrupted']);

    const files = await listQuarantinedFiles('/storage');

    expect(files).toEqual([
      '/storage/.quarantine/project1/file1_20250210_120000.sws.corrupted',
      '/storage/.quarantine/project2/file2_20250210_130000.sws.corrupted',
    ]);
  });

  it('normalizes windows roots to forward slashes', async () => {
    vi.mocked(filesystem.exists).mockImplementation(async (path: string) => {
      return path === 'C:/Users/Test/storage/.quarantine' || path === 'C:/Users/Test/storage/.quarantine/project1';
    });
    vi.mocked(filesystem.readDir).mockResolvedValueOnce(['project1']).mockResolvedValueOnce(['file.sws.corrupted']);

    const files = await listQuarantinedFiles('C:\\Users\\Test\\storage\\');

    expect(files).toEqual(['C:/Users/Test/storage/.quarantine/project1/file.sws.corrupted']);
  });

  it('returns empty list on filesystem errors', async () => {
    vi.mocked(filesystem.exists).mockResolvedValue(true);
    vi.mocked(filesystem.readDir).mockRejectedValue(new Error('Permission denied'));

    const files = await listQuarantinedFiles('/storage');

    expect(files).toEqual([]);
  });
});
