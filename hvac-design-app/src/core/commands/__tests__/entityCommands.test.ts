import { describe, it, expect, beforeEach } from 'vitest';
import { createEntity, updateEntity, updateEntities, deleteEntity, undo, redo, splitDuctRunAtPoint } from '../entityCommands';
import { useEntityStore, selectEntity, selectEntityCount } from '@/core/store/entityStore';
import { useHistoryStore } from '../historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import type { Duct, Fitting, Room } from '@/core/schema';
import { createDuct } from '@/features/canvas/entities/ductDefaults';

const createMockRoom = (id: string, name: string): Room => ({
  id,
  type: 'room',
  transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
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

describe('Entity Commands', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useSelectionStore.getState().clearSelection();
  });

  describe('createEntity', () => {
    it('should add entity to store', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      expect(selectEntity('room-1')).toEqual(room);
      expect(selectEntityCount()).toBe(1);
    });

    it('should push command to history', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().canUndo()).toBe(true);
    });
  });

  describe('updateEntity', () => {
    it('should update entity in store', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      const updates = { props: { ...room.props, name: 'Updated Room' } };
      updateEntity('room-1', updates, room);

      const updated = selectEntity('room-1') as Room;
      expect(updated.props.name).toBe('Updated Room');
    });

    it('should push command to history', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      useHistoryStore.getState().clear(); // Clear create command

      updateEntity('room-1', { zIndex: 5 }, room);

      expect(useHistoryStore.getState().past).toHaveLength(1);
    });
  });

  describe('updateEntities', () => {
	    it('should apply and undo multiple updates atomically', () => {
	      const duct: Duct = {
	        id: 'duct-1',
	        type: 'duct',
	        transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
	        zIndex: 1,
	        createdAt: '2025-01-01T00:00:00.000Z',
	        modifiedAt: '2025-01-01T00:00:00.000Z',
	        props: {
	          name: 'Duct 1',
	          engineeringSystem: 'standard_duct',
	          shape: 'round',
	          diameter: 12,
	          length: 20,
	          material: 'galvanized',
          airflow: 1000,
          staticPressure: 0.1,
        },
        calculated: { area: 113.1, velocity: 1273, frictionLoss: 0.03 },
      };

	      const fitting: Fitting = {
	        id: 'fit-1',
	        type: 'fitting',
	        transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
	        zIndex: 2,
	        createdAt: '2025-01-01T00:00:00.000Z',
	        modifiedAt: '2025-01-01T00:00:00.000Z',
	        props: {
	          manualOverride: false,
	          engineeringSystem: 'standard_duct',
	          fittingType: 'elbow_90',
	          inletDuctId: duct.id,
	          autoInserted: true,
	          manualOverride: false,
	        },
	        calculated: { equivalentLength: 30, pressureLoss: 0.01 },
	      };

      createEntity(duct);
      createEntity(fitting);
      useHistoryStore.getState().clear();

      updateEntities([
        {
          id: duct.id,
          previous: duct,
          updates: {
            props: {
              ...duct.props,
              diameter: 14,
            },
          },
        },
        {
          id: fitting.id,
          previous: fitting,
          updates: {
            calculated: {
              ...fitting.calculated,
              equivalentLength: 35,
            },
          },
        },
      ]);

      expect(useHistoryStore.getState().past).toHaveLength(1);
      const updatedDuct = selectEntity(duct.id) as Duct;
      const updatedFitting = selectEntity(fitting.id) as Fitting;
      expect(updatedDuct.props.diameter).toBe(14);
      expect(updatedFitting.calculated.equivalentLength).toBe(35);

      undo();
      const revertedDuct = selectEntity(duct.id) as Duct;
      const revertedFitting = selectEntity(fitting.id) as Fitting;
      expect(revertedDuct.props.diameter).toBe(12);
      expect(revertedFitting.calculated.equivalentLength).toBe(30);
    });
  });

  describe('splitDuctRunAtPoint', () => {
    it('splits a duct, inserts a tee through the existing fitter, and undoes atomically', () => {
      const trunk: Duct = {
        id: 'duct-trunk',
        type: 'duct',
        transform: { x: 100, y: 100, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        props: {
          name: 'Trunk',
          engineeringSystem: 'standard_duct',
          shape: 'round',
          diameter: 12,
          length: 10,
          material: 'galvanized',
          airflow: 1000,
          staticPressure: 0.1,
        },
        calculated: { area: 113.1, velocity: 1273, frictionLoss: 0.03 },
      };
      const branch = createDuct({
        x: 160,
        y: 220,
        length: 10,
        shape: 'round',
        diameter: 12,
        material: 'galvanized',
        airflow: 0,
        staticPressure: 0.1,
        engineeringSystem: 'standard_duct',
      });
      branch.transform.rotation = -90;

      createEntity(trunk);
      useHistoryStore.getState().clear();

      const result = splitDuctRunAtPoint({
        originalDuctId: trunk.id,
        splitPoint: { x: 160, y: 100 },
        branchDuct: branch,
      });

      expect(result).toBe(true);
      expect(useHistoryStore.getState().past).toHaveLength(1);

      const entities = useEntityStore.getState().allIds.map((id) => useEntityStore.getState().byId[id]);
      const ducts = entities.filter((entity): entity is Duct => entity?.type === 'duct');
      const fittings = entities.filter((entity): entity is Fitting => entity?.type === 'fitting');
      expect(ducts).toHaveLength(3);
      expect(fittings).toHaveLength(1);
      expect(fittings[0]?.props.fittingType).toBe('tee');

      undo();

      const entitiesAfterUndo = useEntityStore.getState().allIds.map((id) => useEntityStore.getState().byId[id]);
      const ductsAfterUndo = entitiesAfterUndo.filter((entity): entity is Duct => entity?.type === 'duct');
      const fittingsAfterUndo = entitiesAfterUndo.filter((entity): entity is Fitting => entity?.type === 'fitting');
      expect(ductsAfterUndo).toHaveLength(1);
      expect(ductsAfterUndo[0]?.id).toBe(trunk.id);
      expect(fittingsAfterUndo).toHaveLength(0);
    });
  });

  describe('deleteEntity', () => {
    it('should remove entity from store', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      deleteEntity(room);

      expect(selectEntity('room-1')).toBeUndefined();
      expect(selectEntityCount()).toBe(0);
    });

    it('should push command to history', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      useHistoryStore.getState().clear();

      deleteEntity(room);

      expect(useHistoryStore.getState().past).toHaveLength(1);
    });

	    it('removes linked auto-inserted fittings when deleting a duct', () => {
	      const duct: Duct = {
	        id: 'duct-1',
	        type: 'duct',
	        transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
	        zIndex: 1,
	        createdAt: '2025-01-01T00:00:00.000Z',
	        modifiedAt: '2025-01-01T00:00:00.000Z',
	        props: {
	          name: 'Duct 1',
	          engineeringSystem: 'standard_duct',
	          shape: 'round',
	          diameter: 12,
	          length: 20,
	          material: 'galvanized',
          airflow: 1000,
          staticPressure: 0.1,
        },
        calculated: { area: 113.1, velocity: 1273, frictionLoss: 0.03 },
      };

	      const fitting: Fitting = {
	        id: 'fit-1',
	        type: 'fitting',
	        transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
	        zIndex: 2,
	        createdAt: '2025-01-01T00:00:00.000Z',
	        modifiedAt: '2025-01-01T00:00:00.000Z',
	        props: {
	          manualOverride: false,
	          engineeringSystem: 'standard_duct',
	          fittingType: 'elbow_90',
	          inletDuctId: duct.id,
	          outletDuctId: 'duct-2',
	          autoInserted: true,
	          manualOverride: false,
	        },
	        calculated: { equivalentLength: 30, pressureLoss: 0.01 },
	      };

      createEntity(duct);
      createEntity(fitting);
      useHistoryStore.getState().clear();

      deleteEntity(duct);

      expect(selectEntity(duct.id)).toBeUndefined();
      expect(selectEntity(fitting.id)).toBeUndefined();
      expect(useHistoryStore.getState().past).toHaveLength(2);
    });
  });

  describe('undo', () => {
    it('should return false when nothing to undo', () => {
      expect(undo()).toBe(false);
    });

    it('should undo create by deleting entity', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      expect(selectEntityCount()).toBe(1);
      undo();
      expect(selectEntityCount()).toBe(0);
    });

    it('should undo delete by recreating entity', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      deleteEntity(room);

      expect(selectEntityCount()).toBe(0);
      undo();
      expect(selectEntityCount()).toBe(1);
      expect(selectEntity('room-1')).toBeDefined();
    });

    it('should undo update by restoring previous state', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      useHistoryStore.getState().clear();

      const updates = { props: { ...room.props, name: 'Updated Room' } };
      updateEntity('room-1', updates, room);

      undo();

      const restored = selectEntity('room-1') as Room;
      expect(restored.props.name).toBe('Test Room');
    });
  });

  describe('redo', () => {
    it('should return false when nothing to redo', () => {
      expect(redo()).toBe(false);
    });

    it('should redo create after undo', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      undo();

      expect(selectEntityCount()).toBe(0);
      redo();
      expect(selectEntityCount()).toBe(1);
    });

    it('should redo delete after undo', () => {
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      deleteEntity(room);
      undo();

      expect(selectEntityCount()).toBe(1);
      redo();
      expect(selectEntityCount()).toBe(0);
    });
  });
});
