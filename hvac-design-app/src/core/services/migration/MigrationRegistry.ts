import { DataVersion, VersionDetector } from './VersionDetector';

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

/**
 * Registry for managing data migrations
 */
export class MigrationRegistry {
  private migrations: Map<string, MigrationEntry> = new Map();

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

    // Basic structure validation
    if (!Array.isArray(dataObj.components) && !Array.isArray(dataObj.entities)) {
      errors.push('Data must have components or entities array');
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

export default MigrationRegistry;
