import type { ProjectFile, ProjectMetadata, SaveResult, LoadResult, DeleteResult, SaveOptions } from './types';
import type { OperationQueue } from '../services/OperationQueue';
import { getSharedOperationQueue } from '../services/OperationQueue';
import type { StorageAdapter } from './StorageAdapter';
import { getStorageRootService } from '../services/StorageRootService';
import type { QuarantinedFile } from '../services/types';
import { loadProject as loadProjectFromPath, saveProject as saveProjectToPath } from './projectIO';
import { createDir, copyFile, exists, readTextFile, renameFile, removeFile, removePath } from './filesystem';
import { isTauri } from './filesystem';

export interface ImportResult extends SaveResult {
    projectId: string;
}

export interface ExportResult {
    success: boolean;
    sourcePath: string;
    destPath: string;
    error?: string | undefined;
}

export interface RelocationResult {
    success: boolean;
    oldPath: string;
    newPath: string;
    error?: string;
}

export class ProjectRepository extends EventTarget {
    private adapter: StorageAdapter;
    private queue: OperationQueue;

    constructor(adapter: StorageAdapter, queue: OperationQueue, _store: any) {
        super();
        this.adapter = adapter;
        this.queue = queue;
    }

    async saveProject(project: ProjectFile, options?: SaveOptions): Promise<SaveResult> {
        const release = await this.queue.acquireLock(`project:${project.projectId}`);
        
        try {
            const rootService = await getStorageRootService();
            const rootPath = rootService.getStorageRoot();
            
            if (!rootPath) {
                return {
                    success: false,
                    errorCode: 'WRITE_ERROR',
                    error: 'No storage root configured'
                };
            }

            const canonical = this.getCanonicalProjectPaths(rootPath, project.projectId);
            const result = isTauri()
                ? await this.saveProjectToCanonicalPath(project, canonical.projectFilePath)
                : await this.adapter.saveProject(project, options);

            if (result.success) {
                this.upsertProjectIndex({
                    projectId: project.projectId,
                    projectName: project.projectName,
                    projectNumber: project.projectNumber,
                    clientName: project.clientName,
                    createdAt: project.createdAt,
                    modifiedAt: project.modifiedAt,
                    isArchived: project.isArchived,
                    filePath: canonical.projectFilePath,
                });

                this.dispatchEvent(new CustomEvent('project:changed', { 
                    detail: { projectId: project.projectId, action: 'save' } 
                }));
            }

            return result;
        } finally {
            release();
        }
    }

    async loadProject(projectId: string): Promise<LoadResult> {
        const rootService = await getStorageRootService();
        const rootPath = rootService.getStorageRoot();
        
        if (!rootPath) {
            return {
                success: false,
                errorCode: 'READ_ERROR',
                error: 'No storage root configured'
            };
        }

        if (isTauri()) {
            const canonical = this.getCanonicalProjectPaths(rootPath, projectId);
            
            // PSR-07: Corruption detection before loading
            const { detectCorruption } = await import('../services/validation/detectCorruption');
            const corruptionReport = await detectCorruption(canonical.projectFilePath);
            
            if (!corruptionReport.isValid) {
                console.error('[ProjectRepository] Corrupted file detected:', corruptionReport.error);
                
                // Quarantine the corrupted file
                const { quarantineFile } = await import('../services/validation/quarantineFile');
                const quarantineResult = await quarantineFile(
                    canonical.projectFilePath,
                    rootPath,
                    projectId
                );
                
                if (quarantineResult.success) {
                    console.log('[ProjectRepository] File quarantined:', quarantineResult.quarantinedPath);
                    
                    // Emit quarantine event
                    this.dispatchEvent(new CustomEvent('project:quarantined', {
                        detail: { 
                            projectId, 
                            originalPath: canonical.projectFilePath,
                            quarantinedPath: quarantineResult.quarantinedPath,
                            reason: corruptionReport.error
                        }
                    }));
                } else {
                    console.error('[ProjectRepository] Failed to quarantine file:', quarantineResult.error);
                }
                
                return {
                    success: false,
                    errorCode: 'CORRUPTED_FILE',
                    error: `Project file is corrupted and has been quarantined: ${corruptionReport.error}`,
                };
            }
            
            // Load project normally if not corrupted
            const loadResult = await loadProjectFromPath(canonical.projectFilePath);

            if (loadResult.success && loadResult.project) {
                return {
                    success: true,
                    project: loadResult.project,
                    source: 'file',
                    migrated: Boolean(loadResult.migrated),
                };
            }

            return {
                success: false,
                errorCode: 'READ_ERROR',
                error: loadResult.error || 'Failed to load project from canonical storage path',
            };
        }

        return await this.adapter.loadProject(projectId);
    }


    async deleteProject(projectId: string): Promise<DeleteResult> {
        const release = await this.queue.acquireLock(`project:${projectId}`);
        
        try {
            let result: DeleteResult;
            if (isTauri()) {
                const rootService = await getStorageRootService();
                const rootPath = rootService.getStorageRoot();
                if (!rootPath) {
                    return {
                        success: false,
                        errorCode: 'DELETE_ERROR',
                        error: 'No storage root configured',
                    };
                }

                const canonical = this.getCanonicalProjectPaths(rootPath, projectId);
                try {
                    const projectFile = canonical.projectFilePath;
                    const backupFile = `${canonical.projectFilePath}.bak`;
                    const thumbnailFile = this.joinPath(canonical.projectDir, 'thumbnail.png');
                    const metadataFile = this.joinPath(canonical.projectDir, 'meta.json');
                    const autosaveDir = this.joinPath(canonical.projectDir, '.autosave');

                    const filesToDelete = [projectFile, backupFile, thumbnailFile, metadataFile];
                    for (const filePath of filesToDelete) {
                        if (await exists(filePath)) {
                            await removeFile(filePath);
                        }
                    }

                    if (await exists(autosaveDir)) {
                        await removePath(autosaveDir, true);
                    }

                    if (await exists(canonical.projectDir)) {
                        await removePath(canonical.projectDir, true);
                    }

                    result = { success: true };
                } catch (error) {
                    result = {
                        success: false,
                        errorCode: 'DELETE_ERROR',
                        error: error instanceof Error ? error.message : 'Failed to delete project',
                    };
                }
            } else {
                result = await this.adapter.deleteProject(projectId);
            }

            if (result.success) {
                this.removeProjectIndexEntry(projectId);
                this.dispatchEvent(new CustomEvent('project:changed', { 
                    detail: { projectId, action: 'delete' } 
                }));
            }

            return result;
        } finally {
            release();
        }
    }

    async listProjects(): Promise<ProjectMetadata[]> {
        return await this.adapter.listProjects();
    }

    async importProject(externalPath: string): Promise<ImportResult> {
        const release = await this.queue.acquireLock(`import:${externalPath}`);

        try {
            const loadResult = await loadProjectFromPath(externalPath);
            if (!loadResult.success || !loadResult.project) {
                return {
                    success: false,
                    errorCode: 'READ_ERROR',
                    error: loadResult.error || 'Failed to load external project',
                    projectId: '',
                };
            }

            const rootService = await getStorageRootService();
            const rootPath = rootService.getStorageRoot();
            if (!rootPath) {
                return {
                    success: false,
                    errorCode: 'WRITE_ERROR',
                    error: 'No storage root configured',
                    projectId: loadResult.project.projectId,
                };
            }

            const canonical = this.getCanonicalProjectPaths(rootPath, loadResult.project.projectId);

            let saveResult: SaveResult;
            if (isTauri()) {
                saveResult = await this.copyImportedProjectToCanonicalLocation(externalPath, canonical.projectFilePath);
                if (!saveResult.success) {
                    return {
                        ...saveResult,
                        projectId: loadResult.project.projectId,
                    };
                }

                // Ensure canonical copy is valid and normalized after import.
                const canonicalLoad = await loadProjectFromPath(canonical.projectFilePath);
                if (!canonicalLoad.success || !canonicalLoad.project) {
                    return {
                        success: false,
                        errorCode: 'READ_ERROR',
                        error: canonicalLoad.error || 'Imported file is invalid after copy',
                        projectId: loadResult.project.projectId,
                    };
                }
                saveResult = await this.saveProjectToCanonicalPath(canonicalLoad.project, canonical.projectFilePath);
            } else {
                saveResult = await this.saveProject(loadResult.project);
            }

            if (!saveResult.success) {
                return {
                    ...saveResult,
                    projectId: loadResult.project.projectId,
                };
            }

            this.upsertProjectIndex({
                projectId: loadResult.project.projectId,
                projectName: loadResult.project.projectName,
                projectNumber: loadResult.project.projectNumber,
                clientName: loadResult.project.clientName,
                createdAt: loadResult.project.createdAt,
                modifiedAt: loadResult.project.modifiedAt,
                isArchived: loadResult.project.isArchived,
                filePath: canonical.projectFilePath,
            });

            this.dispatchEvent(
                new CustomEvent('projects:changed', {
                    detail: { action: 'import', projectId: loadResult.project.projectId, sourcePath: externalPath },
                })
            );

            return {
                ...saveResult,
                projectId: loadResult.project.projectId,
            };
        } finally {
            release();
        }
    }

    async exportProject(projectId: string, destPath: string): Promise<ExportResult> {
        const release = await this.queue.acquireLock(`export:${projectId}`);
        
        try {
            const rootService = await getStorageRootService();
            const rootPath = rootService.getStorageRoot();
            
            if (!rootPath) {
                return {
                    success: false,
                    sourcePath: '',
                    destPath,
                    error: 'No storage root configured',
                };
            }

            const canonical = this.getCanonicalProjectPaths(rootPath, projectId);
            const sourcePath = canonical.projectFilePath;

            // Verify source project exists
            if (!(await exists(sourcePath))) {
                return {
                    success: false,
                    sourcePath,
                    destPath,
                    error: 'Source project file does not exist',
                };
            }

            // Copy main project file
            await copyFile(sourcePath, destPath);

            // Copy backup file if exists
            const sourceBackup = `${sourcePath}.bak`;
            const destBackup = `${destPath}.bak`;
            if (await exists(sourceBackup)) {
                await copyFile(sourceBackup, destBackup);
            }

            // Copy thumbnail if exists
            const sourceThumbnail = this.joinPath(canonical.projectDir, 'thumbnail.png');
            if (await exists(sourceThumbnail)) {
                // Extract destination directory and create thumbnail path
                const destDir = destPath.substring(0, destPath.lastIndexOf('/'));
                const destFileName = destPath.substring(destPath.lastIndexOf('/') + 1);
                const destBaseName = destFileName.replace(/\.[^.]+$/, '');
                const destThumbnail = this.joinPath(destDir, `${destBaseName}.png`);
                await copyFile(sourceThumbnail, destThumbnail);
            }

            return {
                success: true,
                sourcePath,
                destPath,
            };
        } catch (error) {
            return {
                success: false,
                sourcePath: '',
                destPath,
                error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        } finally {
            release();
        }
    }

    async getProjectPath(projectId: string): Promise<string> {
        const rootService = await getStorageRootService();
        const rootPath = rootService.getStorageRoot();
        if (!rootPath) {
            return '';
        }
        return this.getCanonicalProjectPaths(rootPath, projectId).projectFilePath;
    }

    async relocateStorageRoot(newPath: string): Promise<RelocationResult> {
        const rootService = await getStorageRootService();
        return await rootService.relocate(newPath);
    }

    async getQuarantinedFiles(): Promise<QuarantinedFile[]> {
        const rootService = await getStorageRootService();
        return await rootService.getQuarantinedFiles();
    }

    async deleteQuarantinedFile(filePath: string): Promise<void> {
        if (await exists(filePath)) {
            await removeFile(filePath);
        }
    }

    private normalizePath(path: string): string {
        return path.replace(/\\/g, '/').replace(/\/+$/, '');
    }

    private joinPath(...parts: string[]): string {
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

    private getCanonicalProjectPaths(rootPath: string, projectId: string): { projectDir: string; projectFilePath: string } {
        const normalizedRoot = this.normalizePath(rootPath);
        const projectDir = this.joinPath(normalizedRoot, 'projects', projectId);
        const projectFilePath = this.joinPath(projectDir, 'project.sws');
        return { projectDir, projectFilePath };
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

    private async saveProjectToCanonicalPath(project: ProjectFile, canonicalPath: string): Promise<SaveResult> {
        const projectDir = canonicalPath.substring(0, canonicalPath.lastIndexOf('/'));
        await createDir(projectDir, true);

        const ioResult = await saveProjectToPath(project, canonicalPath);
        if (!ioResult.success) {
            return {
                success: false,
                errorCode: 'WRITE_ERROR',
                error: ioResult.error || 'Failed to save project to canonical storage path',
            };
        }

        let sizeBytes = 0;
        try {
            const content = await readTextFile(canonicalPath);
            sizeBytes = new TextEncoder().encode(content).length;
        } catch {
            // ignore size calculation failure
        }

        return {
            success: true,
            filePath: canonicalPath,
            sizeBytes,
        };
    }

    private async copyImportedProjectToCanonicalLocation(
        externalPath: string,
        canonicalProjectPath: string
    ): Promise<SaveResult> {
        const canonicalDir = canonicalProjectPath.substring(0, canonicalProjectPath.lastIndexOf('/'));
        await createDir(canonicalDir, true);

        const copied: string[] = [];
        try {
            await this.copyFileAtomic(externalPath, canonicalProjectPath);
            copied.push(canonicalProjectPath);

            const externalBackup = `${externalPath}.bak`;
            const canonicalBackup = `${canonicalProjectPath}.bak`;
            if (await exists(externalBackup)) {
                await this.copyFileAtomic(externalBackup, canonicalBackup);
                copied.push(canonicalBackup);
            }

            const normalizedExternal = this.normalizePath(externalPath);
            const externalDir = normalizedExternal.substring(0, normalizedExternal.lastIndexOf('/'));
            const externalFile = normalizedExternal.substring(normalizedExternal.lastIndexOf('/') + 1);
            const externalBase = externalFile.replace(/\.[^.]+$/, '');
            const externalThumbnail = this.joinPath(externalDir, `${externalBase}.png`);
            const canonicalThumbnail = this.joinPath(canonicalDir, 'thumbnail.png');

            if (await exists(externalThumbnail)) {
                await this.copyFileAtomic(externalThumbnail, canonicalThumbnail);
                copied.push(canonicalThumbnail);
            }

            return {
                success: true,
                filePath: canonicalProjectPath,
            };
        } catch (error) {
            for (const copiedPath of copied) {
                if (await exists(copiedPath)) {
                    await removeFile(copiedPath);
                }
            }
            return {
                success: false,
                errorCode: 'WRITE_ERROR',
                error: error instanceof Error ? error.message : 'Failed to copy imported project',
            };
        }
    }

    private upsertProjectIndex(project: {
        projectId: string;
        projectName: string;
        projectNumber?: string;
        clientName?: string;
        createdAt: string;
        modifiedAt: string;
        isArchived?: boolean;
        filePath: string;
    }): void {
        if (typeof window === 'undefined') {
            return;
        }

        const indexKey = 'sws.projectIndex';
        const raw = window.localStorage.getItem(indexKey);
        const parsed = raw ? JSON.parse(raw) : {};
        const state = (parsed?.state ?? {}) as {
            projects?: Array<Record<string, unknown>>;
            recentProjectIds?: string[];
            loading?: boolean;
            error?: string;
        };

        const projects = Array.isArray(state.projects) ? [...state.projects] : [];
        const nextEntry = {
            projectId: project.projectId,
            projectName: project.projectName,
            projectNumber: project.projectNumber,
            clientName: project.clientName,
            entityCount: 0,
            createdAt: project.createdAt,
            modifiedAt: project.modifiedAt,
            storagePath: project.filePath,
            filePath: project.filePath,
            isArchived: Boolean(project.isArchived),
            status: 'draft',
        };

        const index = projects.findIndex((entry) => entry.projectId === project.projectId);
        if (index >= 0) {
            projects[index] = { ...projects[index], ...nextEntry };
        } else {
            projects.unshift(nextEntry);
        }

        window.localStorage.setItem(
            indexKey,
            JSON.stringify({
                ...parsed,
                state: {
                    ...state,
                    projects,
                    recentProjectIds: Array.isArray(state.recentProjectIds) ? state.recentProjectIds : [],
                },
            })
        );
    }

    private removeProjectIndexEntry(projectId: string): void {
        if (typeof window === 'undefined') {
            return;
        }

        const indexKey = 'sws.projectIndex';
        const raw = window.localStorage.getItem(indexKey);
        const parsed = raw ? JSON.parse(raw) : {};
        const state = (parsed?.state ?? {}) as {
            projects?: Array<Record<string, unknown>>;
            recentProjectIds?: string[];
            loading?: boolean;
            error?: string;
        };

        const projects = Array.isArray(state.projects)
            ? state.projects.filter((entry) => entry.projectId !== projectId)
            : [];
        const recentProjectIds = Array.isArray(state.recentProjectIds)
            ? state.recentProjectIds.filter((id) => id !== projectId)
            : [];

        window.localStorage.setItem(
            indexKey,
            JSON.stringify({
                ...parsed,
                state: {
                    ...state,
                    projects,
                    recentProjectIds,
                },
            })
        );
    }
}

// Factory and global cache
let repositoryInstance: ProjectRepository | null = null;

export function createProjectRepository(
    adapter: StorageAdapter, 
    queue: OperationQueue, 
    store: any
): ProjectRepository {
    return new ProjectRepository(adapter, queue, store);
}

export async function getProjectRepository(): Promise<ProjectRepository> {
    if (!repositoryInstance) {
        const { useStorageStore } = await import('../store/storageStore');
        const { getAdapter } = await import('./factory');
        
        const adapter = await getAdapter();
        const queue = getSharedOperationQueue();
        const store = useStorageStore.getState();
        
        repositoryInstance = createProjectRepository(adapter, queue, store);
    }
    return repositoryInstance;
}
