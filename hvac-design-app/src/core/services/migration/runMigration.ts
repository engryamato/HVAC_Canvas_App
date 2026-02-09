import {
  copyFile,
  createDir,
  exists,
  getDiskSpace,
  readDir,
  removeFile,
  renameFile,
  writeTextFile,
} from '../../persistence/filesystem';
import { loadProject as loadProjectFromPath } from '../../persistence/projectIO';
import { generateMetaJson } from './utils';
import type { MigrationContext, MigrationError, MigrationResult } from './types';

const DEFAULT_PROJECT_INDEX_KEY = 'sws.projectIndex';
const DISK_SPACE_BUFFER_BYTES = 100 * 1024 * 1024;
const DISK_SPACE_ESTIMATE_PER_PROJECT_BYTES = 1 * 1024 * 1024;

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

async function scanForProjectFiles(scanLocations: string[]): Promise<string[]> {
  const discovered = new Set<string>();

  for (const location of scanLocations) {
    if (!(await exists(location))) {
      continue;
    }

    const entries = await readDir(location);
    for (const entry of entries) {
      const entryPath = normalizePath(joinPath(location, entry));
      if (entry.endsWith('.hvac') || entry.endsWith('.sws')) {
        discovered.add(entryPath);
        continue;
      }

      const candidateByNameHvac = normalizePath(joinPath(entryPath, `${entry}.hvac`));
      const candidateByNameSws = normalizePath(joinPath(entryPath, `${entry}.sws`));
      if (await exists(candidateByNameHvac)) {
        discovered.add(candidateByNameHvac);
      }
      if (await exists(candidateByNameSws)) {
        discovered.add(candidateByNameSws);
      }

      try {
        const nestedEntries = await readDir(entryPath);
        for (const nestedEntry of nestedEntries) {
          if (nestedEntry.endsWith('.hvac') || nestedEntry.endsWith('.sws')) {
            discovered.add(normalizePath(joinPath(entryPath, nestedEntry)));
          }
        }
      } catch {
        // Ignore entries that are not directories.
      }
    }
  }

  return Array.from(discovered);
}

export async function runMigration(context: MigrationContext): Promise<MigrationResult> {
  const startTime = Date.now();
  const errors: MigrationError[] = [];
  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  try {
    context.onProgress?.({
      stage: 'scanning',
      completedCount: 0,
      totalCount: 0,
      percentComplete: 0,
    });

    const allFiles = await scanForProjectFiles(context.scanLocations);
    const totalFiles = allFiles.length;

    const requiredBytes =
      DISK_SPACE_BUFFER_BYTES + totalFiles * DISK_SPACE_ESTIMATE_PER_PROJECT_BYTES;
    try {
      const disk = await getDiskSpace(context.storageRootPath);
      if (disk.available_bytes < requiredBytes) {
        return {
          success: false,
          migratedCount: 0,
          skippedCount: totalFiles,
          failedCount: 0,
          errors: [
            {
              file: context.storageRootPath,
              error: 'Insufficient disk space for migration',
              stage: 'disk',
            },
          ],
          duration: Date.now() - startTime,
        };
      }
    } catch {
      // If disk metrics are unavailable, continue migration but do not fail.
    }

    context.onProgress?.({
      stage: 'processing',
      completedCount: 0,
      totalCount: totalFiles,
      percentComplete: 0,
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
          percentComplete: (i / Math.max(totalFiles, 1)) * 100,
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
        const canonicalProjectDir = joinPath(context.storageRootPath, 'projects', project.projectId);
        const canonicalProjectPath = joinPath(canonicalProjectDir, 'project.sws');
        const normalizedSource = normalizePath(filePath);
        const normalizedDestination = normalizePath(canonicalProjectPath);

        if (
          normalizedSource === normalizedDestination ||
          context.existingProjectIds?.includes(project.projectId) ||
          (await exists(canonicalProjectPath))
        ) {
          skippedCount++;
          continue;
        }

        if (context.dryRun) {
          migratedCount++;
          continue;
        }

        await createDir(canonicalProjectDir, true);
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
        const targetThumbnailPath = joinPath(canonicalProjectDir, 'thumbnail.png');
        if (await exists(sourceThumbnailPath)) {
          await copyFileAtomic(sourceThumbnailPath, targetThumbnailPath);
        }

        const meta = generateMetaJson(project);
        await writeTextFile(joinPath(canonicalProjectDir, 'meta.json'), JSON.stringify(meta, null, 2));

        const sourceAutosaveDir = joinPath(sourceDir, '.autosave');
        if (await exists(sourceAutosaveDir)) {
          const targetAutosaveDir = joinPath(canonicalProjectDir, '.autosave');
          await createDir(targetAutosaveDir, true);
          const autosaveFiles = await readDir(sourceAutosaveDir);
          for (const autosaveFile of autosaveFiles) {
            if (!(autosaveFile.endsWith('.hvac') || autosaveFile.endsWith('.sws'))) {
              continue;
            }
            const sourceAutosavePath = joinPath(sourceAutosaveDir, autosaveFile);
            const targetAutosaveFile = autosaveFile.replace(/\.hvac$/i, '.sws');
            await copyFileAtomic(sourceAutosavePath, joinPath(targetAutosaveDir, targetAutosaveFile));
          }
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
      } catch (error) {
        failedCount++;
        errors.push({
          file: filePath,
          error: error instanceof Error ? error.message : String(error),
          stage: 'copy',
        });
      }
    }

    context.onProgress?.({
      stage: 'completing',
      completedCount: totalFiles,
      totalCount: totalFiles,
      percentComplete: 100,
    });

    const duration = Date.now() - startTime;
    return {
      success: failedCount === 0,
      migratedCount,
      skippedCount,
      failedCount,
      errors,
      duration,
    };
  } catch (error) {
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
          error: error instanceof Error ? error.message : String(error),
          stage: 'scan',
        },
      ],
      duration,
    };
  }
}
