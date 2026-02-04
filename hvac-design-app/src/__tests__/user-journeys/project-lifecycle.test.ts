/**
 * Project Lifecycle User Journey Tests
 *
 * Tests the complete user journey from project creation through to saving/loading
 * Based on PRD requirements:
 * - FR-DASH-002: Create Project
 * - FR-DASH-003: Open Project
 * - FR-FILE-001: Project File Format (.sws)
 * - FR-FILE-002: Save Operations
 * - FR-FILE-003: Load Operations
 * - US-PM-001: Create New Project
 * - US-PM-002: Open Existing Project
 * - US-FM-001: Auto-Save Project
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useEntityStore, selectAllEntities, selectEntityCount } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import { createEntity, deleteEntity, undo, redo } from '@/core/commands/entityCommands';
import type { Room, Duct, Equipment, Fitting } from '@/core/schema';
import { ProjectFileSchema } from '@/core/schema';

// Mock entity factories for consistent test data
const createMockRoom = (id: string, name: string, overrides?: Partial<Room>): Room => ({
  id,
  type: 'room',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name,
    width: 240, // 20 feet
    length: 180, // 15 feet
    ceilingHeight: 96, // 8 feet
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 300, volume: 2400, requiredCFM: 600 },
  ...overrides,
});

const createMockDuct = (id: string, name: string): Duct => ({
  id,
  type: 'duct',
  transform: { x: 200, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
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

const createMockEquipment = (id: string, name: string): Equipment => ({
  id,
  type: 'equipment',
  transform: { x: 300, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
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

const createMockFitting = (id: string): Fitting => ({
  id,
  type: 'fitting',
  transform: { x: 250, y: 175, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 10,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    fittingType: 'elbow_90',
    angle: 90,
  },
  calculated: { equivalentLength: 10, pressureLoss: 0.02 },
});

// Helper to generate consistent UUIDs for tests (must be valid UUID v4 format)
// UUID v4 requires: position 13 = '4' (version), position 17 = '8'/'9'/'a'/'b' (variant)
const testUUID = (num: number) =>
  `00000000-0000-4000-8000-${num.toString(16).padStart(12, '0')}`;

/**
 * Helper to create a complete project file structure
 */
const createMockProjectFile = (
  projectName: string,
  entities: { byId: Record<string, Room | Duct | Equipment | Fitting>; allIds: string[] }
) => ({
  schemaVersion: '1.0.0',
  projectId: testUUID(1),
  projectName,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  entities,
  scope: {
    details: [],
    materials: [],
    projectType: 'Commercial',
  },
  siteConditions: {
    elevation: '0',
    outdoorTemp: '70',
    indoorTemp: '70',
    windSpeed: '0',
    humidity: '50',
    localCodes: '',
  },
  isArchived: false,
  viewportState: {
    panX: 0,
    panY: 0,
    zoom: 1,
  },
  settings: {
    unitSystem: 'imperial' as const,
    gridSize: 24,
    gridVisible: true,
  },
});

describe('Project Lifecycle User Journey', () => {
  // Reset all stores before each test
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

  describe('US-PM-001: Create New Project', () => {
    it('should start with empty canvas state', () => {
      expect(selectEntityCount()).toBe(0);
      expect(selectAllEntities()).toHaveLength(0);
      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
    });

    it('should initialize with default viewport settings', () => {
      const viewport = useViewportStore.getState();
      expect(viewport.panX).toBe(0);
      expect(viewport.panY).toBe(0);
      expect(viewport.zoom).toBe(1);
      expect(viewport.gridVisible).toBe(true);
      expect(viewport.snapToGrid).toBe(true);
    });

    it('should create first entity and update stores correctly', () => {
      const room = createMockRoom('room-1', 'Office 101');
      createEntity(room);

      // Entity added
      expect(selectEntityCount()).toBe(1);
      expect(useEntityStore.getState().byId['room-1']).toEqual(room);

      // History updated
      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().canUndo()).toBe(true);

      // Selection updated
      expect(useSelectionStore.getState().selectedIds).toContain('room-1');
    });

    it('should support creating multiple entity types', () => {
      const room = createMockRoom('room-1', 'Main Office');
      const duct = createMockDuct('duct-1', 'Supply Duct 1');
      const equipment = createMockEquipment('equip-1', 'Exhaust Fan');
      const fitting = createMockFitting('fit-1');

      createEntity(room);
      createEntity(duct);
      createEntity(equipment);
      createEntity(fitting);

      expect(selectEntityCount()).toBe(4);
      expect(useEntityStore.getState().byId['room-1']?.type).toBe('room');
      expect(useEntityStore.getState().byId['duct-1']?.type).toBe('duct');
      expect(useEntityStore.getState().byId['equip-1']?.type).toBe('equipment');
      expect(useEntityStore.getState().byId['fit-1']?.type).toBe('fitting');
    });
  });

  describe('FR-FILE-001: Project File Format (.sws)', () => {
    it('should validate against ProjectFileSchema', () => {
      const roomId = testUUID(100);
      const room = createMockRoom(roomId, 'Office');
      const projectFile = createMockProjectFile('Test Project', {
        byId: { [roomId]: room },
        allIds: [roomId],
      });

      const result = ProjectFileSchema.safeParse(projectFile);
      expect(result.success).toBe(true);
    });

    it('should reject invalid project file', () => {
      const invalidProject = {
        schemaVersion: '1.0.0',
        // Missing required fields
      };

      const result = ProjectFileSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('should support all entity types in project file', () => {
      const roomId = testUUID(100);
      const ductId = testUUID(200);
      const equipId = testUUID(300);
      const fitId = testUUID(400);

      const room = createMockRoom(roomId, 'Office');
      const duct = createMockDuct(ductId, 'Duct');
      const equipment = createMockEquipment(equipId, 'Fan');
      const fitting = createMockFitting(fitId);

      const projectFile = createMockProjectFile('Complete Project', {
        byId: {
          [roomId]: room,
          [ductId]: duct,
          [equipId]: equipment,
          [fitId]: fitting,
        },
        allIds: [roomId, ductId, equipId, fitId],
      });

      const result = ProjectFileSchema.safeParse(projectFile);
      expect(result.success).toBe(true);
    });
  });

  describe('FR-FILE-002: Save Operations - State Serialization', () => {
    it('should serialize current entity state correctly', () => {
      const room = createMockRoom('room-1', 'Office');
      const duct = createMockDuct('duct-1', 'Duct');
      createEntity(room);
      createEntity(duct);

      const state = useEntityStore.getState();
      const serializedEntities = {
        byId: state.byId,
        allIds: state.allIds,
      };

      expect(serializedEntities.allIds).toContain('room-1');
      expect(serializedEntities.allIds).toContain('duct-1');
      expect(Object.keys(serializedEntities.byId)).toHaveLength(2);
    });

    it('should serialize viewport state correctly', () => {
      useViewportStore.getState().setPan(100, 200);
      useViewportStore.getState().zoomTo(1.5);

      const viewport = useViewportStore.getState();
      const serializedViewport = {
        panX: viewport.panX,
        panY: viewport.panY,
        zoom: viewport.zoom,
      };

      expect(serializedViewport.panX).toBe(100);
      expect(serializedViewport.panY).toBe(200);
      expect(serializedViewport.zoom).toBe(1.5);
    });

    it('should preserve entity order in allIds', () => {
      const room1 = createMockRoom('room-1', 'First');
      const room2 = createMockRoom('room-2', 'Second');
      const room3 = createMockRoom('room-3', 'Third');

      createEntity(room1);
      createEntity(room2);
      createEntity(room3);

      const state = useEntityStore.getState();
      expect(state.allIds).toEqual(['room-1', 'room-2', 'room-3']);
    });
  });

  describe('FR-FILE-003: Load Operations - State Hydration', () => {
    it('should hydrate entity store from project file', () => {
      const room = createMockRoom('room-1', 'Loaded Room');
      const duct = createMockDuct('duct-1', 'Loaded Duct');

      const savedState = {
        byId: { 'room-1': room, 'duct-1': duct },
        allIds: ['room-1', 'duct-1'],
      };

      useEntityStore.getState().hydrate(savedState);

      expect(selectEntityCount()).toBe(2);
      const loadedRoom = useEntityStore.getState().byId['room-1'];
      const loadedDuct = useEntityStore.getState().byId['duct-1'];

      if (loadedRoom?.type === 'room') {
        expect(loadedRoom.props.name).toBe('Loaded Room');
      }

      if (loadedDuct?.type === 'duct') {
        expect(loadedDuct.props.name).toBe('Loaded Duct');
      }
    });

    it('should hydrate viewport state from project file', () => {
      const savedViewport = { panX: 150, panY: 250, zoom: 0.75 };

      useViewportStore.getState().setPan(savedViewport.panX, savedViewport.panY);
      useViewportStore.getState().zoomTo(savedViewport.zoom);

      const viewport = useViewportStore.getState();
      expect(viewport.panX).toBe(150);
      expect(viewport.panY).toBe(250);
      expect(viewport.zoom).toBe(0.75);
    });

    it('should clear existing state before loading new project', () => {
      // Create initial entities
      createEntity(createMockRoom('old-room', 'Old Room'));
      expect(selectEntityCount()).toBe(1);

      // Load new project (clear first)
      useEntityStore.getState().clearAllEntities();
      useHistoryStore.getState().clear();
      useSelectionStore.getState().clearSelection();

      const newRoom = createMockRoom('new-room', 'New Room');
      useEntityStore.getState().hydrate({
        byId: { 'new-room': newRoom },
        allIds: ['new-room'],
      });

      expect(selectEntityCount()).toBe(1);
      expect(useEntityStore.getState().byId['old-room']).toBeUndefined();
      expect(useEntityStore.getState().byId['new-room']).toBeDefined();
    });

    it('should preserve entity z-index ordering after load', () => {
      const room = createMockRoom('room-1', 'Room', { zIndex: 0 });
      const duct = createMockDuct('duct-1', 'Duct');
      duct.zIndex = 5;
      const fitting = createMockFitting('fit-1');
      fitting.zIndex = 10;

      useEntityStore.getState().hydrate({
        byId: { 'room-1': room, 'duct-1': duct, 'fit-1': fitting },
        allIds: ['room-1', 'duct-1', 'fit-1'],
      });

      expect(useEntityStore.getState().byId['room-1']!.zIndex).toBe(0);
      expect(useEntityStore.getState().byId['duct-1']!.zIndex).toBe(5);
      expect(useEntityStore.getState().byId['fit-1']!.zIndex).toBe(10);
    });
  });

  describe('FR-CANV-008: Undo/Redo System Integration', () => {
    it('should maintain undo history through project lifecycle', () => {
      const room1 = createMockRoom('room-1', 'Room 1');
      const room2 = createMockRoom('room-2', 'Room 2');

      createEntity(room1);
      createEntity(room2);

      expect(useHistoryStore.getState().past).toHaveLength(2);
      expect(useHistoryStore.getState().canUndo()).toBe(true);
    });

    it('should undo creation in reverse order', () => {
      const room1 = createMockRoom('room-1', 'Room 1');
      const room2 = createMockRoom('room-2', 'Room 2');

      createEntity(room1);
      createEntity(room2);
      expect(selectEntityCount()).toBe(2);

      undo(); // Undo room2 creation
      expect(selectEntityCount()).toBe(1);
      expect(useEntityStore.getState().byId['room-2']).toBeUndefined();
      expect(useEntityStore.getState().byId['room-1']).toBeDefined();

      undo(); // Undo room1 creation
      expect(selectEntityCount()).toBe(0);
    });

    it('should redo creation after undo', () => {
      const room = createMockRoom('room-1', 'Room 1');
      createEntity(room);
      undo();
      expect(selectEntityCount()).toBe(0);

      redo();
      expect(selectEntityCount()).toBe(1);
      expect(useEntityStore.getState().byId['room-1']).toBeDefined();
    });

    it('should clear redo stack on new action', () => {
      const room1 = createMockRoom('room-1', 'Room 1');
      const room2 = createMockRoom('room-2', 'Room 2');
      const room3 = createMockRoom('room-3', 'Room 3');

      createEntity(room1);
      createEntity(room2);
      undo(); // room2 now in future stack

      expect(useHistoryStore.getState().canRedo()).toBe(true);

      createEntity(room3); // New action clears redo stack
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('should track deletion commands for undo', () => {
      const room = createMockRoom('room-1', 'Room 1');
      createEntity(room);
      deleteEntity(room);

      expect(selectEntityCount()).toBe(0);
      expect(useHistoryStore.getState().canUndo()).toBe(true);

      undo(); // Undo deletion
      expect(selectEntityCount()).toBe(1);
      expect(useEntityStore.getState().byId['room-1']).toBeDefined();
    });
  });

  describe('Project State Consistency', () => {
    it('should maintain consistent state across multiple operations', () => {
      // Create multiple entities
      createEntity(createMockRoom('room-1', 'Office'));
      createEntity(createMockDuct('duct-1', 'Main Duct'));
      createEntity(createMockEquipment('equip-1', 'AHU'));

      // Perform selection
      useSelectionStore.getState().selectMultiple(['room-1', 'duct-1']);

      // Adjust viewport
      useViewportStore.getState().setPan(200, 300);
      useViewportStore.getState().zoomTo(1.25);

      // Verify all state is consistent
      expect(selectEntityCount()).toBe(3);
      expect(useSelectionStore.getState().selectedIds).toHaveLength(2);
      expect(useViewportStore.getState().panX).toBe(200);
      expect(useViewportStore.getState().zoom).toBe(1.25);
      expect(useHistoryStore.getState().past).toHaveLength(3);
    });

    it('should clear selection when clearing project', () => {
      createEntity(createMockRoom('room-1', 'Room'));
      useSelectionStore.getState().select('room-1');

      expect(useSelectionStore.getState().selectedIds).toContain('room-1');

      useEntityStore.getState().clearAllEntities();
      useSelectionStore.getState().clearSelection();

      expect(selectEntityCount()).toBe(0);
      expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
    });

    it('should support rapid create/delete cycles', () => {
      // Simulate user rapidly adding and removing entities
      for (let i = 0; i < 10; i++) {
        createEntity(createMockRoom(`room-${i}`, `Room ${i}`));
      }
      expect(selectEntityCount()).toBe(10);

      // Delete half
      for (let i = 0; i < 5; i++) {
        deleteEntity(`room-${i}`);
      }
      expect(selectEntityCount()).toBe(5);

      // Undo all deletions
      for (let i = 0; i < 5; i++) {
        undo();
      }
      expect(selectEntityCount()).toBe(10);
    });
  });

  describe('Entity Order Preservation', () => {
    it('should preserve entity creation order in allIds', () => {
      createEntity(createMockRoom('room-1', 'First'));
      createEntity(createMockDuct('duct-1', 'Second'));
      createEntity(createMockEquipment('equip-1', 'Third'));
      createEntity(createMockFitting('fit-1'));

      const allIds = useEntityStore.getState().allIds;
      expect(allIds[0]).toBe('room-1');
      expect(allIds[1]).toBe('duct-1');
      expect(allIds[2]).toBe('equip-1');
      expect(allIds[3]).toBe('fit-1');
    });

    it('should restore order after undo/redo cycle', () => {
      createEntity(createMockRoom('room-1', 'First'));
      createEntity(createMockRoom('room-2', 'Second'));
      createEntity(createMockRoom('room-3', 'Third'));

      undo(); // Remove third
      undo(); // Remove second
      redo(); // Restore second
      redo(); // Restore third

      const allIds = useEntityStore.getState().allIds;
      expect(allIds).toEqual(['room-1', 'room-2', 'room-3']);
    });
  });
});
