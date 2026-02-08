import { describe, it, expect, beforeEach } from 'vitest';
import {
  useEntityStore,
  selectEntity,
  selectAllEntities,
  selectEntitiesByType,
  selectEntityCount,
} from '../entityStore';
import type { Room, Duct } from '@/core/schema';

const createMockRoom = (id: string, name: string): Room => ({
  id,
  type: 'room',
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name,
    width: 120,
    length: 120,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

const createMockDuct = (id: string, name: string): Duct => ({
  id,
  type: 'duct',
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name,
    shape: 'round',
    diameter: 12,
    length: 10,
    material: 'galvanized',
    airflow: 500,
    staticPressure: 0.1,
  },
  calculated: { area: 113.1, velocity: 636.6, frictionLoss: 0.05 },
});

describe('EntityStore', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
  });

  describe('addEntity', () => {
    it('should add entity to store', () => {
      const room = createMockRoom('room-1', 'Room 1');
      useEntityStore.getState().addEntity(room);

      expect(selectEntity('room-1')).toEqual(room);
      expect(useEntityStore.getState().allIds).toContain('room-1');
    });

    it('should not add duplicate entity', () => {
      const room = createMockRoom('room-1', 'Room 1');
      useEntityStore.getState().addEntity(room);
      useEntityStore.getState().addEntity(room);

      expect(useEntityStore.getState().allIds).toHaveLength(1);
    });
  });

  describe('updateEntity', () => {
    it('should update existing entity', () => {
      const room = createMockRoom('room-1', 'Room 1');
      useEntityStore.getState().addEntity(room);
      useEntityStore.getState().updateEntity('room-1', {
        props: { ...room.props, name: 'Updated Room' },
      });

      const updated = selectEntity('room-1') as Room;
      expect(updated?.props.name).toBe('Updated Room');
    });

    it('should not fail for non-existent entity', () => {
      expect(() => {
        useEntityStore.getState().updateEntity('non-existent', { zIndex: 5 });
      }).not.toThrow();
    });
  });

  describe('removeEntity', () => {
    it('should remove entity from store', () => {
      const room = createMockRoom('room-1', 'Room 1');
      useEntityStore.getState().addEntity(room);
      useEntityStore.getState().removeEntity('room-1');

      expect(selectEntity('room-1')).toBeUndefined();
      expect(useEntityStore.getState().allIds).not.toContain('room-1');
    });
  });

  describe('batch operations', () => {
    it('should add multiple entities', () => {
      const rooms = [createMockRoom('room-1', 'Room 1'), createMockRoom('room-2', 'Room 2')];
      useEntityStore.getState().addEntities(rooms);

      expect(selectEntityCount()).toBe(2);
    });

    it('should remove multiple entities', () => {
      useEntityStore.getState().addEntity(createMockRoom('room-1', 'Room 1'));
      useEntityStore.getState().addEntity(createMockRoom('room-2', 'Room 2'));
      useEntityStore.getState().removeEntities(['room-1', 'room-2']);

      expect(selectEntityCount()).toBe(0);
    });
  });

  describe('selectEntitiesByType', () => {
    it('should filter entities by type', () => {
      useEntityStore.getState().addEntity(createMockRoom('room-1', 'Room 1'));
      useEntityStore.getState().addEntity(createMockRoom('room-2', 'Room 2'));
      useEntityStore.getState().addEntity(createMockDuct('duct-1', 'Duct 1'));

      const rooms = selectEntitiesByType('room');
      const ducts = selectEntitiesByType('duct');

      expect(rooms).toHaveLength(2);
      expect(ducts).toHaveLength(1);
    });
  });

  describe('hydrate', () => {
    it('should hydrate store with new state', () => {
      const newState = {
        byId: { 'room-1': createMockRoom('room-1', 'Hydrated Room') },
        allIds: ['room-1'],
      };
      useEntityStore.getState().hydrate(newState);

      expect(selectEntity('room-1')).toBeDefined();
      expect(selectEntityCount()).toBe(1);
    });
  });

  describe('clearAllEntities', () => {
    it('should clear all entities', () => {
      useEntityStore.getState().addEntity(createMockRoom('room-1', 'Room 1'));
      useEntityStore.getState().addEntity(createMockDuct('duct-1', 'Duct 1'));
      useEntityStore.getState().clearAllEntities();

      expect(selectEntityCount()).toBe(0);
      expect(selectAllEntities()).toHaveLength(0);
    });
  });
});

