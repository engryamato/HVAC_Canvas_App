export interface MigrationContext {
    storageRootPath: string;
    scanLocations: string[];
    dryRun?: boolean;
    indexStorageKey?: string;
    existingProjectIds?: string[];
    onProgress?: (progress: MigrationProgress) => void;
}

export interface MigrationProgress {
    stage: 'scanning' | 'processing' | 'completing';
    currentFile?: string;
    completedCount: number;
    totalCount: number;
    percentComplete: number;
}

export interface MigrationResult {
    success: boolean;
    migratedCount: number;
    skippedCount: number;
    failedCount: number;
    errors: MigrationError[];
    duration: number;
}

export interface MigrationError {
    file: string;
    error: string;
    stage: 'scan' | 'read' | 'copy' | 'index' | 'disk';
}

export interface ProjectMetaJson {
    projectId: string;
    projectName: string;
    slug: string;
    createdAt: string;
    modifiedAt: string;
    version: string;
    storageVersion: number;
}
