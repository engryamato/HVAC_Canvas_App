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

// Component Library Migration Types

export interface ComponentMigrationResult {
  success: boolean;
  migratedComponents: import('../../schema/unified-component.schema').UnifiedComponentDefinition[];
  errors: ComponentMigrationError[];
  stats: {
    totalProcessed: number;
    successful: number;
    failed: number;
    fromComponents: number;
    fromCatalog: number;
    fromServices: number;
  };
}

export interface ComponentMigrationError {
  sourceId: string;
  sourceType: 'component' | 'catalog' | 'service';
  error: string;
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
