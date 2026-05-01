import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyProjectFile } from '@/core/schema';
import { createDuct } from '@/features/canvas/entities/ductDefaults';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import { convertDuctToDuctRun, convertLegacyDuctEntitiesInProject } from '../convertDuctToDuctRun';

describe('convertDuctToDuctRun', () => {
  beforeEach(() => {
    useFabricationProfileStore.persist?.clearStorage?.();
    useFabricationProfileStore.getState().resetProfiles();
  });

  it('converts a legacy duct into a segmented duct_run using the active section length', () => {
    const duct = createDuct({
      x: 100,
      y: 200,
      shape: 'round',
      diameter: 18,
      length: 12,
    });

    const converted = convertDuctToDuctRun(duct);

    expect(converted.type).toBe('duct_run');
    expect(converted.props.installLength).toBe(12);
    expect(converted.props.startPoint).toEqual({ x: 100, y: 200 });
    expect(converted.props.endPoint).toEqual({ x: 244, y: 200 });
    expect(converted.props.segments).toMatchObject([
      { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
      { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
      { index: 2, startStation: 10, endStation: 12, length: 2, isPartial: true },
    ]);
  });

  it('normalizes mixed project payloads without disturbing non-duct entities', () => {
    const project = createEmptyProjectFile('550e8400-e29b-41d4-a716-446655440000');
    const duct = createDuct({ length: 10 });
    const noteId = crypto.randomUUID();

    project.entities.byId[duct.id] = duct;
    project.entities.byId[noteId] = {
      id: noteId,
      type: 'note',
      transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: duct.createdAt,
      modifiedAt: duct.modifiedAt,
      props: { content: 'keep me', fontSize: 12, color: '#111111' },
    } as never;
    project.entities.allIds = [duct.id, noteId];

    const normalized = convertLegacyDuctEntitiesInProject(project);

    expect(normalized.entities.byId[duct.id]?.type).toBe('duct_run');
    expect(normalized.entities.byId[noteId]?.type).toBe('note');
  });
});
