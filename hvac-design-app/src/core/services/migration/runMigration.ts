import { invoke } from '@tauri-apps/api/core';
import { createDir, copyFile, renameFile, exists, removeFile } from '../../persistence/filesystem';
import { loadProject as loadProjectFromPath } from '../../persistence/projectIO';
import type { MigrationContext, MigrationResult, MigrationError } from './types';

const DEFAULT_PROJECT_INDEX_KEY = 'sws.projectIndex';

type ProjectIndexState = {
    projects?: Array<Record<string, unknown>>;
    recentProjectIds?: string[];
    loading?: boolean;
    error?: string;
};

function normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+$/, '');
}

function joinPath(...parts: string[]): string {
    if (parts.length === 0) {
        return '';
    }
    const [first, ...rest] = parts;
    let output = (first || '').replace(/[\\/]+$/, '');
    for (const part of rest) {
        const cleaned = part.replace(/^[\\/]+/, '');
        output = `${output}/${cleaned}`;
    }
    return output;
}

function getDirectoryName(path: string): string {
    const normalized = normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash >= 0 ? normalized.slice(0, lastSlash) : '';
}

function getFileName(path: string): string {
    const normalized = normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}

async function copyFileAtomic(sourcePath: string, destinationPath: string): Promise<void> {
    const destinationDir = getDirectoryName(destinationPath);
    if (destinationDir) {
        await createDir(destinationDir, true);
    }

    const tempPath = `${destinationPath}.tmp-${Date.now()}`;
    try {
        await copyFile(sourcePath, tempPath);
        await renameFile(tempPath, destinationPath);
    } catch (error) {
        if (await exists(tempPath)) {
            await removeFile(tempPath);
        }
        throw error;
    }
}

function upsertProjectIndexEntry(
    project: {
        projectId: string;
        projectName: string;
        projectNumber?: string;
        clientName?: string;
        createdAt: string;
        modifiedAt: string;
        isArchived?: boolean;
    },
    storagePath: string,
    indexStorageKey: string
): void {
    if (typeof window === 'undefined') {
        return;
    }

    const raw = window.localStorage.getItem(indexStorageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    const state: ProjectIndexState = (parsed?.state ?? {}) as ProjectIndexState;
    const projects = Array.isArray(state.projects) ? [...state.projects] : [];

    const nextEntry = {
        projectId: project.projectId,
        projectName: project.projectName,
        projectNumber: project.projectNumber,
        clientName: project.clientName,
        entityCount: 0,
        createdAt: project.createdAt,
        modifiedAt: project.modifiedAt,
        storagePath,
        filePath: storagePath,
        isArchived: Boolean(project.isArchived),
        status: 'draft',
    };

    const existingIndex = projects.findIndex((item) => item.projectId === project.projectId);
    if (existingIndex >= 0) {
        projects[existingIndex] = { ...projects[existingIndex], ...nextEntry };
    } else {
        projects.unshift(nextEntry);
    }

    const nextState: ProjectIndexState = {
        projects,
        recentProjectIds: Array.isArray(state.recentProjectIds) ? state.recentProjectIds : [],
        loading: Boolean(state.loading),
        error: state.error,
    };

    window.localStorage.setItem(
        indexStorageKey,
        JSON.stringify({
            ...parsed,
            state: nextState,
        })
    );
}

export async function runMigration(context: MigrationContext): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: MigrationError[] = [];
    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
        // Notify progress
        context.onProgress?.({
            stage: 'scanning',
            completedCount: 0,
            totalCount: 0,
            percentComplete: 0
        });

        // Scan all locations for .hvac and .sws files
        const allFiles: string[] = [];
        const seenFiles = new Set<string>();
        for (const location of context.scanLocations) {
            try {
                const hvacFiles = await invoke<string[]>('list_directory_files', {
                    path: location, 
                    extension: 'hvac' 
                });
                const swsFiles = await invoke<string[]>('list_directory_files', { 
                    path: location, 
                    extension: 'sws' 
                });
                for (const file of [...hvacFiles, ...swsFiles]) {
                    const normalized = normalizePath(file);
                    if (!seenFiles.has(normalized)) {
                        seenFiles.add(normalized);
                        allFiles.push(file);
                    }
                }
            } catch (err) {
                // Silently skip locations that don't exist or aren't accessible
                console.warn(`Failed to scan ${location}:`, err);
            }
        }

        const totalFiles = allFiles.length;

        // Process each file
        context.onProgress?.({
            stage: 'processing',
            completedCount: 0,
            totalCount: totalFiles,
            percentComplete: 0
        });

        for (let i = 0; i < allFiles.length; i++) {
            const filePath = allFiles[i];
            if (!filePath) {
                continue;
            }
            
            try {
                context.onProgress?.({
                    stage: 'processing',
                    currentFile: filePath,
                    completedCount: i,
                    totalCount: totalFiles,
                    percentComplete: (i / totalFiles) * 100
                });

                const loadResult = await loadProjectFromPath(filePath);
                if (!loadResult.success || !loadResult.project) {
                    failedCount++;
                    errors.push({
                        file: filePath,
                        error: loadResult.error || 'Failed to read project file metadata',
                        stage: 'read',
                    });
                    continue;
                }

                const project = loadResult.project;
                const canonicalProjectPath = joinPath(
                    context.storageRootPath,
                    'projects',
                    project.projectId,
                    'project.sws'
                );
                const normalizedSource = normalizePath(filePath);
                const normalizedDestination = normalizePath(canonicalProjectPath);

                if (
                    normalizedSource === normalizedDestination ||
                    context.existingProjectIds?.includes(project.projectId)
                ) {
                    skippedCount++;
                    continue;
                }

                if (context.dryRun) {
                    migratedCount++;
                    continue;
                }

                await createDir(joinPath(context.storageRootPath, 'projects', project.projectId), true);
                await copyFileAtomic(filePath, canonicalProjectPath);

                const sourceBackupPath = `${filePath}.bak`;
                const targetBackupPath = `${canonicalProjectPath}.bak`;
                if (await exists(sourceBackupPath)) {
                    await copyFileAtomic(sourceBackupPath, targetBackupPath);
                }

                const sourceDir = getDirectoryName(filePath);
                const sourceName = getFileName(filePath);
                const sourceBaseName = sourceName.replace(/\.[^.]+$/, '');
                const sourceThumbnailPath = joinPath(sourceDir, `${sourceBaseName}.png`);
                const targetThumbnailPath = joinPath(
                    context.storageRootPath,
                    'projects',
                    project.projectId,
                    'thumbnail.png'
                );

                if (await exists(sourceThumbnailPath)) {
                    await copyFileAtomic(sourceThumbnailPath, targetThumbnailPath);
                }

                upsertProjectIndexEntry(
                    {
                        projectId: project.projectId,
                        projectName: project.projectName,
                        projectNumber: project.projectNumber,
                        clientName: project.clientName,
                        createdAt: project.createdAt,
                        modifiedAt: project.modifiedAt,
                        isArchived: project.isArchived,
                    },
                    canonicalProjectPath,
                    context.indexStorageKey || DEFAULT_PROJECT_INDEX_KEY
                );

                migratedCount++;
            } catch (err) {
                failedCount++;
                errors.push({
                    file: filePath,
                    error: err instanceof Error ? err.message : String(err),
                    stage: 'copy'
                });
            }
        }

        context.onProgress?.({
            stage: 'completing',
            completedCount: totalFiles,
            totalCount: totalFiles,
            percentComplete: 100
        });

        const duration = Date.now() - startTime;

        return {
            success: failedCount === 0,
            migratedCount,
            skippedCount,
            failedCount,
            errors,
            duration
        };
    } catch (err) {
        const duration = Date.now() - startTime;
        
        return {
            success: false,
            migratedCount,
            skippedCount,
            failedCount: failedCount + 1,
            errors: [
                ...errors,
                {
                    file: 'migration',
                    error: err instanceof Error ? err.message : String(err),
                    stage: 'scan'
                }
            ],
            duration
        };
    }
}
