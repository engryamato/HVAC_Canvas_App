import { describe, it, expect } from 'vitest';
import {
  serializeProject,
  deserializeProject,
  migrateProject,
  isValidProjectFile,
  getSchemaVersion,
} from '../serialization';
import { createEmptyProjectFile, CURRENT_SCHEMA_VERSION } from '@/core/schema';

describe('serialization', () => {
  describe('serializeProject', () => {
    it('should serialize valid project to JSON', () => {
      const project = createEmptyProjectFile();
      const result = serializeProject(project);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
    });

    it('should produce valid JSON', () => {
      const project = createEmptyProjectFile();
      const result = serializeProject(project);

      expect(() => JSON.parse(result.data!)).not.toThrow();
    });

    it('should format with indentation', () => {
      const project = createEmptyProjectFile();
      const result = serializeProject(project);

      expect(result.data).toContain('\n');
      expect(result.data).toContain('  '); // 2-space indent
    });

    it('should return error for invalid project', () => {
      const invalidProject = { invalid: true } as any;
      const result = serializeProject(invalidProject);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deserializeProject', () => {
    it('should deserialize valid JSON', () => {
      const project = createEmptyProjectFile();
      const json = JSON.stringify(project);
      const result = deserializeProject(json);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should return error for invalid JSON', () => {
      const result = deserializeProject('not valid json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON format');
    });

    it('should detect version mismatch', () => {
      const project = createEmptyProjectFile();
      const modified = { ...project, schemaVersion: '0.9.0' };
      const json = JSON.stringify(modified);
      const result = deserializeProject(json);

      expect(result.success).toBe(false);
      expect(result.requiresMigration).toBe(true);
      expect(result.foundVersion).toBe('0.9.0');
    });

    it('should return error for invalid schema', () => {
      const invalid = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        metadata: 'not an object',
      };
      const result = deserializeProject(JSON.stringify(invalid));

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('migrateProject', () => {
    it('should handle current version', () => {
      const project = createEmptyProjectFile();
      const result = migrateProject(project, '1.0.0');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for unknown version', () => {
      const project = createEmptyProjectFile();
      const result = migrateProject(project, '0.1.0');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown schema version');
    });
  });

  describe('isValidProjectFile', () => {
    it('should return true for valid project structure', () => {
      const project = createEmptyProjectFile();
      const json = JSON.stringify(project);

      expect(isValidProjectFile(json)).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidProjectFile('not json')).toBe(false);
    });

    it('should return false for missing required fields', () => {
      expect(isValidProjectFile('{}')).toBe(false);
      expect(isValidProjectFile('{"schemaVersion": "1.0.0"}')).toBe(false);
    });
  });

  describe('getSchemaVersion', () => {
    it('should extract version from valid JSON', () => {
      const project = createEmptyProjectFile();
      const json = JSON.stringify(project);

      expect(getSchemaVersion(json)).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should return null for invalid JSON', () => {
      expect(getSchemaVersion('not json')).toBeNull();
    });

    it('should return null for missing version', () => {
      expect(getSchemaVersion('{}')).toBeNull();
    });
  });
});

