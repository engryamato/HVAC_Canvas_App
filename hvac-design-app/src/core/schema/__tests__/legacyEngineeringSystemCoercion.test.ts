import { describe, expect, it, vi } from 'vitest';
import { ProjectFileSchema } from '../project-file.schema';
import { DEFAULT_ROUND_DUCT_PROPS } from '../duct.schema';

describe('legacy engineering system coercion', () => {
  it('coerces a removed entity engineering system to standard duct and warns', () => {
    const entityId = '550e8400-e29b-41d4-a716-446655440000';
    const removedSystem = String.fromCharCode(103, 114, 101, 97, 115, 101, 95, 100, 117, 99, 116);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const project = ProjectFileSchema.parse({
      schemaVersion: '2.0.0',
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      projectName: 'Legacy Project',
      createdAt: '2025-01-01T00:00:00.000Z',
      modifiedAt: '2025-01-01T00:00:00.000Z',
      entities: {
        byId: {
          [entityId]: {
            id: entityId,
            type: 'duct',
            transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            zIndex: 1,
            createdAt: '2025-01-01T00:00:00.000Z',
            modifiedAt: '2025-01-01T00:00:00.000Z',
            props: {
              ...DEFAULT_ROUND_DUCT_PROPS,
              engineeringSystem: removedSystem,
            },
            calculated: { area: 113.1, velocity: 636.6, frictionLoss: 0.05 },
          },
        },
        allIds: [entityId],
      },
    });

    const entity = project.entities.byId[entityId];
    expect(entity.type).toBe('duct');
    if (entity.type !== 'duct') {
      throw new Error('Expected coerced entity to remain a duct.');
    }
    expect(entity.props.engineeringSystem).toBe('standard_duct');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(entityId));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(removedSystem));

    warnSpy.mockRestore();
  });
});
