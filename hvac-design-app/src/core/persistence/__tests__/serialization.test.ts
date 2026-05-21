import { describe, it, expect } from 'vitest';
import {
  serializeProject,
  deserializeProject,
  deserializeProjectLenient,
  migrateProject,
  isValidProjectFile,
  getSchemaVersion,
} from '../serialization';
import { createEmptyProjectFile, CURRENT_SCHEMA_VERSION, type ProjectFile } from '@/core/schema';
import { createDuct } from '@/features/canvas/entities/ductDefaults';
import { createDuctRun } from '@/features/canvas/entities/ductRunDefaults';

describe('serialization', () => {
  const makeProject = () => createEmptyProjectFile('550e8400-e29b-41d4-a716-446655440000');

  // ── Regression: schema validation edge-cases ────────────────────────────
  describe('schema edge-case serialization', () => {
    it('normalizes negative rotation (Math.atan2 result) to [0, 360)', () => {
      // Math.atan2 returns values in [-180, 180]. The TransformSchema preprocess
      // must coerce them to [0, 360) so serialization does not throw.
      const project = makeProject();
      const run = createDuctRun({ installLength: 10 });
      run.transform.rotation = -90; // simulates an upward duct draw
      project.entities.byId[run.id] = run as any;
      project.entities.allIds = [run.id];

      const result = serializeProject(project);
      expect(result.success).toBe(true);

      // Verify the stored value is the normalized equivalent
      const stored = JSON.parse(result.data!);
      expect(stored.entities.byId[run.id].transform.rotation).toBe(270);
    });

    it('accepts template serviceId (non-UUID) without failing validation', () => {
      // Baseline template IDs like 'tmpl_low_pressure_supply' are not UUIDs.
      // ServiceIdSchema must accept them so save does not throw.
      const project = makeProject();
      const run = createDuctRun({ installLength: 10 });
      (run.props as any).serviceId = 'tmpl_low_pressure_supply';
      project.entities.byId[run.id] = run as any;
      project.entities.allIds = [run.id];

      const result = serializeProject(project);
      expect(result.success).toBe(true);

      const stored = JSON.parse(result.data!);
      expect(stored.entities.byId[run.id].props.serviceId).toBe('tmpl_low_pressure_supply');
    });

    it('coerces empty-string serviceId to undefined on serialize/deserialize round-trip', () => {
      const project = makeProject();
      const run = createDuctRun({ installLength: 10 });
      (run.props as any).serviceId = ''; // empty string from cleared UI field
      project.entities.byId[run.id] = run as any;
      project.entities.allIds = [run.id];

      const serResult = serializeProject(project);
      expect(serResult.success).toBe(true);

      // After round-trip the empty string should be gone
      const desResult = deserializeProject(serResult.data!);
      expect(desResult.success).toBe(true);
      expect(desResult.data?.entities.byId[run.id]?.props).not.toHaveProperty('serviceId');
    });

    it('normalizes rotation 360 to 0 on round-trip', () => {
      const project = makeProject();
      const run = createDuctRun({ installLength: 10 });
      run.transform.rotation = 360;
      project.entities.byId[run.id] = run as any;
      project.entities.allIds = [run.id];

      const result = serializeProject(project);
      expect(result.success).toBe(true);
      const stored = JSON.parse(result.data!);
      expect(stored.entities.byId[run.id].transform.rotation).toBe(0);
    });
  });

  describe('serializeProject', () => {
    it('should serialize valid project to JSON', () => {
      const project = makeProject();
      const result = serializeProject(project);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
    });

    it('should produce valid JSON', () => {
      const project = makeProject();
      const result = serializeProject(project);

      expect(() => JSON.parse(result.data!)).not.toThrow();
    });

    it('should format with indentation', () => {
      const project = makeProject();
      const result = serializeProject(project);

      expect(result.data).toContain('\n');
      expect(result.data).toContain('  '); // 2-space indent
    });

    it('should return error for invalid project', () => {
      const invalidProject = { invalid: true } as unknown as ProjectFile;
      const result = serializeProject(invalidProject);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deserializeProject', () => {
    it('should deserialize valid JSON', () => {
      const project = makeProject();
      const json = JSON.stringify(project);
      const result = deserializeProject(json);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.migrated).toBe(false);
      expect(result.originalVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('hydrates legacy duct entities as duct_run during deserialization', () => {
      const project = makeProject();
      const duct = createDuct({ length: 12 });
      project.entities.byId[duct.id] = duct;
      project.entities.allIds = [duct.id];

      const result = deserializeProject(JSON.stringify(project));

      expect(result.success).toBe(true);
      expect(result.data?.entities.byId[duct.id]?.type).toBe('duct_run');
      expect(result.data?.entities.byId[duct.id]?.props).toMatchObject({
        installLength: 12,
      });
    });

    it('should return error for invalid JSON', () => {
      const result = deserializeProject('not valid json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON format');
    });

    it('should detect version mismatch', () => {
      const project = makeProject();
      const modified = { ...project, schemaVersion: '0.9.0' };
      const json = JSON.stringify(modified);
      const result = deserializeProject(json);

      expect(result.success).toBe(false);
      expect(result.requiresMigration).toBe(true);
      expect(result.foundVersion).toBe('0.9.0');
      expect(result.migrated).toBe(false);
      expect(result.originalVersion).toBe('0.9.0');
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

  describe('deserializeProjectLenient', () => {
    it('should deserialize regardless of schemaVersion mismatch', () => {
      const project = makeProject();
      const modified = { ...project, schemaVersion: '9.9.9' };
      const json = JSON.stringify(modified);
      const result = deserializeProjectLenient(json);

      expect(result.success).toBe(true);
      expect(result.data?.schemaVersion).toBe('9.9.9');
      expect(result.migrated).toBe(false);
      expect(result.originalVersion).toBe('9.9.9');
    });

    it('should keep originalVersion consistent with strict mismatch metadata', () => {
      const project = makeProject();
      const modified = { ...project, schemaVersion: '9.9.9' };
      const json = JSON.stringify(modified);

      const strictResult = deserializeProject(json);
      const lenientResult = deserializeProjectLenient(json);

      expect(strictResult.requiresMigration).toBe(true);
      expect(strictResult.originalVersion).toBe('9.9.9');
      expect(lenientResult.success).toBe(true);
      expect(lenientResult.originalVersion).toBe('9.9.9');
    });
  });

  describe('migrateProject', () => {
    it('should migrate v1 projects to the current schema version', () => {
      const duct = createDuct({ length: 13 });
      const project = {
        ...makeProject(),
        schemaVersion: '1.0.0',
        catalogItems: [],
        services: {},
        entities: {
          byId: {
            [duct.id]: duct,
          },
          allIds: [duct.id],
        },
      };
      const result = migrateProject(project, '1.0.0');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect((result.data as Record<string, unknown>)?.catalogItems).toBeUndefined();
      expect((result.data as Record<string, unknown>)?.services).toEqual({});
      expect(result.data?.entities.byId[duct.id]?.type).toBe('duct_run');
      expect(result.migrated).toBe(true);
      expect(result.originalVersion).toBe('1.0.0');
    });

    it('should return error for unknown version', () => {
      const project = makeProject();
      const result = migrateProject(project, '0.1.0');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown schema version');
      expect(result.migrated).toBe(false);
      expect(result.originalVersion).toBe('0.1.0');
    });
  });

  describe('isValidProjectFile', () => {
    it('should return true for valid project structure', () => {
      const project = makeProject();
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
      const project = makeProject();
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
