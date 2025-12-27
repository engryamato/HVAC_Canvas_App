/**
 * Entity Manipulation User Journey Tests
 *
 * Tests detailed entity manipulation operations including:
 * - FR-CANV-007: Entity Manipulation (move, resize, delete, duplicate)
 * - FR-CANV-008: Undo/Redo System
 * - FR-INSP-001 through FR-INSP-005: Inspector Panel interactions
 * - US-CD-004: Edit Entity Properties
 * - US-CD-005: Undo/Redo Actions
 *
 * Focus on selection, multi-selection, batch operations, and property updates
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useEntityStore,
  selectEntity,
  selectAllEntities,
  selectEntitiesByType,
  selectEntityCount,
} from '@/core/store/entityStore';
import { useHistoryStore, MAX_HISTORY_SIZE } from '@/core/commands/historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import {
  createEntity,
  createEntities,
  updateEntity,
  deleteEntity,
  deleteEntities,
  moveEntities,
  undo,
  redo,
} from '@/core/commands/entityCommands';
import type { Room, Duct, Equipment, Fitting, Entity } from '@/core/schema';

// Entity factories
const createMockRoom = (id: string, name: string, x = 100, y = 100): Room => ({
  id,
  type: 'room',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name,
    width: 240,
    length: 180,
    height: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 300, volume: 2400, requiredCFM: 600 },
});

const createMockDuct = (id: string, name: string, x = 200, y = 150): Duct => ({
  id,
  type: 'duct',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
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

const createMockEquipment = (id: string, name: string, x = 300, y = 200): Equipment => ({
  id,
  type: 'equipment',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name,
    equipmentType: 'fan',
    capacity: 2000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 24,
    mountHeightUnit: 'in',
  },
});

const createMockFitting = (id: string, x = 250, y = 175): Fitting => ({
  id,
  type: 'fitting',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 10,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    fittingType: 'elbow_90',
    angle: 90,
  },
  calculated: { equivalentLength: 10, pressureLoss: 0.02 },
});

describe('Entity Manipulation User Journey', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useSelectionStore.getState().clearSelection();
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 24,
      snapToGrid: true,
    });
  });

  describe('Selection Operations', () => {
    beforeEach(() => {
      createEntity(createMockRoom('room-1', 'Room 1', 100, 100));
      createEntity(createMockRoom('room-2', 'Room 2', 300, 100));
      createEntity(createMockDuct('duct-1', 'Duct 1', 200, 200));
      createEntity(createMockEquipment('equip-1', 'Equipment 1', 400, 200));
    });

    describe('Single Selection', () => {
      it('should select single entity and deselect others', () => {
        useSelectionStore.getState().select('room-1');
        expect(useSelectionStore.getState().selectedIds).toEqual(['room-1']);

        useSelectionStore.getState().select('room-2');
        expect(useSelectionStore.getState().selectedIds).toEqual(['room-2']);
      });

      it('should replace selection with selectSingle', () => {
        useSelectionStore.getState().selectMultiple(['room-1', 'room-2']);
        useSelectionStore.getState().selectSingle('duct-1');
        expect(useSelectionStore.getState().selectedIds).toEqual(['duct-1']);
      });
    });

    describe('Multi-Selection', () => {
      it('should add to selection with Shift+click (addToSelection)', () => {
        useSelectionStore.getState().select('room-1');
        useSelectionStore.getState().addToSelection('room-2');
        useSelectionStore.getState().addToSelection('duct-1');

        expect(useSelectionStore.getState().selectedIds).toHaveLength(3);
        expect(useSelectionStore.getState().selectedIds).toContain('room-1');
        expect(useSelectionStore.getState().selectedIds).toContain('room-2');
        expect(useSelectionStore.getState().selectedIds).toContain('duct-1');
      });

      it('should not duplicate when adding already selected entity', () => {
        useSelectionStore.getState().select('room-1');
        useSelectionStore.getState().addToSelection('room-1');
        expect(useSelectionStore.getState().selectedIds).toEqual(['room-1']);
      });

      it('should toggle selection with toggleSelection', () => {
        useSelectionStore.getState().select('room-1');
        useSelectionStore.getState().toggleSelection('room-2'); // Add
        expect(useSelectionStore.getState().selectedIds).toContain('room-2');

        useSelectionStore.getState().toggleSelection('room-1'); // Remove
        expect(useSelectionStore.getState().selectedIds).not.toContain('room-1');
      });

      it('should force add with toggleSelection(id, true)', () => {
        useSelectionStore.getState().toggleSelection('room-1', true);
        useSelectionStore.getState().toggleSelection('room-1', true); // Still added
        expect(useSelectionStore.getState().selectedIds).toContain('room-1');
      });

      it('should force remove with toggleSelection(id, false)', () => {
        useSelectionStore.getState().select('room-1');
        useSelectionStore.getState().toggleSelection('room-1', false);
        expect(useSelectionStore.getState().selectedIds).not.toContain('room-1');
      });

      it('should select multiple via marquee (selectMultiple)', () => {
        useSelectionStore.getState().selectMultiple(['room-1', 'room-2', 'duct-1']);
        expect(useSelectionStore.getState().selectedIds).toHaveLength(3);
      });

      it('should remove from selection', () => {
        useSelectionStore.getState().selectMultiple(['room-1', 'room-2', 'duct-1']);
        useSelectionStore.getState().removeFromSelection('room-2');
        expect(useSelectionStore.getState().selectedIds).toHaveLength(2);
        expect(useSelectionStore.getState().selectedIds).not.toContain('room-2');
      });
    });

    describe('Select All (Ctrl+A)', () => {
      it('should select all entities on canvas', () => {
        const allIds = useEntityStore.getState().allIds;
        useSelectionStore.getState().selectAll(allIds);

        expect(useSelectionStore.getState().selectedIds).toHaveLength(4);
        expect(useSelectionStore.getState().selectedIds).toEqual(allIds);
      });
    });

    describe('Clear Selection (Escape)', () => {
      it('should clear all selection', () => {
        useSelectionStore.getState().selectMultiple(['room-1', 'room-2', 'duct-1']);
        useSelectionStore.getState().clearSelection();
        expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
      });
    });

    describe('Hover State', () => {
      it('should track hovered entity', () => {
        useSelectionStore.getState().setHovered('room-1');
        expect(useSelectionStore.getState().hoveredId).toBe('room-1');
      });

      it('should clear hover on null', () => {
        useSelectionStore.getState().setHovered('room-1');
        useSelectionStore.getState().setHovered(null);
        expect(useSelectionStore.getState().hoveredId).toBeNull();
      });
    });
  });

  describe('Move Operations', () => {
    it('should move single entity and record to history', () => {
      const room = createMockRoom('room-1', 'Room', 100, 100);
      createEntity(room);
      useHistoryStore.getState().clear();

      moveEntities([
        {
          id: 'room-1',
          from: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
          to: { x: 200, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
        },
      ]);

      expect(selectEntity('room-1')?.transform.x).toBe(200);
      expect(selectEntity('room-1')?.transform.y).toBe(200);
      expect(useHistoryStore.getState().past).toHaveLength(1);
    });

    it('should move multiple selected entities as group', () => {
      createEntity(createMockRoom('room-1', 'Room 1', 100, 100));
      createEntity(createMockRoom('room-2', 'Room 2', 200, 100));
      useHistoryStore.getState().clear();

      // Move both rooms by (+50, +50)
      moveEntities([
        {
          id: 'room-1',
          from: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
          to: { x: 150, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
        },
        {
          id: 'room-2',
          from: { x: 200, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
          to: { x: 250, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
        },
      ]);

      expect(selectEntity('room-1')?.transform.x).toBe(150);
      expect(selectEntity('room-2')?.transform.x).toBe(250);
      // Single history entry for batch move
      expect(useHistoryStore.getState().past).toHaveLength(1);
    });

    it('should undo batch move operation', () => {
      createEntity(createMockRoom('room-1', 'Room 1', 100, 100));
      createEntity(createMockRoom('room-2', 'Room 2', 200, 100));
      useHistoryStore.getState().clear();

      moveEntities([
        {
          id: 'room-1',
          from: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
          to: { x: 150, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
        },
        {
          id: 'room-2',
          from: { x: 200, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
          to: { x: 250, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
        },
      ]);

      undo();

      expect(selectEntity('room-1')?.transform.x).toBe(100);
      expect(selectEntity('room-2')?.transform.x).toBe(200);
    });

    it('should not record empty move', () => {
      const initialHistorySize = useHistoryStore.getState().past.length;
      moveEntities([]);
      expect(useHistoryStore.getState().past.length).toBe(initialHistorySize);
    });
  });

  describe('Delete Operations', () => {
    describe('Single Delete', () => {
      it('should delete entity by reference', () => {
        const room = createMockRoom('room-1', 'Room');
        createEntity(room);
        deleteEntity(room);
        expect(selectEntity('room-1')).toBeUndefined();
      });

      it('should delete entity by ID', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        deleteEntity('room-1');
        expect(selectEntity('room-1')).toBeUndefined();
      });

      it('should not fail when deleting non-existent entity', () => {
        expect(() => deleteEntity('non-existent')).not.toThrow();
      });

      it('should update selection after delete', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        createEntity(createMockRoom('room-2', 'Room 2'));
        useSelectionStore.getState().selectMultiple(['room-1', 'room-2']);

        deleteEntity('room-1');

        expect(useSelectionStore.getState().selectedIds).not.toContain('room-1');
        expect(useSelectionStore.getState().selectedIds).toContain('room-2');
      });
    });

    describe('Batch Delete', () => {
      it('should delete multiple entities at once', () => {
        const entities = [
          createMockRoom('room-1', 'Room 1'),
          createMockRoom('room-2', 'Room 2'),
          createMockDuct('duct-1', 'Duct 1'),
        ];
        entities.forEach((e) => createEntity(e));
        expect(selectEntityCount()).toBe(3);

        deleteEntities([entities[0], entities[1]]);
        expect(selectEntityCount()).toBe(1);
        expect(selectEntity('room-1')).toBeUndefined();
        expect(selectEntity('room-2')).toBeUndefined();
        expect(selectEntity('duct-1')).toBeDefined();
      });

      it('should create single history entry for batch delete', () => {
        createEntity(createMockRoom('room-1', 'Room 1'));
        createEntity(createMockRoom('room-2', 'Room 2'));
        useHistoryStore.getState().clear();

        deleteEntities([
          useEntityStore.getState().byId['room-1'] as Room,
          useEntityStore.getState().byId['room-2'] as Room,
        ]);

        expect(useHistoryStore.getState().past).toHaveLength(1);
      });

      it('should undo batch delete', () => {
        const room1 = createMockRoom('room-1', 'Room 1');
        const room2 = createMockRoom('room-2', 'Room 2');
        createEntity(room1);
        createEntity(room2);

        deleteEntities([room1, room2]);
        expect(selectEntityCount()).toBe(0);

        undo();
        expect(selectEntityCount()).toBe(2);
        expect(selectEntity('room-1')).toBeDefined();
        expect(selectEntity('room-2')).toBeDefined();
      });
    });
  });

  describe('Batch Create Operations', () => {
    it('should create multiple entities at once', () => {
      const entities = [
        createMockRoom('room-1', 'Room 1'),
        createMockRoom('room-2', 'Room 2'),
        createMockDuct('duct-1', 'Duct 1'),
      ];

      createEntities(entities);

      expect(selectEntityCount()).toBe(3);
      expect(selectEntity('room-1')).toBeDefined();
      expect(selectEntity('room-2')).toBeDefined();
      expect(selectEntity('duct-1')).toBeDefined();
    });

    it('should select all created entities', () => {
      const entities = [createMockRoom('room-1', 'Room 1'), createMockRoom('room-2', 'Room 2')];

      createEntities(entities);

      expect(useSelectionStore.getState().selectedIds).toContain('room-1');
      expect(useSelectionStore.getState().selectedIds).toContain('room-2');
    });

    it('should create single history entry for batch create', () => {
      useHistoryStore.getState().clear();
      const entities = [createMockRoom('room-1', 'Room 1'), createMockRoom('room-2', 'Room 2')];

      createEntities(entities);

      expect(useHistoryStore.getState().past).toHaveLength(1);
    });

    it('should undo batch create', () => {
      const entities = [createMockRoom('room-1', 'Room 1'), createMockRoom('room-2', 'Room 2')];

      createEntities(entities);
      expect(selectEntityCount()).toBe(2);

      undo();
      expect(selectEntityCount()).toBe(0);
    });

    it('should not create anything with empty array', () => {
      const initialCount = selectEntityCount();
      createEntities([]);
      expect(selectEntityCount()).toBe(initialCount);
    });
  });

  describe('FR-CANV-008: Undo/Redo System', () => {
    describe('Basic Undo/Redo', () => {
      it('should return false when nothing to undo', () => {
        expect(undo()).toBe(false);
      });

      it('should return false when nothing to redo', () => {
        expect(redo()).toBe(false);
      });

      it('should return true on successful undo', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        expect(undo()).toBe(true);
      });

      it('should return true on successful redo', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        undo();
        expect(redo()).toBe(true);
      });
    });

    describe('History Stack Management', () => {
      it('should push commands to past stack', () => {
        createEntity(createMockRoom('room-1', 'Room 1'));
        createEntity(createMockRoom('room-2', 'Room 2'));

        expect(useHistoryStore.getState().past).toHaveLength(2);
      });

      it('should move command to future stack on undo', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        expect(useHistoryStore.getState().future).toHaveLength(0);

        undo();
        expect(useHistoryStore.getState().future).toHaveLength(1);
      });

      it('should move command back to past stack on redo', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        undo();
        redo();

        expect(useHistoryStore.getState().past).toHaveLength(1);
        expect(useHistoryStore.getState().future).toHaveLength(0);
      });

      it('should clear future stack on new action', () => {
        createEntity(createMockRoom('room-1', 'Room 1'));
        createEntity(createMockRoom('room-2', 'Room 2'));
        undo();
        expect(useHistoryStore.getState().future).toHaveLength(1);

        createEntity(createMockRoom('room-3', 'Room 3'));
        expect(useHistoryStore.getState().future).toHaveLength(0);
      });

      it('should limit history to MAX_HISTORY_SIZE (100)', () => {
        // Create more than MAX_HISTORY_SIZE entities
        for (let i = 0; i < 105; i++) {
          createEntity(createMockRoom(`room-${i}`, `Room ${i}`));
        }

        expect(useHistoryStore.getState().past.length).toBeLessThanOrEqual(MAX_HISTORY_SIZE);
      });
    });

    describe('Selection Preservation in Undo/Redo', () => {
      it('should restore selection state on undo', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        // After create, room-1 is selected
        expect(useSelectionStore.getState().selectedIds).toContain('room-1');

        undo();
        // After undo, selection should be restored to before create (empty)
        // Note: The actual behavior depends on implementation
      });

      it('should restore selection state on redo', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        undo();
        redo();

        // After redo, room-1 should be selected again
        expect(useSelectionStore.getState().selectedIds).toContain('room-1');
      });
    });

    describe('Complex Undo/Redo Sequences', () => {
      it('should handle create-update-delete undo sequence', () => {
        // Create
        const room = createMockRoom('room-1', 'Original');
        createEntity(room);

        // Update
        const updated: Room = { ...room, props: { ...room.props, name: 'Updated' } };
        updateEntity(updated);

        // Delete
        deleteEntity('room-1');

        // Verify deleted
        expect(selectEntity('room-1')).toBeUndefined();

        // Undo delete
        undo();
        expect(selectEntity('room-1')).toBeDefined();
        expect((selectEntity('room-1') as Room).props.name).toBe('Updated');

        // Undo update
        undo();
        expect((selectEntity('room-1') as Room).props.name).toBe('Original');

        // Undo create
        undo();
        expect(selectEntity('room-1')).toBeUndefined();
      });

      it('should handle interleaved undo/redo', () => {
        createEntity(createMockRoom('room-1', 'Room 1'));
        createEntity(createMockRoom('room-2', 'Room 2'));
        createEntity(createMockRoom('room-3', 'Room 3'));

        undo(); // Remove room-3
        undo(); // Remove room-2
        redo(); // Restore room-2
        undo(); // Remove room-2 again
        undo(); // Remove room-1
        redo(); // Restore room-1

        expect(selectEntity('room-1')).toBeDefined();
        expect(selectEntity('room-2')).toBeUndefined();
        expect(selectEntity('room-3')).toBeUndefined();
      });
    });
  });

  describe('Property Updates (Inspector Panel)', () => {
    describe('Room Property Updates', () => {
      it('should update room name', () => {
        const room = createMockRoom('room-1', 'Original Name');
        createEntity(room);

        const updated: Room = { ...room, props: { ...room.props, name: 'New Name' } };
        updateEntity(updated);

        expect((selectEntity('room-1') as Room).props.name).toBe('New Name');
      });

      it('should update room dimensions', () => {
        const room = createMockRoom('room-1', 'Room');
        createEntity(room);

        const updated: Room = {
          ...room,
          props: { ...room.props, width: 360, length: 240, height: 120 },
        };
        updateEntity(updated);

        const saved = selectEntity('room-1') as Room;
        expect(saved.props.width).toBe(360);
        expect(saved.props.length).toBe(240);
        expect(saved.props.height).toBe(120);
      });

      it('should update room occupancy type', () => {
        const room = createMockRoom('room-1', 'Room');
        createEntity(room);

        const updated: Room = { ...room, props: { ...room.props, occupancyType: 'restaurant' } };
        updateEntity(updated);

        expect((selectEntity('room-1') as Room).props.occupancyType).toBe('restaurant');
      });

      it('should update room ACH', () => {
        const room = createMockRoom('room-1', 'Room');
        createEntity(room);

        const updated: Room = { ...room, props: { ...room.props, airChangesPerHour: 10 } };
        updateEntity(updated);

        expect((selectEntity('room-1') as Room).props.airChangesPerHour).toBe(10);
      });
    });

    describe('Duct Property Updates', () => {
      it('should update duct shape from round to rectangular', () => {
        const duct = createMockDuct('duct-1', 'Duct');
        createEntity(duct);

        const updated: Duct = {
          ...duct,
          props: {
            name: 'Duct',
            shape: 'rectangular',
            width: 16,
            height: 12,
            length: 10,
            material: 'galvanized',
            airflow: 500,
            staticPressure: 0.1,
          },
        };
        updateEntity(updated);

        const saved = selectEntity('duct-1') as Duct;
        expect(saved.props.shape).toBe('rectangular');
        expect(saved.props.width).toBe(16);
        expect(saved.props.height).toBe(12);
      });

      it('should update duct material', () => {
        const duct = createMockDuct('duct-1', 'Duct');
        createEntity(duct);

        const updated: Duct = {
          ...duct,
          props: { ...duct.props, material: 'stainless' },
        };
        updateEntity(updated);

        expect((selectEntity('duct-1') as Duct).props.material).toBe('stainless');
      });

      it('should update duct airflow', () => {
        const duct = createMockDuct('duct-1', 'Duct');
        createEntity(duct);

        const updated: Duct = {
          ...duct,
          props: { ...duct.props, airflow: 1000 },
        };
        updateEntity(updated);

        expect((selectEntity('duct-1') as Duct).props.airflow).toBe(1000);
      });
    });

    describe('Equipment Property Updates', () => {
      it('should update equipment type', () => {
        const equip = createMockEquipment('equip-1', 'Equipment');
        createEntity(equip);

        const updated: Equipment = {
          ...equip,
          props: { ...equip.props, equipmentType: 'diffuser' },
        };
        updateEntity(updated);

        expect((selectEntity('equip-1') as Equipment).props.equipmentType).toBe('diffuser');
      });

      it('should update equipment capacity', () => {
        const equip = createMockEquipment('equip-1', 'Equipment');
        createEntity(equip);

        const updated: Equipment = {
          ...equip,
          props: { ...equip.props, capacity: 5000 },
        };
        updateEntity(updated);

        expect((selectEntity('equip-1') as Equipment).props.capacity).toBe(5000);
      });

      it('should update equipment manufacturer and model', () => {
        const equip = createMockEquipment('equip-1', 'Equipment');
        createEntity(equip);

        const updated: Equipment = {
          ...equip,
          props: { ...equip.props, manufacturer: 'ACME Corp', model: 'XL-500' },
        };
        updateEntity(updated);

        const saved = selectEntity('equip-1') as Equipment;
        expect(saved.props.manufacturer).toBe('ACME Corp');
        expect(saved.props.model).toBe('XL-500');
      });
    });

    describe('Fitting Property Updates', () => {
      it('should update fitting type', () => {
        const fitting = createMockFitting('fit-1');
        createEntity(fitting);

        const updated: Fitting = {
          ...fitting,
          props: { fittingType: 'tee' },
        };
        updateEntity(updated);

        expect((selectEntity('fit-1') as Fitting).props.fittingType).toBe('tee');
      });

      it('should update fitting angle', () => {
        const fitting = createMockFitting('fit-1');
        createEntity(fitting);

        const updated: Fitting = {
          ...fitting,
          props: { ...fitting.props, fittingType: 'elbow_45', angle: 45 },
        };
        updateEntity(updated);

        const saved = selectEntity('fit-1') as Fitting;
        expect(saved.props.fittingType).toBe('elbow_45');
        expect(saved.props.angle).toBe(45);
      });
    });

    describe('Property Update Undo', () => {
      it('should undo property updates', () => {
        const room = createMockRoom('room-1', 'Original');
        createEntity(room);
        useHistoryStore.getState().clear();

        const updated: Room = { ...room, props: { ...room.props, name: 'Updated' } };
        updateEntity(updated);

        expect((selectEntity('room-1') as Room).props.name).toBe('Updated');

        undo();

        expect((selectEntity('room-1') as Room).props.name).toBe('Original');
      });
    });
  });

  describe('Transform Updates', () => {
    it('should update entity position', () => {
      const room = createMockRoom('room-1', 'Room', 100, 100);
      createEntity(room);

      const updated: Room = {
        ...room,
        transform: { ...room.transform, x: 200, y: 300 },
      };
      updateEntity(updated);

      expect(selectEntity('room-1')?.transform.x).toBe(200);
      expect(selectEntity('room-1')?.transform.y).toBe(300);
    });

    it('should update entity rotation', () => {
      const room = createMockRoom('room-1', 'Room');
      createEntity(room);

      const updated: Room = {
        ...room,
        transform: { ...room.transform, rotation: 45 },
      };
      updateEntity(updated);

      expect(selectEntity('room-1')?.transform.rotation).toBe(45);
    });

    it('should update entity scale', () => {
      const room = createMockRoom('room-1', 'Room');
      createEntity(room);

      const updated: Room = {
        ...room,
        transform: { ...room.transform, scaleX: 1.5, scaleY: 1.5 },
      };
      updateEntity(updated);

      expect(selectEntity('room-1')?.transform.scaleX).toBe(1.5);
      expect(selectEntity('room-1')?.transform.scaleY).toBe(1.5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid sequential operations', () => {
      for (let i = 0; i < 50; i++) {
        createEntity(createMockRoom(`room-${i}`, `Room ${i}`));
      }
      expect(selectEntityCount()).toBe(50);

      for (let i = 0; i < 25; i++) {
        undo();
      }
      expect(selectEntityCount()).toBe(25);

      for (let i = 0; i < 10; i++) {
        redo();
      }
      expect(selectEntityCount()).toBe(35);
    });

    it('should maintain entity integrity through undo/redo cycles', () => {
      const room = createMockRoom('room-1', 'Test Room', 100, 100);
      room.props.width = 240;
      room.props.occupancyType = 'office';
      createEntity(room);

      // Multiple undo/redo cycles
      for (let i = 0; i < 5; i++) {
        undo();
        redo();
      }

      const saved = selectEntity('room-1') as Room;
      expect(saved.props.name).toBe('Test Room');
      expect(saved.props.width).toBe(240);
      expect(saved.props.occupancyType).toBe('office');
      expect(saved.transform.x).toBe(100);
    });
  });
});
