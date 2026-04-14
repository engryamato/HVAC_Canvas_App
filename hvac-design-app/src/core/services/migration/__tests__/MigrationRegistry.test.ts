import { describe, expect, it } from 'vitest';
import { createEmptyProjectFile, CURRENT_SCHEMA_VERSION } from '@/core/schema';
import { MigrationRegistry, migrateProjectFileV1ToV2 } from '../MigrationRegistry';
import { VersionDetector } from '../VersionDetector';

describe('MigrationRegistry', () => {
  it('registers the built-in 1.0.0 to 2.0.0 migration', () => {
    const registry = new MigrationRegistry();

    expect(registry.hasMigration('1.0.0', CURRENT_SCHEMA_VERSION)).toBe(true);
  });

  it('migrates legacy project files to the current schema version', async () => {
    const registry = new MigrationRegistry();
    const legacyProject = {
      ...createEmptyProjectFile('550e8400-e29b-41d4-a716-446655440000'),
      schemaVersion: '1.0.0',
      catalogItems: [],
      componentDefinitions: [],
      services: {},
    };

    const result = await registry.autoMigrate(legacyProject);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect((result.data as Record<string, unknown>).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect((result.data as Record<string, unknown>).catalogItems).toBeUndefined();
    expect((result.data as Record<string, unknown>).componentDefinitions).toBeUndefined();
    expect((result.data as Record<string, unknown>).services).toEqual({});
    expect(VersionDetector.detectVersion(result.data)).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it('normalizes a v1 project file without dropping core project fields', () => {
    const legacyProject = {
      ...createEmptyProjectFile('550e8400-e29b-41d4-a716-446655440000'),
      schemaVersion: '1.0.0',
      projectName: 'Legacy Project',
      catalogItems: [],
      services: { activeServiceId: null },
    };

    const migrated = migrateProjectFileV1ToV2(legacyProject);

    expect(migrated.projectId).toBe(legacyProject.projectId);
    expect(migrated.projectName).toBe('Legacy Project');
    expect(migrated.entities.allIds).toEqual(legacyProject.entities.allIds);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect((migrated as Record<string, unknown>).services).toEqual({ activeServiceId: null });
  });
});
