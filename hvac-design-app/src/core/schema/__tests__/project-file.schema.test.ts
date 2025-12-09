import { describe, it, expect } from 'vitest';
import {
  EntitySchema,
  ViewportStateSchema,
  ProjectSettingsSchema,
  ProjectFileSchema,
  CURRENT_SCHEMA_VERSION,
  createEmptyProjectFile,
} from '../project-file.schema';
import { DEFAULT_ROOM_PROPS } from '../room.schema';
import { DEFAULT_ROUND_DUCT_PROPS } from '../duct.schema';

describe('EntitySchema (discriminated union)', () => {
  const baseEntity = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
  };

  it('should parse room entity', () => {
    const room = {
      ...baseEntity,
      type: 'room' as const,
      props: DEFAULT_ROOM_PROPS,
      calculated: { area: 100, volume: 800, requiredCFM: 200 },
    };
    const result = EntitySchema.parse(room);
    expect(result.type).toBe('room');
  });

  it('should parse duct entity', () => {
    const duct = {
      ...baseEntity,
      type: 'duct' as const,
      props: DEFAULT_ROUND_DUCT_PROPS,
      calculated: { area: 113.1, velocity: 636.6, frictionLoss: 0.05 },
    };
    const result = EntitySchema.parse(duct);
    expect(result.type).toBe('duct');
  });

  it('should reject invalid entity type', () => {
    const invalid = {
      ...baseEntity,
      type: 'invalid',
      props: {},
    };
    expect(() => EntitySchema.parse(invalid)).toThrow();
  });
});

describe('ViewportStateSchema', () => {
  it('should apply defaults', () => {
    const result = ViewportStateSchema.parse({});
    expect(result.panX).toBe(0);
    expect(result.panY).toBe(0);
    expect(result.zoom).toBe(1);
  });

  it('should enforce zoom range (0.1-4)', () => {
    expect(() => ViewportStateSchema.parse({ zoom: 0.05 })).toThrow();
    expect(() => ViewportStateSchema.parse({ zoom: 5 })).toThrow();
    expect(ViewportStateSchema.parse({ zoom: 0.1 })).toBeTruthy();
    expect(ViewportStateSchema.parse({ zoom: 4 })).toBeTruthy();
  });
});

describe('ProjectSettingsSchema', () => {
  it('should apply defaults', () => {
    const result = ProjectSettingsSchema.parse({});
    expect(result.unitSystem).toBe('imperial');
    expect(result.gridSize).toBe(24);
    expect(result.gridVisible).toBe(true);
  });

  it('should accept metric unit system', () => {
    const result = ProjectSettingsSchema.parse({ unitSystem: 'metric' });
    expect(result.unitSystem).toBe('metric');
  });

  it('should enforce positive grid size', () => {
    expect(() => ProjectSettingsSchema.parse({ gridSize: 0 })).toThrow();
    expect(() => ProjectSettingsSchema.parse({ gridSize: -1 })).toThrow();
  });
});

describe('ProjectFileSchema', () => {
  const validProjectFile = {
    schemaVersion: '1.0.0',
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    projectName: 'Test Project',
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    entities: {
      byId: {},
      allIds: [],
    },
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    settings: { unitSystem: 'imperial' as const, gridSize: 24, gridVisible: true },
  };

  it('should validate empty project file', () => {
    expect(ProjectFileSchema.parse(validProjectFile)).toEqual(validProjectFile);
  });

  it('should enforce schema version format (semver)', () => {
    expect(() =>
      ProjectFileSchema.parse({ ...validProjectFile, schemaVersion: '1.0' })
    ).toThrow();
    expect(() =>
      ProjectFileSchema.parse({ ...validProjectFile, schemaVersion: 'v1.0.0' })
    ).toThrow();
  });

  it('should require project name', () => {
    expect(() =>
      ProjectFileSchema.parse({ ...validProjectFile, projectName: '' })
    ).toThrow();
  });

  it('should allow optional fields', () => {
    const withOptional = {
      ...validProjectFile,
      projectNumber: 'PRJ-001',
      clientName: 'ACME Corp',
    };
    const result = ProjectFileSchema.parse(withOptional);
    expect(result.projectNumber).toBe('PRJ-001');
    expect(result.clientName).toBe('ACME Corp');
  });
});

describe('createEmptyProjectFile', () => {
  it('should create valid empty project', () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const project = createEmptyProjectFile(projectId, 'My Project');

    expect(ProjectFileSchema.parse(project)).toBeTruthy();
    expect(project.projectId).toBe(projectId);
    expect(project.projectName).toBe('My Project');
    expect(project.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(project.entities.allIds).toHaveLength(0);
  });

  it('should use default project name when not provided', () => {
    const project = createEmptyProjectFile('550e8400-e29b-41d4-a716-446655440000');
    expect(project.projectName).toBe('Untitled Project');
  });
});

