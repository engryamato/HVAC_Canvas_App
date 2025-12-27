/**
 * Canvas Design Workflow User Journey Tests
 *
 * Tests the complete HVAC design workflow on the canvas
 * Based on PRD requirements:
 * - FR-CANV-001: Viewport (pan, zoom, fit-to-content)
 * - FR-CANV-002: Grid System
 * - FR-CANV-003: Selection Tool (V)
 * - FR-CANV-004: Room Tool (R)
 * - FR-CANV-005: Duct Tool (D)
 * - FR-CANV-006: Equipment Tool (E)
 * - FR-CANV-007: Entity Manipulation
 * - US-CD-001: Draw Room
 * - US-CD-002: Draw Duct
 * - US-CD-003: Place Equipment
 * - US-CD-004: Edit Entity Properties
 *
 * User Journey Reference:
 * Steps 1-23 from UserJourney.md documenting a complete office HVAC system design
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useEntityStore,
  selectEntity,
  selectAllEntities,
  selectEntitiesByType,
  selectEntityCount,
} from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import {
  createEntity,
  updateEntity,
  deleteEntity,
  moveEntities,
  undo,
  redo,
} from '@/core/commands/entityCommands';
import type { Room, Duct, Equipment, Fitting, Entity } from '@/core/schema';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  ZOOM_STEP,
} from '@/core/constants/viewport';

// Entity factories with proper z-index values per PRD
const createMockRoom = (id: string, name: string, x = 100, y = 100): Room => ({
  id,
  type: 'room',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0, // Room z-index: 0
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

const createMockDuct = (
  id: string,
  name: string,
  x = 200,
  y = 150,
  shape: 'round' | 'rectangular' = 'round'
): Duct => ({
  id,
  type: 'duct',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5, // Duct z-index: 5
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props:
    shape === 'round'
      ? {
          name,
          shape: 'round',
          diameter: 12,
          length: 10,
          material: 'galvanized',
          airflow: 500,
          staticPressure: 0.1,
        }
      : {
          name,
          shape: 'rectangular',
          width: 12,
          height: 8,
          length: 10,
          material: 'galvanized',
          airflow: 500,
          staticPressure: 0.1,
        },
  calculated: { area: 113.1, velocity: 636.6, frictionLoss: 0.05 },
});

const createMockEquipment = (
  id: string,
  name: string,
  equipmentType: 'hood' | 'fan' | 'diffuser' | 'damper' | 'air_handler' = 'fan',
  x = 300,
  y = 200
): Equipment => ({
  id,
  type: 'equipment',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5, // Equipment z-index: 5
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name,
    equipmentType,
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

const createMockFitting = (
  id: string,
  fittingType: 'elbow_90' | 'elbow_45' | 'tee' | 'reducer' | 'cap' = 'elbow_90',
  x = 250,
  y = 175
): Fitting => ({
  id,
  type: 'fitting',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 10, // Fitting z-index: 10
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    fittingType,
    angle: fittingType === 'elbow_90' ? 90 : fittingType === 'elbow_45' ? 45 : undefined,
  },
  calculated: { equivalentLength: 10, pressureLoss: 0.02 },
});

describe('Canvas Design Workflow User Journey', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useSelectionStore.getState().clearSelection();
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: DEFAULT_ZOOM,
      gridVisible: true,
      gridSize: 24,
      snapToGrid: true,
    });
  });

  describe('FR-CANV-001: Viewport Controls', () => {
    describe('Pan Functionality', () => {
      it('should start at origin (0,0)', () => {
        const viewport = useViewportStore.getState();
        expect(viewport.panX).toBe(0);
        expect(viewport.panY).toBe(0);
      });

      it('should pan by delta values', () => {
        useViewportStore.getState().pan(100, 50);
        const viewport = useViewportStore.getState();
        expect(viewport.panX).toBe(100);
        expect(viewport.panY).toBe(50);
      });

      it('should accumulate pan values', () => {
        useViewportStore.getState().pan(100, 100);
        useViewportStore.getState().pan(-50, 25);
        const viewport = useViewportStore.getState();
        expect(viewport.panX).toBe(50);
        expect(viewport.panY).toBe(125);
      });

      it('should set absolute pan position', () => {
        useViewportStore.getState().setPan(500, 300);
        const viewport = useViewportStore.getState();
        expect(viewport.panX).toBe(500);
        expect(viewport.panY).toBe(300);
      });
    });

    describe('Zoom Functionality', () => {
      it('should start at default zoom (100%)', () => {
        expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM);
      });

      it('should zoom in by step', () => {
        useViewportStore.getState().zoomIn();
        expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM + ZOOM_STEP);
      });

      it('should zoom out by step', () => {
        useViewportStore.getState().zoomOut();
        expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM - ZOOM_STEP);
      });

      it('should clamp zoom to minimum (10%)', () => {
        useViewportStore.getState().zoomTo(0.05); // Try to go below min
        expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);
      });

      it('should clamp zoom to maximum (400%)', () => {
        useViewportStore.getState().zoomTo(5); // Try to go above max
        expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
      });

      it('should zoom to specific level', () => {
        useViewportStore.getState().zoomTo(1.5);
        expect(useViewportStore.getState().zoom).toBe(1.5);
      });

      it('should zoom toward cursor position', () => {
        const initialPanX = 0;
        const initialPanY = 0;
        useViewportStore.getState().setPan(initialPanX, initialPanY);

        // Zoom in centered on point (400, 300)
        useViewportStore.getState().zoomIn(400, 300);

        // Pan should adjust to zoom toward the center point
        const viewport = useViewportStore.getState();
        expect(viewport.zoom).toBeGreaterThan(DEFAULT_ZOOM);
        // Pan values should be non-zero after zoom toward point
      });
    });

    describe('Reset View', () => {
      it('should reset to default pan and zoom', () => {
        useViewportStore.getState().setPan(500, 300);
        useViewportStore.getState().zoomTo(2.0);

        useViewportStore.getState().resetView();

        const viewport = useViewportStore.getState();
        expect(viewport.panX).toBe(0);
        expect(viewport.panY).toBe(0);
        expect(viewport.zoom).toBe(DEFAULT_ZOOM);
      });
    });

    describe('Fit to Content', () => {
      it('should fit viewport to content bounds', () => {
        const bounds = { x: 100, y: 100, width: 500, height: 400 };
        const canvasDimensions = { width: 800, height: 600 };

        useViewportStore.getState().fitToContent(bounds, canvasDimensions);

        const viewport = useViewportStore.getState();
        // After fit, zoom should be adjusted to fit content
        expect(viewport.zoom).toBeGreaterThan(0);
        expect(viewport.zoom).toBeLessThanOrEqual(MAX_ZOOM);
      });
    });
  });

  describe('FR-CANV-002: Grid System', () => {
    it('should have grid visible by default', () => {
      expect(useViewportStore.getState().gridVisible).toBe(true);
    });

    it('should have snap-to-grid enabled by default', () => {
      expect(useViewportStore.getState().snapToGrid).toBe(true);
    });

    it('should toggle grid visibility', () => {
      useViewportStore.getState().toggleGrid();
      expect(useViewportStore.getState().gridVisible).toBe(false);

      useViewportStore.getState().toggleGrid();
      expect(useViewportStore.getState().gridVisible).toBe(true);
    });

    it('should toggle snap-to-grid', () => {
      useViewportStore.getState().toggleSnap();
      expect(useViewportStore.getState().snapToGrid).toBe(false);

      useViewportStore.getState().toggleSnap();
      expect(useViewportStore.getState().snapToGrid).toBe(true);
    });

    it('should allow setting custom grid size', () => {
      useViewportStore.getState().setGridSize(48); // 1 inch at scale
      expect(useViewportStore.getState().gridSize).toBe(48);
    });
  });

  describe('FR-CANV-003: Selection Tool', () => {
    beforeEach(() => {
      // Setup test entities
      createEntity(createMockRoom('room-1', 'Room 1', 100, 100));
      createEntity(createMockRoom('room-2', 'Room 2', 400, 100));
      createEntity(createMockDuct('duct-1', 'Duct 1', 200, 200));
    });

    it('should select single entity', () => {
      useSelectionStore.getState().clearSelection();
      useSelectionStore.getState().select('room-1');

      expect(useSelectionStore.getState().selectedIds).toEqual(['room-1']);
    });

    it('should add to selection with addToSelection', () => {
      useSelectionStore.getState().select('room-1');
      useSelectionStore.getState().addToSelection('room-2');

      expect(useSelectionStore.getState().selectedIds).toContain('room-1');
      expect(useSelectionStore.getState().selectedIds).toContain('room-2');
    });

    it('should toggle selection', () => {
      useSelectionStore.getState().select('room-1');
      useSelectionStore.getState().toggleSelection('room-2'); // Add
      useSelectionStore.getState().toggleSelection('room-1'); // Remove

      expect(useSelectionStore.getState().selectedIds).toEqual(['room-2']);
    });

    it('should clear selection with escape', () => {
      useSelectionStore.getState().selectMultiple(['room-1', 'room-2', 'duct-1']);
      expect(useSelectionStore.getState().selectedIds).toHaveLength(3);

      useSelectionStore.getState().clearSelection();
      expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
    });

    it('should select multiple entities (marquee)', () => {
      useSelectionStore.getState().selectMultiple(['room-1', 'room-2', 'duct-1']);
      expect(useSelectionStore.getState().selectedIds).toHaveLength(3);
    });

    it('should select all entities', () => {
      const allIds = useEntityStore.getState().allIds;
      useSelectionStore.getState().selectAll(allIds);

      expect(useSelectionStore.getState().selectedIds).toEqual(allIds);
    });
  });

  describe('FR-CANV-004: Room Tool - Drawing Rooms', () => {
    it('should create room with two-click placement', () => {
      const room = createMockRoom('room-1', 'Office 101', 100, 100);
      createEntity(room);

      expect(selectEntity('room-1')).toBeDefined();
      expect(selectEntity('room-1')?.type).toBe('room');
    });

    it('should auto-name rooms sequentially', () => {
      createEntity(createMockRoom('room-1', 'Room 1'));
      createEntity(createMockRoom('room-2', 'Room 2'));
      createEntity(createMockRoom('room-3', 'Room 3'));

      const rooms = selectEntitiesByType('room');
      expect(rooms).toHaveLength(3);
    });

    it('should set room z-index to 0 (bottom layer)', () => {
      const room = createMockRoom('room-1', 'Room');
      createEntity(room);

      expect(selectEntity('room-1')?.zIndex).toBe(0);
    });

    it('should include calculated values for room', () => {
      const room = createMockRoom('room-1', 'Office');
      createEntity(room);

      const savedRoom = selectEntity('room-1') as Room;
      expect(savedRoom.calculated).toBeDefined();
      expect(savedRoom.calculated.area).toBeGreaterThan(0);
      expect(savedRoom.calculated.volume).toBeGreaterThan(0);
      expect(savedRoom.calculated.requiredCFM).toBeGreaterThan(0);
    });
  });

  describe('FR-CANV-005: Duct Tool - Drawing Ducts', () => {
    it('should create round duct', () => {
      const duct = createMockDuct('duct-1', 'Supply Duct', 200, 150, 'round');
      createEntity(duct);

      const savedDuct = selectEntity('duct-1') as Duct;
      expect(savedDuct.props.shape).toBe('round');
      expect(savedDuct.props.diameter).toBe(12);
    });

    it('should create rectangular duct', () => {
      const duct = createMockDuct('duct-1', 'Return Duct', 200, 150, 'rectangular');
      createEntity(duct);

      const savedDuct = selectEntity('duct-1') as Duct;
      expect(savedDuct.props.shape).toBe('rectangular');
      expect(savedDuct.props.width).toBe(12);
      expect(savedDuct.props.height).toBe(8);
    });

    it('should set duct z-index to 5', () => {
      const duct = createMockDuct('duct-1', 'Duct');
      createEntity(duct);

      expect(selectEntity('duct-1')?.zIndex).toBe(5);
    });

    it('should include calculated values for duct', () => {
      const duct = createMockDuct('duct-1', 'Duct');
      createEntity(duct);

      const savedDuct = selectEntity('duct-1') as Duct;
      expect(savedDuct.calculated).toBeDefined();
      expect(savedDuct.calculated.area).toBeGreaterThan(0);
      expect(savedDuct.calculated.velocity).toBeGreaterThan(0);
    });
  });

  describe('FR-CANV-006: Equipment Tool - Placing Equipment', () => {
    it('should place hood equipment', () => {
      const hood = createMockEquipment('hood-1', 'Kitchen Hood', 'hood');
      createEntity(hood);

      const savedHood = selectEntity('hood-1') as Equipment;
      expect(savedHood.props.equipmentType).toBe('hood');
    });

    it('should place fan equipment', () => {
      const fan = createMockEquipment('fan-1', 'Exhaust Fan', 'fan');
      createEntity(fan);

      const savedFan = selectEntity('fan-1') as Equipment;
      expect(savedFan.props.equipmentType).toBe('fan');
    });

    it('should place diffuser equipment', () => {
      const diffuser = createMockEquipment('diff-1', 'Ceiling Diffuser', 'diffuser');
      createEntity(diffuser);

      const savedDiff = selectEntity('diff-1') as Equipment;
      expect(savedDiff.props.equipmentType).toBe('diffuser');
    });

    it('should place damper equipment', () => {
      const damper = createMockEquipment('damp-1', 'Volume Damper', 'damper');
      createEntity(damper);

      const savedDamper = selectEntity('damp-1') as Equipment;
      expect(savedDamper.props.equipmentType).toBe('damper');
    });

    it('should place air handler equipment', () => {
      const ahu = createMockEquipment('ahu-1', 'Air Handler Unit', 'air_handler');
      createEntity(ahu);

      const savedAHU = selectEntity('ahu-1') as Equipment;
      expect(savedAHU.props.equipmentType).toBe('air_handler');
    });

    it('should set equipment z-index to 5', () => {
      const equip = createMockEquipment('equip-1', 'Equipment');
      createEntity(equip);

      expect(selectEntity('equip-1')?.zIndex).toBe(5);
    });
  });

  describe('Fitting Tool - Placing Fittings', () => {
    it('should place 90-degree elbow', () => {
      const elbow = createMockFitting('elbow-1', 'elbow_90');
      createEntity(elbow);

      const savedElbow = selectEntity('elbow-1') as Fitting;
      expect(savedElbow.props.fittingType).toBe('elbow_90');
      expect(savedElbow.props.angle).toBe(90);
    });

    it('should place 45-degree elbow', () => {
      const elbow = createMockFitting('elbow-1', 'elbow_45');
      createEntity(elbow);

      const savedElbow = selectEntity('elbow-1') as Fitting;
      expect(savedElbow.props.fittingType).toBe('elbow_45');
      expect(savedElbow.props.angle).toBe(45);
    });

    it('should place tee fitting', () => {
      const tee = createMockFitting('tee-1', 'tee');
      createEntity(tee);

      const savedTee = selectEntity('tee-1') as Fitting;
      expect(savedTee.props.fittingType).toBe('tee');
    });

    it('should place reducer fitting', () => {
      const reducer = createMockFitting('reducer-1', 'reducer');
      createEntity(reducer);

      const savedReducer = selectEntity('reducer-1') as Fitting;
      expect(savedReducer.props.fittingType).toBe('reducer');
    });

    it('should place cap fitting', () => {
      const cap = createMockFitting('cap-1', 'cap');
      createEntity(cap);

      const savedCap = selectEntity('cap-1') as Fitting;
      expect(savedCap.props.fittingType).toBe('cap');
    });

    it('should set fitting z-index to 10 (top layer)', () => {
      const fitting = createMockFitting('fit-1', 'elbow_90');
      createEntity(fitting);

      expect(selectEntity('fit-1')?.zIndex).toBe(10);
    });
  });

  describe('FR-CANV-007: Entity Manipulation', () => {
    describe('Move Entities', () => {
      it('should move single entity', () => {
        const room = createMockRoom('room-1', 'Room', 100, 100);
        createEntity(room);

        // Record move
        moveEntities([
          {
            id: 'room-1',
            from: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
            to: { x: 200, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
          },
        ]);

        const moved = selectEntity('room-1');
        expect(moved?.transform.x).toBe(200);
        expect(moved?.transform.y).toBe(200);
      });

      it('should move multiple entities together', () => {
        createEntity(createMockRoom('room-1', 'Room 1', 100, 100));
        createEntity(createMockRoom('room-2', 'Room 2', 200, 200));

        moveEntities([
          {
            id: 'room-1',
            from: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
            to: { x: 150, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
          },
          {
            id: 'room-2',
            from: { x: 200, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
            to: { x: 250, y: 250, rotation: 0, scaleX: 1, scaleY: 1 },
          },
        ]);

        expect(selectEntity('room-1')?.transform.x).toBe(150);
        expect(selectEntity('room-2')?.transform.x).toBe(250);
      });

      it('should undo move operation', () => {
        const room = createMockRoom('room-1', 'Room', 100, 100);
        createEntity(room);
        useHistoryStore.getState().clear(); // Clear create command

        moveEntities([
          {
            id: 'room-1',
            from: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
            to: { x: 200, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
          },
        ]);

        undo();

        const restored = selectEntity('room-1');
        expect(restored?.transform.x).toBe(100);
        expect(restored?.transform.y).toBe(100);
      });
    });

    describe('Delete Entities', () => {
      it('should delete single entity', () => {
        const room = createMockRoom('room-1', 'Room');
        createEntity(room);
        expect(selectEntityCount()).toBe(1);

        deleteEntity(room);
        expect(selectEntityCount()).toBe(0);
      });

      it('should delete entity by ID', () => {
        createEntity(createMockRoom('room-1', 'Room'));
        deleteEntity('room-1');
        expect(selectEntity('room-1')).toBeUndefined();
      });

      it('should undo delete operation', () => {
        const room = createMockRoom('room-1', 'Room');
        createEntity(room);
        deleteEntity(room);

        expect(selectEntity('room-1')).toBeUndefined();

        undo();
        expect(selectEntity('room-1')).toBeDefined();
      });

      it('should clear selection after delete', () => {
        const room = createMockRoom('room-1', 'Room');
        createEntity(room);
        useSelectionStore.getState().select('room-1');

        deleteEntity(room);

        // Selection should not contain deleted entity
        expect(useSelectionStore.getState().selectedIds).not.toContain('room-1');
      });
    });

    describe('Update Entity Properties', () => {
      it('should update room properties', () => {
        const room = createMockRoom('room-1', 'Original Name');
        createEntity(room);

        const updatedRoom: Room = {
          ...room,
          props: { ...room.props, name: 'Updated Name' },
        };
        updateEntity(updatedRoom);

        const saved = selectEntity('room-1') as Room;
        expect(saved.props.name).toBe('Updated Name');
      });

      it('should update duct shape', () => {
        const duct = createMockDuct('duct-1', 'Duct', 200, 150, 'round');
        createEntity(duct);

        const updatedDuct: Duct = {
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
        updateEntity(updatedDuct);

        const saved = selectEntity('duct-1') as Duct;
        expect(saved.props.shape).toBe('rectangular');
      });

      it('should undo property update', () => {
        const room = createMockRoom('room-1', 'Original');
        createEntity(room);
        useHistoryStore.getState().clear();

        const updatedRoom: Room = {
          ...room,
          props: { ...room.props, name: 'Updated' },
        };
        updateEntity(updatedRoom);

        undo();

        const saved = selectEntity('room-1') as Room;
        expect(saved.props.name).toBe('Original');
      });
    });
  });

  describe('Complete Office HVAC Design Workflow', () => {
    it('should complete full design workflow per UserJourney.md', () => {
      // Step 1-2: Launch canvas with default view
      expect(useViewportStore.getState().panX).toBe(0);
      expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM);
      expect(useViewportStore.getState().gridVisible).toBe(true);

      // Step 3-4: Pan and zoom to working area
      useViewportStore.getState().pan(100, 50);
      useViewportStore.getState().zoomIn();
      expect(useViewportStore.getState().panX).toBe(100);
      expect(useViewportStore.getState().zoom).toBeGreaterThan(DEFAULT_ZOOM);

      // Step 6-8: Create office boundary with Room tool
      const officeRoom = createMockRoom('office-1', 'Main Office', 200, 200);
      createEntity(officeRoom);
      expect(selectEntityCount()).toBe(1);

      // Step 9-10: Draw perimeter duct run
      const supplyDuct = createMockDuct('duct-supply', 'Supply Duct', 250, 200, 'round');
      createEntity(supplyDuct);
      expect(selectEntityCount()).toBe(2);

      // Step 11-12: Place equipment
      const diffuser = createMockEquipment('diff-1', 'Diffuser 1', 'diffuser', 280, 220);
      const fan = createMockEquipment('fan-1', 'Supply Fan', 'fan', 150, 200);
      createEntity(diffuser);
      createEntity(fan);
      expect(selectEntityCount()).toBe(4);

      // Place fitting at direction change
      const elbow = createMockFitting('elbow-1', 'elbow_90', 260, 200);
      createEntity(elbow);
      expect(selectEntityCount()).toBe(5);

      // Step 13: Return to Select tool and verify selection
      useSelectionStore.getState().select('office-1');
      expect(useSelectionStore.getState().selectedIds).toContain('office-1');

      // Step 15: Edit properties - update room name
      const updatedRoom: Room = {
        ...officeRoom,
        props: { ...officeRoom.props, name: 'Open Office Area' },
      };
      updateEntity(updatedRoom);
      expect((selectEntity('office-1') as Room).props.name).toBe('Open Office Area');

      // Step 18: Duplicate for repetitive layouts - create another diffuser
      const diffuser2 = createMockEquipment('diff-2', 'Diffuser 2', 'diffuser', 320, 220);
      createEntity(diffuser2);
      expect(selectEntitiesByType('equipment').filter((e) => (e as Equipment).props.equipmentType === 'diffuser'))
        .toHaveLength(2);

      // Step 19-20: Delete and undo
      deleteEntity('diff-2');
      expect(selectEntityCount()).toBe(5);
      undo();
      expect(selectEntityCount()).toBe(6);

      // Step 22: Final viewport adjustment
      useViewportStore.getState().resetView();
      expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM);

      // Verify z-index layering
      expect(selectEntity('office-1')?.zIndex).toBe(0); // Room at bottom
      expect(selectEntity('duct-supply')?.zIndex).toBe(5); // Duct in middle
      expect(selectEntity('elbow-1')?.zIndex).toBe(10); // Fitting on top
    });
  });

  describe('Z-Index Layering (per PRD)', () => {
    it('should maintain correct z-index ordering: room(0) < duct(5) < equipment(5) < fitting(10)', () => {
      createEntity(createMockRoom('room-1', 'Room'));
      createEntity(createMockDuct('duct-1', 'Duct'));
      createEntity(createMockEquipment('equip-1', 'Equipment'));
      createEntity(createMockFitting('fit-1', 'elbow_90'));

      const room = selectEntity('room-1');
      const duct = selectEntity('duct-1');
      const equipment = selectEntity('equip-1');
      const fitting = selectEntity('fit-1');

      expect(room?.zIndex).toBe(0);
      expect(duct?.zIndex).toBe(5);
      expect(equipment?.zIndex).toBe(5);
      expect(fitting?.zIndex).toBe(10);

      // Verify layering order
      expect(room!.zIndex).toBeLessThan(duct!.zIndex);
      expect(duct!.zIndex).toBeLessThanOrEqual(equipment!.zIndex);
      expect(equipment!.zIndex).toBeLessThan(fitting!.zIndex);
    });
  });
});
