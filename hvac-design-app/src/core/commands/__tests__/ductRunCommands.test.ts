import { beforeEach, describe, expect, it } from 'vitest';
import { useEntityStore, selectEntity, selectEntityCount } from '@/core/store/entityStore';
import { useHistoryStore } from '../historyStore';
import { undo, redo } from '../entityCommands';
import { mergeDuctRuns, splitDuctRun } from '../ductRunCommands';
import type { DuctRun } from '@/core/schema';
import { PROJECT_INITIAL_STATE, useProjectStore } from '@/core/store/project.store';

function makeRun(id: string, startX: number, endX: number, length = (endX - startX) / 12): DuctRun {
  return {
    id,
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      name: id,
      shape: 'round',
      engineeringSystem: 'standard_duct',
      diameter: 12,
      installLength: length,
      startPoint: { x: startX, y: 0 },
      endPoint: { x: endX, y: 0 },
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
      segments: [{ index: 0, startStation: 0, endStation: length, length, isPartial: false }],
    },
    calculated: {
      area: 0,
      velocity: 0,
      frictionLoss: 0,
    },
  };
}

describe('ductRunCommands', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useProjectStore.setState(PROJECT_INITIAL_STATE);
  });

  it('splits a duct run into two runs and undoes in one history step', () => {
    useEntityStore.getState().addEntity(makeRun('run-1', 0, 120, 10));

    const result = splitDuctRun('run-1', 4, { firstRunId: 'run-1-a', secondRunId: 'run-1-b' });

    expect(result).toEqual({ firstRunId: 'run-1-a', secondRunId: 'run-1-b' });
    expect(selectEntity('run-1')).toBeUndefined();
    expect((selectEntity('run-1-a') as DuctRun).props.installLength).toBe(4);
    expect((selectEntity('run-1-b') as DuctRun).props.installLength).toBe(6);
    expect(useHistoryStore.getState().past).toHaveLength(1);

    undo();
    expect(selectEntity('run-1')).toBeDefined();
    expect(selectEntity('run-1-a')).toBeUndefined();
    expect(selectEntity('run-1-b')).toBeUndefined();

    redo();
    expect(selectEntity('run-1')).toBeUndefined();
    expect(selectEntity('run-1-a')).toBeDefined();
    expect(selectEntity('run-1-b')).toBeDefined();
  });

  it('marks the project modified after splitting a duct run', () => {
    const original = '2026-01-01T00:00:00.000Z';
    useProjectStore.getState().setProject('project-1', {
      projectId: 'project-1',
      projectName: 'Project',
      isArchived: false,
      createdAt: original,
      modifiedAt: original,
    });
    useEntityStore.getState().addEntity(makeRun('run-1', 0, 120, 10));

    splitDuctRun('run-1', 4, { firstRunId: 'run-1-a', secondRunId: 'run-1-b' });

    expect(useProjectStore.getState().projectDetails?.modifiedAt).not.toBe(original);
    expect(useProjectStore.getState().isDirty).toBe(true);
  });

  it('merges compatible connected runs and undoes in one history step', () => {
    useEntityStore.getState().addEntities([makeRun('run-a', 0, 60, 5), makeRun('run-b', 60, 120, 5)]);

    const result = mergeDuctRuns('run-a', 'run-b', { mergedRunId: 'run-merged' });

    expect(result).toEqual({ mergedRunId: 'run-merged' });
    expect(selectEntityCount()).toBe(1);
    expect((selectEntity('run-merged') as DuctRun).props.installLength).toBe(10);
    expect(useHistoryStore.getState().past).toHaveLength(1);

    undo();
    expect(selectEntity('run-a')).toBeDefined();
    expect(selectEntity('run-b')).toBeDefined();
    expect(selectEntity('run-merged')).toBeUndefined();
  });
});
