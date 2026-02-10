import type { OperationQueue } from './OperationQueue';
import { getSharedOperationQueue } from './OperationQueue';
import type { StorageState } from '../store/storageStore';
import type { InitResult, ValidationResult, RelocationResult, QuarantinedFile } from './types';
import { runMigration } from './migration/runMigration';
import {
  createDir,
  copyFile,
  exists,
  getAppDataDir,
  getDiskSpace,
  getDocumentsDir,
  readDir,
  removeFile,
  renameFile,
  resolveStorageRoot,
  validateStorageRoot,
  writeTextFile,
} from '../persistence/filesystem';
import { useProjectListStore } from '../../features/dashboard/store/projectListStore';

const LOW_DISK_THRESHOLD_PERCENT = 5;

export class StorageRootService extends EventTarget {
  private queue: OperationQueue;
  private storeApi: { getState: () => StorageState };

  constructor(queue: OperationQueue, storeApi: { getState: () => StorageState }) {
    super();
    this.queue = queue;
    this.storeApi = storeApi;
  }

  async initialize(): Promise<InitResult> {
    const release = await this.queue.acquireLock('root');

    try {
      const state = this.getStoreState();
      const existingPath = state.storageRootPath;

      if (existingPath) {
        const migrationRan = await this.runStartupMigration(existingPath);
        return { success: true, path: existingPath, migrationRan };
      }

      const rootInfo = await resolveStorageRoot();
      const docsRoot = rootInfo.documents_path
        ? this.toNormalizedPath(rootInfo.documents_path, 'SizeWise')
        : '';

      if (docsRoot) {
        try {
          await this.ensureCanonicalDirectories(docsRoot);
          await this.assertWritable(docsRoot);
          this.getStoreState().setStorageRoot(docsRoot, 'documents');
          this.dispatchStorageRootChanged(docsRoot);
          const migrationRan = await this.runStartupMigration(docsRoot);
          return { success: true, path: docsRoot, migrationRan };
        } catch {
          // Fall through to appdata fallback.
        }
      }

      return this.initializeAppDataFallback();
    } catch (error) {
      this.dispatchOperationError('initialize', error);
      return {
        success: false,
        path: '',
        migrationRan: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      release();
    }
  }

  async validate(): Promise<ValidationResult> {
    const state = this.getStoreState();
    let storageRootPath = state.storageRootPath;
    const warnings: string[] = [];
    const errors: string[] = [];
    let freeSpaceBytes = 0;
    let writable = true;

    if (!storageRootPath) {
      return {
        is_valid: false,
        is_writable: false,
        free_space_bytes: 0,
        errors: ['No storage root path configured'],
      };
    }

    storageRootPath = this.normalizePath(storageRootPath);

    const backendValidation = await validateStorageRoot(storageRootPath).catch(() => null);

    if (!(backendValidation?.exists ?? (await exists(storageRootPath)))) {
      try {
        await this.ensureCanonicalDirectories(storageRootPath);
        warnings.push(`Storage root recreated: ${storageRootPath}`);
      } catch (error) {
        errors.push(`Failed to recreate storage root: ${this.toErrorMessage(error)}`);
      }
    }

    if (state.storageRootType === 'documents') {
      const docsDir = await getDocumentsDir();
      if (docsDir) {
        const expectedPath = this.toNormalizedPath(docsDir, 'SizeWise');
        if (this.normalizePath(storageRootPath) !== this.normalizePath(expectedPath)) {
          try {
            const previousPath = storageRootPath;
            await this.ensureCanonicalDirectories(expectedPath);
            state.setStorageRoot(expectedPath, 'documents');
            storageRootPath = expectedPath;
            this.dispatchStorageRootChanged(expectedPath, previousPath);
            warnings.push('Storage path updated to current Documents directory');
          } catch (error) {
            errors.push(`Failed to update storage path consistency: ${this.toErrorMessage(error)}`);
          }
        }
      }
    }

    if (backendValidation && !backendValidation.writable) {
      writable = false;
    }

    try {
      if (!backendValidation?.writable) {
        await this.assertWritable(storageRootPath);
      }
    } catch (error) {
      writable = false;
      if (state.storageRootType === 'documents') {
        const fallback = await this.initializeAppDataFallback(storageRootPath);
        if (!fallback.success) {
          errors.push(fallback.error || 'No writable storage location available');
        } else {
          warnings.push('Primary storage unavailable, using app data directory fallback');
          storageRootPath = fallback.path;
          writable = true;
        }
      } else {
        errors.push(`Storage root is not writable: ${this.toErrorMessage(error)}`);
      }
    }

    try {
      const disk = backendValidation
        ? {
            available_bytes: backendValidation.available_bytes,
            total_bytes: backendValidation.total_bytes,
            percent_available: backendValidation.percent_available,
          }
        : await getDiskSpace(storageRootPath);
      freeSpaceBytes = disk.available_bytes;
      state.setDiskSpace({
        availableBytes: disk.available_bytes,
        totalBytes: disk.total_bytes,
        percentAvailable: disk.percent_available,
      });
      if (disk.percent_available < LOW_DISK_THRESHOLD_PERCENT) {
        const warning = `Low disk space: ${disk.percent_available.toFixed(1)}% available`;
        warnings.push(warning);
        this.dispatchEvent(
          new CustomEvent('validation:warning', {
            detail: {
              type: 'low_disk_space',
              available: (disk.available_bytes / 1024 ** 3).toFixed(2),
              path: storageRootPath,
            },
          })
        );
      }
    } catch (error) {
      warnings.push(`Disk space check unavailable: ${this.toErrorMessage(error)}`);
    }

    state.updateValidation(Date.now(), warnings);

    if (errors.length > 0) {
      this.dispatchOperationError('validate', errors.join('; '));
      this.dispatchEvent(
        new CustomEvent('validation:error', {
          detail: { errors, path: storageRootPath },
        })
      );
    }

    return {
      is_valid: errors.length === 0,
      is_writable: writable,
      free_space_bytes: freeSpaceBytes,
      errors: [...errors, ...warnings.filter((warning) => warning.toLowerCase().includes('failed'))],
    };
  }

  async relocate(newPath: string): Promise<RelocationResult> {
    const release = await this.queue.acquireLock('root');
    const currentState = this.getStoreState();
    const oldPath = currentState.storageRootPath;

    try {
      if (!newPath || !newPath.trim()) {
        throw new Error('New storage root path is required');
      }

      const normalizedNewPath = this.normalizePath(newPath);
      if (oldPath && this.normalizePath(oldPath) === normalizedNewPath) {
        return {
          success: true,
          oldPath: oldPath || '',
          newPath: normalizedNewPath,
        };
      }

      await this.ensureCanonicalDirectories(normalizedNewPath);
      await this.assertWritable(normalizedNewPath);

      if (oldPath) {
        await this.copyRootContents(oldPath, normalizedNewPath);
      }

      const docsDir = await getDocumentsDir();
      const documentsRoot = docsDir ? this.toNormalizedPath(docsDir, 'SizeWise') : '';
      const nextType =
        documentsRoot && this.normalizePath(documentsRoot) === normalizedNewPath ? 'documents' : 'appdata';
      this.getStoreState().setStorageRoot(normalizedNewPath, nextType);
      this.dispatchStorageRootChanged(normalizedNewPath, oldPath || undefined);

      return {
        success: true,
        oldPath: oldPath || '',
        newPath: normalizedNewPath,
      };
    } catch (error) {
      this.dispatchOperationError('relocate', error);
      return {
        success: false,
        oldPath: oldPath || '',
        newPath,
        error: this.toErrorMessage(error),
      };
    } finally {
      release();
    }
  }

  getStorageRoot(): string | null {
    return this.getStoreState().storageRootPath;
  }

  async getQuarantinedFiles(): Promise<QuarantinedFile[]> {
    const storageRoot = this.getStoreState().storageRootPath;
    if (!storageRoot) {
      return [];
    }

    // Use the quarantineFile module to list files
    const { listQuarantinedFiles } = await import('./validation/quarantineFile');
    const quarantinedPaths = await listQuarantinedFiles(storageRoot);

    // Convert paths to QuarantinedFile format
    return quarantinedPaths.map((path) => ({
      path,
      reason: 'corrupted_or_unmigrated',
      timestamp: Date.now(),
    }));
  }

  private getStoreState(): StorageState {
    return this.storeApi.getState();
  }

  private dispatchStorageRootChanged(path: string, oldPath?: string): void {
    this.dispatchEvent(
      new CustomEvent('storageRoot:changed', {
        detail: { path, oldPath },
      })
    );
  }

  private dispatchOperationError(operation: string, error: unknown): void {
    this.dispatchEvent(
      new CustomEvent('operation:error', {
        detail: {
          operation,
          error: this.toErrorMessage(error),
        },
      })
    );
  }

  private async runStartupMigration(storageRootPath: string): Promise<boolean> {
    const state = this.getStoreState();
    if (state.migrationState !== 'pending') {
      return false;
    }

    state.setMigrationState('running');
    try {
      const scanLocations = await this.resolveMigrationScanLocations(storageRootPath);
      const existingProjectIds = useProjectListStore
        .getState()
        .projects
        .map((project) => project.projectId);

      const migrationResult = await runMigration({
        storageRootPath,
        scanLocations,
        dryRun: false,
        existingProjectIds,
        indexStorageKey: 'sws.projectIndex',
        onProgress: (progress) => {
          this.dispatchEvent(
            new CustomEvent('migration:state', {
              detail: progress,
            })
          );
        },
      });

      if (migrationResult.success || migrationResult.migratedCount > 0) {
        state.setMigrationState('completed');
      } else {
        state.setMigrationState('failed', migrationResult.errors[0]?.error || 'Migration failed');
      }

      return migrationResult.migratedCount > 0;
    } catch (error) {
      state.setMigrationState('failed', this.toErrorMessage(error));
      this.dispatchOperationError('migration', error);
      return false;
    }
  }

  private async resolveMigrationScanLocations(storageRootPath: string): Promise<string[]> {
    const docsDir = await getDocumentsDir();
    const appDataDir = await getAppDataDir();
    const candidates = [
      docsDir ? this.toNormalizedPath(docsDir, 'SizeWise', 'Projects') : '',
      docsDir ? this.toNormalizedPath(docsDir, 'HVAC_Projects') : '',
      storageRootPath ? this.toNormalizedPath(storageRootPath, 'Projects') : '',
      storageRootPath ? this.toNormalizedPath(storageRootPath, 'projects') : '',
      appDataDir ? this.toNormalizedPath(appDataDir, 'SizeWise', 'Projects') : '',
    ];

    const unique = new Set<string>();
    for (const candidate of candidates) {
      if (candidate) {
        unique.add(this.normalizePath(candidate));
      }
    }
    return Array.from(unique);
  }

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+$/, '');
  }

  private toNormalizedPath(...parts: string[]): string {
    if (parts.length === 0) {
      return '';
    }
    const [first, ...rest] = parts;
    let output = (first || '').replace(/[\\/]+$/, '');
    for (const part of rest) {
      output = `${output}/${part.replace(/^[\\/]+/, '')}`;
    }
    return this.normalizePath(output);
  }

  private async ensureCanonicalDirectories(rootPath: string): Promise<void> {
    await createDir(rootPath, true);
    await createDir(this.toNormalizedPath(rootPath, 'projects'), true);
    await createDir(this.toNormalizedPath(rootPath, '.quarantine'), true);
    await createDir(this.toNormalizedPath(rootPath, '.logs'), true);
  }

  private async assertWritable(path: string): Promise<void> {
    const testFile = this.toNormalizedPath(path, `.write-test-${Date.now()}`);
    await writeTextFile(testFile, 'ok');
    await removeFile(testFile);
  }

  private async initializeAppDataFallback(oldPath?: string): Promise<InitResult> {
    const appDataDir = await getAppDataDir();
    if (!appDataDir) {
      return {
        success: false,
        path: '',
        migrationRan: false,
        error: 'No writable storage location found',
      };
    }

    const fallbackPath = this.toNormalizedPath(appDataDir, 'SizeWise');
    try {
      await this.ensureCanonicalDirectories(fallbackPath);
      await this.assertWritable(fallbackPath);
      this.getStoreState().setStorageRoot(fallbackPath, 'appdata');
      this.dispatchStorageRootChanged(fallbackPath, oldPath);
      return {
        success: true,
        path: fallbackPath,
        migrationRan: false,
      };
    } catch (error) {
      return {
        success: false,
        path: '',
        migrationRan: false,
        error: this.toErrorMessage(error) || 'No writable storage location available',
      };
    }
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private async copyFileAtomic(sourcePath: string, destinationPath: string): Promise<void> {
    const destinationDir = destinationPath.substring(0, destinationPath.lastIndexOf('/'));
    if (destinationDir) {
      await createDir(destinationDir, true);
    }
    const tempPath = `${destinationPath}.tmp-${Date.now()}`;
    await copyFile(sourcePath, tempPath);
    await renameFile(tempPath, destinationPath);
  }

  private async copyRootContents(oldRootPath: string, newRootPath: string): Promise<void> {
    const normalizedOldRoot = this.normalizePath(oldRootPath);
    const normalizedNewRoot = this.normalizePath(newRootPath);

    if (normalizedOldRoot === normalizedNewRoot) {
      return;
    }

    await createDir(normalizedNewRoot, true);

    const projectRoot = this.toNormalizedPath(normalizedOldRoot, 'projects');
    if (!(await exists(projectRoot))) {
      return;
    }

    const projectFolders = await readDir(projectRoot);
    const copiedPaths: string[] = [];

    try {
      for (const folder of projectFolders) {
        const sourceProjectDir = this.toNormalizedPath(projectRoot, folder);
        const targetProjectDir = this.toNormalizedPath(normalizedNewRoot, 'projects', folder);
        await createDir(targetProjectDir, true);

        const sourceProjectFile = this.toNormalizedPath(sourceProjectDir, 'project.sws');
        const sourceBackupFile = this.toNormalizedPath(sourceProjectDir, 'project.sws.bak');
        const sourceThumbnailFile = this.toNormalizedPath(sourceProjectDir, 'thumbnail.png');
        const sourceMetaFile = this.toNormalizedPath(sourceProjectDir, 'meta.json');

        const targetProjectFile = this.toNormalizedPath(targetProjectDir, 'project.sws');
        const targetBackupFile = this.toNormalizedPath(targetProjectDir, 'project.sws.bak');
        const targetThumbnailFile = this.toNormalizedPath(targetProjectDir, 'thumbnail.png');
        const targetMetaFile = this.toNormalizedPath(targetProjectDir, 'meta.json');

        if (await exists(sourceProjectFile)) {
          await this.copyFileAtomic(sourceProjectFile, targetProjectFile);
          copiedPaths.push(targetProjectFile);
        }

        if (await exists(sourceBackupFile)) {
          await this.copyFileAtomic(sourceBackupFile, targetBackupFile);
          copiedPaths.push(targetBackupFile);
        }

        if (await exists(sourceThumbnailFile)) {
          await this.copyFileAtomic(sourceThumbnailFile, targetThumbnailFile);
          copiedPaths.push(targetThumbnailFile);
        }

        if (await exists(sourceMetaFile)) {
          await this.copyFileAtomic(sourceMetaFile, targetMetaFile);
          copiedPaths.push(targetMetaFile);
        }

        this.dispatchEvent(
          new CustomEvent('operation:progress', {
            detail: {
              stage: 'relocating',
              currentProject: folder,
            },
          })
        );
      }
    } catch (error) {
      for (const copiedPath of copiedPaths) {
        if (await exists(copiedPath)) {
          await removeFile(copiedPath);
        }
      }
      throw error;
    }
  }
}

let serviceInstance: StorageRootService | null = null;

export function createStorageRootService(
  queue: OperationQueue,
  storeApi: { getState: () => StorageState }
): StorageRootService {
  return new StorageRootService(queue, storeApi);
}

export async function getStorageRootService(): Promise<StorageRootService> {
  if (!serviceInstance) {
    const { useStorageStore } = await import('../store/storageStore');
    const queue = getSharedOperationQueue();
    serviceInstance = createStorageRootService(queue, useStorageStore);
  }
  return serviceInstance;
}
