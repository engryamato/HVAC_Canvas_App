import { ProjectFileSchema, CURRENT_SCHEMA_VERSION, type ProjectFile } from '@/core/schema';

/**
 * Serialization result with error handling
 */
export interface SerializationResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Deserialization result with migration support
 */
export interface DeserializationResult {
  success: boolean;
  data?: ProjectFile;
  error?: string;
  requiresMigration?: boolean;
  foundVersion?: string;
}

/**
 * Serialize project state to JSON string
 * Validates the project against the schema before serializing
 */
export function serializeProject(project: ProjectFile): SerializationResult {
  try {
    // Validate before serializing
    const validated = ProjectFileSchema.parse(project);

    // Format with indentation for readability
    const json = JSON.stringify(validated, null, 2);

    return { success: true, data: json };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Serialization failed',
    };
  }
}

/**
 * Deserialize JSON string to project state
 * Validates the result against the schema
 */
export function deserializeProject(json: string): DeserializationResult {
  try {
    const parsed = JSON.parse(json);

    // Check schema version
    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return {
        success: false,
        requiresMigration: true,
        foundVersion: parsed.schemaVersion,
        error: `Schema version mismatch: found ${parsed.schemaVersion}, expected ${CURRENT_SCHEMA_VERSION}`,
      };
    }

    // Validate against schema
    const validated = ProjectFileSchema.parse(parsed);

    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON format' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deserialization failed',
    };
  }
}

/**
 * Migrate project from older schema version
 * Currently supports migration from 1.0.0 (no changes needed)
 * Future versions will add migration logic here
 */
export function migrateProject(project: unknown, fromVersion: string): DeserializationResult {
  // For v1.0.0, no migrations needed yet
  // Future migrations will be added here as version-specific handlers
  if (fromVersion === '1.0.0') {
    return deserializeProject(JSON.stringify(project));
  }

  // Add future migration handlers here:
  // if (fromVersion === '0.9.0') {
  //   const migrated = migrateFrom090(project);
  //   return migrateProject(migrated, '1.0.0');
  // }

  return {
    success: false,
    error: `Unknown schema version: ${fromVersion}`,
  };
}

/**
 * Check if a JSON string is a valid project file
 * Does not fully parse, just checks basic structure
 */
export function isValidProjectFile(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.schemaVersion === 'string' &&
      typeof parsed.metadata === 'object' &&
      typeof parsed.entities === 'object'
    );
  } catch {
    return false;
  }
}

/**
 * Get the schema version from a JSON string without full parsing
 */
export function getSchemaVersion(json: string): string | null {
  try {
    const parsed = JSON.parse(json);
    return typeof parsed.schemaVersion === 'string' ? parsed.schemaVersion : null;
  } catch {
    return null;
  }
}

