import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageRootService } from '../StorageRootService';
import type { OperationQueue } from '../OperationQueue';
import type { StorageState } from '../../store/storageStore';
import { runMigration } from '../migration/runMigration';
import { listQuarantinedFiles } from '../validation/quarantineFile';
import {
  createDir,
  exists,
  getAppDataDir,
  getDiskSpace,
  getDocumentsDir,
  readDir,
  removeFile,
  resolveStorageRoot,
  validateStorageRoot,
  writeTextFile,
} from '../../persistence/filesystem';

vi.mock('../migration/runMigration');
vi.mock('../validation/quarantineFile', () => ({
  listQuarantinedFiles: vi.fn(async () => []),
}));
vi.mock('../../persistence/filesystem');
vi.mock('../../../features/dashboard/store/projectListStore', () => ({
  useProjectListStore: {
    getState: () => ({ projects: [] }),
  },
}));

function createMockState(overrides: Partial<StorageState> = {}): StorageState {
  return {
    storageRootPath: null,
    storageRootType: 'documents',
    migrationState: 'pending',
    migrationCompletedAt: null,
    migrationError: null,
    lastValidatedAt: null,
    validationWarnings: [],
    quarantinedFileCount: 0,
    lastQuarantineAt: null,
    diskSpace: {
      availableBytes: 0,
      totalBytes: 0,
      percentAvailable: 100,
    },
    setStorageRoot: vi.fn(),
    setMigrationState: vi.fn(),
    updateValidation: vi.fn(),
    incrementQuarantine: vi.fn(),
    setDiskSpace: vi.fn(),
    ...overrides,
  };
}

describe('StorageRootService', () => {
  let service: StorageRootService;
  let mockQueue: OperationQueue;
  let mockStoreApi: { getState: () => StorageState };
  let mockRelease: ReturnType<typeof vi.fn>;
  let state: StorageState;

  beforeEach(() => {
    mockRelease = vi.fn();
    mockQueue = {
      acquireLock: vi.fn().mockResolvedValue(mockRelease),
    } as unknown as OperationQueue;

    state = createMockState();
    mockStoreApi = {
      getState: vi.fn(() => state),
    };
    service = new StorageRootService(mockQueue, mockStoreApi);

    vi.mocked(getDocumentsDir).mockResolvedValue('/users/test/documents');
    vi.mocked(getAppDataDir).mockResolvedValue('/users/test/appdata');
    vi.mocked(resolveStorageRoot).mockResolvedValue({
      documents_path: '/users/test/documents',
      appdata_path: '/users/test/appdata',
      recommended_path: '/users/test/documents',
    });
    vi.mocked(validateStorageRoot).mockResolvedValue({
      exists: true,
      writable: true,
      available_bytes: 1024 ** 3,
      total_bytes: 10 * 1024 ** 3,
      percent_available: 10,
    });
    vi.mocked(createDir).mockResolvedValue(undefined);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
    vi.mocked(removeFile).mockResolvedValue(undefined);
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readDir).mockResolvedValue([]);
    vi.mocked(getDiskSpace).mockResolvedValue({
      available_bytes: 1024 ** 3,
      total_bytes: 10 * 1024 ** 3,
      percent_available: 10,
    });
    vi.mocked(runMigration).mockResolvedValue({
      success: true,
      migratedCount: 1,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      duration: 100,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('initializes using Documents/SizeWise when writable', async () => {
    const result = await service.initialize();

    expect(result.success).toBe(true);
    expect(result.path).toBe('/users/test/documents/SizeWise');
    expect(state.setStorageRoot).toHaveBeenCalledWith('/users/test/documents/SizeWise', 'documents');
    expect(runMigration).toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalled();
  });

  it('falls back to appdata when documents is not writable', async () => {
    vi.mocked(writeTextFile)
      .mockRejectedValueOnce(new Error('EPERM'))
      .mockResolvedValueOnce(undefined);

    const result = await service.initialize();

    expect(result.success).toBe(true);
    expect(result.path).toBe('/users/test/appdata/SizeWise');
    expect(state.setStorageRoot).toHaveBeenCalledWith('/users/test/appdata/SizeWise', 'appdata');
  });

  it('emits operation:error when initialize fails', async () => {
    vi.mocked(resolveStorageRoot).mockRejectedValueOnce(new Error('resolve failed'));
    const errorSpy = vi.fn();
    service.addEventListener('operation:error', errorSpy);

    const result = await service.initialize();

    expect(result.success).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns failure when no writable location exists', async () => {
    vi.mocked(getDocumentsDir).mockResolvedValue('');
    vi.mocked(getAppDataDir).mockResolvedValue('');
    vi.mocked(resolveStorageRoot).mockResolvedValue({
      documents_path: '',
      appdata_path: '',
      recommended_path: '',
    });

    const result = await service.initialize();

    expect(result.success).toBe(false);
    expect(result.error).toContain('No writable storage location found');
  });

  it('validate returns invalid when storage root is missing', async () => {
    state = createMockState({ storageRootPath: null });

    const result = await service.validate();

    expect(result.is_valid).toBe(false);
    expect(result.errors).toContain('No storage root path configured');
  });

  it('validate recreates missing storage root', async () => {
    state = createMockState({
      storageRootPath: '/users/test/documents/SizeWise',
      storageRootType: 'documents',
    });
    vi.mocked(exists).mockResolvedValueOnce(false).mockResolvedValue(true);
    vi.mocked(validateStorageRoot).mockResolvedValueOnce({
      exists: false,
      writable: true,
      available_bytes: 1024 ** 3,
      total_bytes: 10 * 1024 ** 3,
      percent_available: 10,
    });

    const result = await service.validate();

    expect(result.is_valid).toBe(true);
    expect(createDir).toHaveBeenCalledWith('/users/test/documents/SizeWise', true);
  });

  it('emits low disk warning event', async () => {
    state = createMockState({
      storageRootPath: '/users/test/documents/SizeWise',
      storageRootType: 'documents',
    });
    vi.mocked(getDiskSpace).mockResolvedValue({
      available_bytes: 100,
      total_bytes: 1000,
      percent_available: 2,
    });
    vi.mocked(validateStorageRoot).mockResolvedValueOnce({
      exists: true,
      writable: true,
      available_bytes: 100,
      total_bytes: 1000,
      percent_available: 2,
    });
    const warningSpy = vi.fn();
    service.addEventListener('validation:warning', warningSpy);

    const result = await service.validate();

    expect(result.is_valid).toBe(true);
    expect(warningSpy).toHaveBeenCalled();
    expect(state.setDiskSpace).toHaveBeenCalledWith({
      availableBytes: 100,
      totalBytes: 1000,
      percentAvailable: 2,
    });
    expect(state.updateValidation).toHaveBeenCalled();
  });

  it('emits operation:error when validate has unrecoverable errors', async () => {
    state = createMockState({
      storageRootPath: '/users/test/documents/SizeWise',
      storageRootType: 'appdata',
    });
    vi.mocked(validateStorageRoot).mockResolvedValueOnce({
      exists: true,
      writable: false,
      available_bytes: 10,
      total_bytes: 100,
      percent_available: 10,
    });
    vi.mocked(writeTextFile).mockRejectedValueOnce(new Error('EPERM'));
    const errorSpy = vi.fn();
    service.addEventListener('operation:error', errorSpy);

    const result = await service.validate();

    expect(result.is_valid).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('updates path consistency when documents path changes', async () => {
    state = createMockState({
      storageRootPath: '/users/old/Documents/SizeWise',
      storageRootType: 'documents',
    });
    vi.mocked(getDocumentsDir).mockResolvedValue('/users/new/Documents');

    const changedSpy = vi.fn();
    service.addEventListener('storageRoot:changed', changedSpy);
    await service.validate();

    expect(state.setStorageRoot).toHaveBeenCalledWith('/users/new/Documents/SizeWise', 'documents');
    expect(changedSpy).toHaveBeenCalled();
  });

  it('relocate fails for empty path', async () => {
    state = createMockState({ storageRootPath: '/old/path' });

    const result = await service.relocate('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('New storage root path is required');
  });

  it('relocate no-ops for identical path', async () => {
    state = createMockState({ storageRootPath: '/same/path' });

    const result = await service.relocate('/same/path');

    expect(result.success).toBe(true);
    expect(result.oldPath).toBe('/same/path');
    expect(result.newPath).toBe('/same/path');
  });

  it('relocate infers documents type when target is Documents/SizeWise', async () => {
    state = createMockState({ storageRootPath: '/old/path', storageRootType: 'appdata' });
    vi.mocked(getDocumentsDir).mockResolvedValue('/users/test/documents');

    const result = await service.relocate('/users/test/documents/SizeWise');

    expect(result.success).toBe(true);
    expect(state.setStorageRoot).toHaveBeenCalledWith('/users/test/documents/SizeWise', 'documents');
  });

  it('returns quarantined files from .quarantine directory', async () => {
    state = createMockState({ storageRootPath: '/users/test/documents/SizeWise' });
    vi.mocked(listQuarantinedFiles).mockResolvedValueOnce([
      '/users/test/documents/SizeWise/.quarantine/file1',
      '/users/test/documents/SizeWise/.quarantine/file2',
    ]);

    const files = await service.getQuarantinedFiles();

    expect(files).toHaveLength(2);
    expect(files[0]?.path).toContain('/users/test/documents/SizeWise/.quarantine/file1');
  });
});
