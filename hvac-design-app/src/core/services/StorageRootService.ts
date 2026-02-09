import { invoke } from '@tauri-apps/api/core';
import type { OperationQueue } from './OperationQueue';
import type { StorageState } from '../store/storageStore';
import { runMigration } from './migration/runMigration';
import { createDir, copyFile, exists, readDir, removeFile, renameFile } from '../persistence/filesystem';
import { useProjectListStore } from '../../features/dashboard/store/projectListStore';

interface StorageRootInfo {
    documents_path: string | null;
    app_data_path: string | null;
    recommended_path: string | null;
}

interface ValidationResult {
    is_valid: boolean;
    is_writable: boolean;
    free_space_bytes: number;
    errors: string[];
}

interface InitResult {
    success: boolean;
    path: string;
    migrationRan: boolean;
    error?: string;
}

interface RelocationResult {
    success: boolean;
    oldPath: string;
    newPath: string;
    error?: string;
}

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
            // Get recommended storage path
            const info = await invoke<StorageRootInfo>('resolve_storage_root');
            const recommendedPath = info.recommended_path || info.documents_path || info.app_data_path;

            if (!recommendedPath) {
                throw new Error('No writable storage location found');
            }

            // Validate the path
            const validation = await invoke<ValidationResult>('validate_storage_root', { 
                path: recommendedPath 
            });

            // Create directory if it doesn't exist
            if (!validation.is_valid) {
                await invoke('create_directory', { path: recommendedPath, recursive: true });
            }

            // Persist to store
            this.getStoreState().setStorageRoot(recommendedPath, 'default');

            // Check migration state
            const needsMigration = this.getStoreState().migrationState === 'pending';
            let migrationRan = false;

            if (needsMigration) {
                this.getStoreState().setMigrationState('in-progress');
                
                try {
                    const scanLocations = this.resolveMigrationScanLocations(info, recommendedPath);
                    const existingProjectIds = useProjectListStore
                        .getState()
                        .projects
                        .map((project) => project.projectId);

                    const migrationResult = await runMigration({
                        storageRootPath: recommendedPath,
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

                    if (migrationResult.success) {
                        this.getStoreState().setMigrationState('completed');
                        migrationRan = true;
                    } else {
                        this.getStoreState().setMigrationState('error', migrationResult.errors[0]?.error);
                    }
                } catch (err) {
                    this.getStoreState().setMigrationState('error', err instanceof Error ? err.message : String(err));
                }
            }

            // Emit event
            this.dispatchEvent(new CustomEvent('storageRoot:changed', { 
                detail: { path: recommendedPath } 
            }));

            return {
                success: true,
                path: recommendedPath,
                migrationRan
            };
        } catch (error) {
            return {
                success: false,
                path: '',
                migrationRan: false,
                error: error instanceof Error ? error.message : String(error)
            };
        } finally {
            release();
        }
    }

    async validate(): Promise<ValidationResult> {
        const storageRootPath = this.getStoreState().storageRootPath;
        
        if (!storageRootPath) {
            return {
                is_valid: false,
                is_writable: false,
                free_space_bytes: 0,
                errors: ['No storage root path configured']
            };
        }

        const validation = await invoke<ValidationResult>('validate_storage_root', { 
            path: storageRootPath 
        });

        // Auto-recreate directory if missing
        if (!validation.is_valid && validation.errors.some(e => e.includes('does not exist'))) {
            try {
                await invoke('create_directory', { path: storageRootPath, recursive: true });
                // Re-validate
                return await invoke<ValidationResult>('validate_storage_root', { 
                    path: storageRootPath 
                });
            } catch (err) {
                console.error('Failed to recreate storage directory:', err);
            }
        }

        // Update store with validation results
        this.getStoreState().updateValidation(validation.errors);

        return validation;
    }

    async relocate(newPath: string): Promise<RelocationResult> {
        const release = await this.queue.acquireLock('root');
        const oldPath = this.getStoreState().storageRootPath;

        try {
            if (!newPath || !newPath.trim()) {
                throw new Error('New storage root path is required');
            }

            if (oldPath && this.normalizePath(oldPath) === this.normalizePath(newPath)) {
                return {
                    success: true,
                    oldPath: oldPath || '',
                    newPath,
                };
            }

            // Validate new path
            const validation = await invoke<ValidationResult>('validate_storage_root', { 
                path: newPath 
            });

            if (!validation.is_valid) {
                await invoke('create_directory', { path: newPath, recursive: true });
            }

            if (oldPath) {
                await this.copyRootContents(oldPath, newPath);
            }

            this.getStoreState().setStorageRoot(newPath, 'custom');

            this.dispatchEvent(new CustomEvent('storageRoot:changed', { 
                detail: { path: newPath, oldPath } 
            }));

            return {
                success: true,
                oldPath: oldPath || '',
                newPath
            };
        } catch (error) {
            return {
                success: false,
                oldPath: oldPath || '',
                newPath,
                error: error instanceof Error ? error.message : String(error)
            };
        } finally {
            release();
        }
    }

    getStorageRoot(): string | null {
        return this.getStoreState().storageRootPath;
    }

    async getQuarantinedFiles(): Promise<any[]> {
        // TODO: Implement quarantine file listing
        return [];
    }

    private getStoreState(): StorageState {
        return this.storeApi.getState();
    }

    private resolveMigrationScanLocations(info: StorageRootInfo, storageRootPath: string): string[] {
        const locations = new Set<string>();

        const candidates = [
            info.documents_path,
            info.app_data_path,
            storageRootPath,
            info.documents_path ? `${info.documents_path}/HVAC_Projects` : null,
            info.documents_path ? `${info.documents_path}/SizeWise` : null,
            info.documents_path ? `${info.documents_path}/SizeWise/Projects` : null,
            info.app_data_path ? `${info.app_data_path}/SizeWise` : null,
            info.app_data_path ? `${info.app_data_path}/SizeWise/Projects` : null,
        ];

        for (const candidate of candidates) {
            if (!candidate) {
                continue;
            }
            const normalized = this.normalizePath(candidate);
            if (normalized.length > 0) {
                locations.add(normalized);
            }
        }

        return Array.from(locations);
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
        return output;
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

                const targetProjectFile = this.toNormalizedPath(targetProjectDir, 'project.sws');
                const targetBackupFile = this.toNormalizedPath(targetProjectDir, 'project.sws.bak');
                const targetThumbnailFile = this.toNormalizedPath(targetProjectDir, 'thumbnail.png');

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

// Factory and global cache
let serviceInstance: StorageRootService | null = null;

export function createStorageRootService(
    queue: OperationQueue,
    storeApi: { getState: () => StorageState }
): StorageRootService {
    return new StorageRootService(queue, storeApi);
}

export async function getStorageRootService(): Promise<StorageRootService> {
    if (!serviceInstance) {
        const { OperationQueue } = await import('./OperationQueue');
        const { useStorageStore } = await import('../store/storageStore');
        const queue = new OperationQueue();
        serviceInstance = createStorageRootService(queue, useStorageStore);
    }
    return serviceInstance;
}
