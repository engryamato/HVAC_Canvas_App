import { createDir, exists, renameFile, readDir } from '../../persistence/filesystem';

export interface QuarantineResult {
    success: boolean;
    quarantinedPath?: string;
    error?: string;
}

/**
 * Moves a corrupted file to the quarantine directory with timestamp naming.
 * 
 * Quarantine structure:
 * {storageRoot}/.quarantine/{projectId}/{fileName}_YYYYMMDD_HHMMSS.sws.corrupted
 * 
 * @param sourcePath - Path to the corrupted file
 * @param storageRoot - Storage root directory
 * @param projectId - Project ID for organizing quarantine
 * @returns QuarantineResult with success status and quarantined path
 */
export async function quarantineFile(
    sourcePath: string,
    storageRoot: string,
    projectId: string
): Promise<QuarantineResult> {
    try {
        // Verify source file exists
        if (!(await exists(sourcePath))) {
            return {
                success: false,
                error: 'Source file does not exist',
            };
        }

        // Extract filename from source path
        const normalizedPath = sourcePath.replace(/\\/g, '/');
        const fileName = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);
        const baseFileName = fileName.replace(/\.[^.]+$/, ''); // Remove extension

        // Generate timestamp: YYYYMMDD_HHMMSS
        const now = new Date();
        const timestamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            '_',
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0'),
        ].join('');

        // Build quarantine path: {root}/.quarantine/{projectId}/{fileName}_YYYYMMDD_HHMMSS.sws.corrupted
        const normalizedRoot = storageRoot.replace(/\\/g, '/').replace(/\/+$/, '');
        const quarantineDir = `${normalizedRoot}/.quarantine/${projectId}`;
        const quarantinedFileName = `${baseFileName}_${timestamp}.sws.corrupted`;
        const quarantinedPath = `${quarantineDir}/${quarantinedFileName}`;

        // Create quarantine directory if it doesn't exist
        await createDir(quarantineDir, true);

        // Move file to quarantine (rename)
        await renameFile(sourcePath, quarantinedPath);

        // eslint-disable-next-line no-console
        console.log(`[Quarantine] Moved corrupted file to: ${quarantinedPath}`);

        return {
            success: true,
            quarantinedPath,
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to quarantine file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Lists all files in the quarantine directory.
 * 
 * @param storageRoot - Storage root directory
 * @returns Array of quarantined file paths
 */
export async function listQuarantinedFiles(storageRoot: string): Promise<string[]> {
    try {
        const normalizedRoot = storageRoot.replace(/\\/g, '/').replace(/\/+$/, '');
        const quarantineRoot = `${normalizedRoot}/.quarantine`;

        if (!(await exists(quarantineRoot))) {
            return [];
        }

        const quarantinedFiles: string[] = [];

        // Read all project directories in quarantine
        const projectDirs = await readDir(quarantineRoot);
        for (const projectDirName of projectDirs) {
            const projectPath = `${quarantineRoot}/${projectDirName}`;
            if (await exists(projectPath)) {
                const files = await readDir(projectPath);
                for (const fileName of files) {
                    quarantinedFiles.push(`${projectPath}/${fileName}`);
                }
            }
        }

        return quarantinedFiles;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[Quarantine] Failed to list quarantined files:', error);
        return [];
    }
}
