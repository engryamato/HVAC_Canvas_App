import { DataVersion, VersionDetector } from './VersionDetector';
import { CURRENT_SCHEMA_VERSION, ProjectFileSchema, type ProjectFile } from '@/core/schema/project-file.schema';

/**
 * Migration step function type
 */
export type MigrationStep = (data: unknown) => Promise<unknown>;

/**
 * Migration registry entry
 */
export interface MigrationEntry {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: MigrationStep;
}

/**
 * Migration error types
 */
export type MigrationErrorType = 
  | 'UNSUPPORTED_VERSION'
  | 'MIGRATION_FAILED'
  | 'VALIDATION_FAILED'
  | 'BACKUP_FAILED'
  | 'UNKNOWN_ERROR';

export interface MigrationError {
  type: MigrationErrorType;
  message: string;
  fromVersion?: string;
  toVersion?: string;
  originalError?: Error;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  steps: string[];
  errors: MigrationError[];
  warnings: string[];
  data?: unknown;
}

function migrateProjectFileV1ToV2(data: unknown): ProjectFile {
  if (!data || typeof data !== 'object') {
    throw new Error('Project data must be an object');
  }

  const source = data as Record<string, unknown>;
  const migrated = {
    ...source,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    _version: CURRENT_SCHEMA_VERSION,
  } as Record<string, unknown>;

  delete migrated.catalogItems;
  delete migrated.componentDefinitions;

  return ProjectFileSchema.parse(migrated);
}

/**
 * Registry for managing data migrations
 */
export class MigrationRegistry {
  private migrations: Map<string, MigrationEntry> = new Map();

  constructor() {
    this.registerBuiltInMigrations();
  }

  private registerBuiltInMigrations(): void {
    if (this.hasMigration('1.0.0', CURRENT_SCHEMA_VERSION)) {
      return;
    }

    this.register({
      fromVersion: '1.0.0',
      toVersion: CURRENT_SCHEMA_VERSION,
      description: 'Upgrade legacy project files to schema v2 and remove legacy store snapshots',
      migrate: async (data: unknown) => migrateProjectFileV1ToV2(data),
    });
  }

  /**
   * Register a migration step
   */
  register(entry: MigrationEntry): void {
    const key = `${entry.fromVersion}→${entry.toVersion}`;
    this.migrations.set(key, entry);
  }

  /**
   * Get migration step for a version transition
   */
  getMigration(fromVersion: string, toVersion: string): MigrationEntry | undefined {
    const key = `${fromVersion}→${toVersion}`;
    return this.migrations.get(key);
  }

  /**
   * Check if migration is registered
   */
  hasMigration(fromVersion: string, toVersion: string): boolean {
    return this.migrations.has(`${fromVersion}→${toVersion}`);
  }

  /**
   * Get all registered migrations
   */
  getAllMigrations(): MigrationEntry[] {
    return Array.from(this.migrations.values());
  }

  /**
   * Execute migration from one version to another
   */
  async migrate(
    data: unknown,
    fromVersion: DataVersion,
    toVersion: DataVersion
  ): Promise<MigrationResult> {
    const from = VersionDetector.versionToString(fromVersion);
    const to = VersionDetector.versionToString(toVersion);
    
    const result: MigrationResult = {
      success: false,
      fromVersion: from,
      toVersion: to,
      steps: [],
      errors: [],
      warnings: [],
    };

    try {
      // Check if versions are supported
      if (!VersionDetector.isVersionSupported(fromVersion)) {
        result.errors.push({
          type: 'UNSUPPORTED_VERSION',
          message: `Version ${from} is not supported for migration`,
          fromVersion: from,
          toVersion: to,
        });
        return result;
      }

      // Get migration path
      const path = VersionDetector.getMigrationPath(fromVersion);
      
      if (path.length === 0) {
        // No migration needed
        result.success = true;
        result.data = data;
        return result;
      }

      // Execute each migration step
      let currentData = data;
      let currentVersion = from;

      for (const targetVersion of path) {
        const migration = this.getMigration(currentVersion, targetVersion);
        
        if (!migration) {
          result.errors.push({
            type: 'MIGRATION_FAILED',
            message: `No migration found from ${currentVersion} to ${targetVersion}`,
            fromVersion: currentVersion,
            toVersion: targetVersion,
          });
          return result;
        }

        try {
          currentData = await migration.migrate(currentData);
          result.steps.push(`${currentVersion}→${targetVersion}`);
          currentVersion = targetVersion;
        } catch (error) {
          result.errors.push({
            type: 'MIGRATION_FAILED',
            message: `Migration failed from ${currentVersion} to ${targetVersion}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            fromVersion: currentVersion,
            toVersion: targetVersion,
            originalError: error instanceof Error ? error : undefined,
          });
          return result;
        }
      }

      // Validate final data
      const validationResult = this.validateData(currentData);
      if (!validationResult.valid) {
        result.errors.push({
          type: 'VALIDATION_FAILED',
          message: `Data validation failed: ${validationResult.errors.join(', ')}`,
          fromVersion: from,
          toVersion: to,
        });
        return result;
      }

      result.success = true;
      result.data = currentData;
      
    } catch (error) {
      result.errors.push({
        type: 'UNKNOWN_ERROR',
        message: `Unexpected error during migration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fromVersion: from,
        toVersion: to,
        originalError: error instanceof Error ? error : undefined,
      });
    }

    return result;
  }

  /**
   * Validate migrated data
   */
  private validateData(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Data is not an object');
      return { valid: false, errors };
    }

    const dataObj = data as Record<string, unknown>;

    const hasComponentsArray = Array.isArray(dataObj.components);
    const hasEntitiesArray = Array.isArray(dataObj.entities);
    const hasNormalizedEntities =
      typeof dataObj.entities === 'object' &&
      dataObj.entities !== null &&
      Array.isArray((dataObj.entities as Record<string, unknown>).allIds) &&
      typeof (dataObj.entities as Record<string, unknown>).byId === 'object' &&
      (dataObj.entities as Record<string, unknown>).byId !== null;

    if (!hasComponentsArray && !hasEntitiesArray && !hasNormalizedEntities) {
      errors.push('Data must have components or normalized entities');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Auto-detect version and migrate to current
   */
  async autoMigrate(data: unknown): Promise<MigrationResult> {
    const detectedVersion = VersionDetector.detectVersion(data);
    const currentVersion = {
      major: 2,
      minor: 0,
      patch: 0,
    };

    return this.migrate(data, detectedVersion, currentVersion);
  }
}

// Export singleton instance
export const migrationRegistry = new MigrationRegistry();

export { migrateProjectFileV1ToV2 };

export default MigrationRegistry;
