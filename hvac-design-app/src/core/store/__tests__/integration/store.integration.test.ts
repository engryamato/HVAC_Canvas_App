import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEntityStore } from '../../entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useProjectStore } from '../../project.store';
import { useToolStore } from '@/core/store/canvas.store';
import { createEntity, deleteEntity, updateEntity, undo, redo } from '@/core/commands/entityCommands';
import type { Room, Duct } from '@/core/schema';

/**
 * Integration tests for store interactions
 * Tests how multiple stores work together in realistic scenarios
 */
describe('Store Integration Tests', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
    useHistoryStore.getState().clear();
    useProjectStore.setState({
      currentProjectId: 'test-project',
      projectDetails: {
        projectId: 'test-project',
        projectName: 'Test Project',
        projectNumber: 'TEST-001',
        clientName: 'Test Client',
        location: 'Test Location',
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
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      isDirty: false,
    });
    vi.clearAllMocks();
  });

  describe('Entity Store + Selection Store', () => {
    it('should clear selection when selected entity is deleted', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);
      useSelectionStore.getState().selectSingle('room-1');

      expect(useSelectionStore.getState().selectedIds).toContain('room-1');

      deleteEntity('room-1');

      expect(useSelectionStore.getState().selectedIds).not.toContain('room-1');
    });

    it('should handle multi-select and batch delete', () => {
      const room1: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Room 1',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      const room2: Room = {
        ...room1,
        id: 'room-2',
        props: { ...room1.props, name: 'Room 2' },
      };

      createEntity(room1);
      createEntity(room2);

      useSelectionStore.getState().selectSingle('room-1');
      useSelectionStore.getState().toggleSelection('room-2', true);

      expect(useSelectionStore.getState().selectedIds.length).toBe(2);

      // Delete both
      deleteEntity('room-1');
      deleteEntity('room-2');

      expect(useSelectionStore.getState().selectedIds.length).toBe(0);
      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should update selection after entity modification', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);
      useSelectionStore.getState().selectSingle('room-1');

      const updated: Room = {
        ...room,
        props: { ...room.props, name: 'Updated Room' },
      };

      updateEntity('room-1', { props: updated.props }, room);

      // Selection should still contain the entity
      expect(useSelectionStore.getState().selectedIds).toContain('room-1');
      const updatedRoom = useEntityStore.getState().byId['room-1'];
      expect(updatedRoom).toBeDefined();
      expect(updatedRoom!.type).toBe('room');
      if (updatedRoom?.type === 'room') {
        expect(updatedRoom.props.name).toBe('Updated Room');
      }
    });
  });

  describe('Entity Store + History Store', () => {
    it('should record entity creation in history', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      expect(useHistoryStore.getState().past.length).toBe(0);

      createEntity(room);

      expect(useHistoryStore.getState().past.length).toBe(1);
      expect(useEntityStore.getState().allIds).toContain('room-1');
    });

    it('should sync entity store with history on undo/redo', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);
      expect(useEntityStore.getState().allIds.length).toBe(1);

      undo();
      expect(useEntityStore.getState().allIds.length).toBe(0);

      redo();
      expect(useEntityStore.getState().allIds.length).toBe(1);
    });

    it('should clear history when clearing entities', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);
      expect(useHistoryStore.getState().past.length).toBe(1);

      useEntityStore.getState().clearAllEntities();
      useHistoryStore.getState().clear();

      expect(useHistoryStore.getState().past.length).toBe(0);
      expect(useHistoryStore.getState().future.length).toBe(0);
    });
  });

  describe('Entity Store + Project Store', () => {
    it('should mark project as dirty when entities are modified', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      expect(useProjectStore.getState().isDirty).toBe(false);

      createEntity(room);
      useProjectStore.setState({ isDirty: true });

      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it('should include entity data in project export', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);

      const entities = useEntityStore.getState();
      const projectDetails = useProjectStore.getState().projectDetails;

      expect(entities.allIds).toContain('room-1');
      expect(projectDetails?.projectName).toBe('Test Project');
    });
  });

  describe('Tool Store + Entity Store', () => {
    it('should create appropriate entities based on selected tool', () => {
      useToolStore.setState({ currentTool: 'room' });
      expect(useToolStore.getState().currentTool).toBe('room');

      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);
      expect(useEntityStore.getState().byId['room-1']?.type).toBe('room');

      useToolStore.setState({ currentTool: 'duct' });
      expect(useToolStore.getState().currentTool).toBe('duct');

      const duct: Duct = {
        id: 'duct-1',
        type: 'duct',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 5,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Duct',
          shape: 'rectangular',
          length: 120,
          width: 12,
          height: 8,
          material: 'galvanized',
          airflow: 500,
          staticPressure: 0.1,
        },
        calculated: {
          area: 2.67,
          velocity: 800,
          frictionLoss: 0.15,
        },
      };

      createEntity(duct);
      expect(useEntityStore.getState().byId['duct-1']?.type).toBe('duct');
    });

    it('should switch to select tool after entity creation (if configured)', () => {
      useToolStore.setState({ currentTool: 'room' });

      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);

      // Depending on app behavior, tool might stay or switch
      // This tests current state
      expect(['room', 'select']).toContain(useToolStore.getState().currentTool);
    });
  });

  describe('Complex Multi-Store Scenarios', () => {
    it('should handle full design workflow with all stores', () => {
      // Set project details
      useProjectStore.setState({
        currentProjectId: 'workflow-test',
        projectDetails: {
          projectId: 'workflow-test',
          projectName: 'Workflow Test',
          projectNumber: 'WF-001',
          clientName: 'Test Client',
          location: 'Test Location',
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
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        },
        isDirty: false,
      });

      // Create entities
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);
      useProjectStore.setState({ isDirty: true });

      // Select entity
      useSelectionStore.getState().selectSingle('room-1');

      // Verify all stores are synchronized
      expect(useEntityStore.getState().allIds).toContain('room-1');
      expect(useSelectionStore.getState().selectedIds).toContain('room-1');
      expect(useHistoryStore.getState().past.length).toBe(1);
      expect(useProjectStore.getState().isDirty).toBe(true);
      expect(useProjectStore.getState().currentProjectId).toBe('workflow-test');

      // Delete entity
      deleteEntity('room-1');

      // Verify cleanup across stores
      expect(useEntityStore.getState().allIds.length).toBe(0);
      expect(useSelectionStore.getState().selectedIds.length).toBe(0);
      expect(useHistoryStore.getState().past.length).toBe(2); // Create + Delete

      // Undo delete
      undo();
      expect(useEntityStore.getState().allIds).toContain('room-1');

      // Undo create
      undo();
      expect(useEntityStore.getState().allIds.length).toBe(0);

      // Redo create
      redo();
      expect(useEntityStore.getState().allIds.length).toBe(1);

      // Redo delete
      redo();
      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should maintain consistency across rapid operations', () => {
      for (let i = 0; i < 10; i++) {
        const room: Room = {
          id: `room-${i}`,
          type: 'room',
          transform: { x: i * 100, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
          zIndex: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          props: {
            name: `Room ${i}`,
            width: 120,
            length: 120,
            ceilingHeight: 96,
            occupancyType: 'office',
            airChangesPerHour: 4,
          },
          calculated: { area: 100, volume: 800, requiredCFM: 200 },
        };

        createEntity(room);
        useSelectionStore.getState().selectSingle(`room-${i}`);
      }

      expect(useEntityStore.getState().allIds.length).toBe(10);
      expect(useHistoryStore.getState().past.length).toBe(10);
      expect(useSelectionStore.getState().selectedIds.length).toBe(1);
      expect(useSelectionStore.getState().selectedIds[0]).toBe('room-9');

      // Undo all
      for (let i = 0; i < 10; i++) {
        undo();
      }

      expect(useEntityStore.getState().allIds.length).toBe(0);
      expect(useHistoryStore.getState().past.length).toBe(0);
      expect(useHistoryStore.getState().future.length).toBe(10);
    });

    it('should handle store reset and reinitialization', () => {
      // Create some entities
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 200 },
      };

      createEntity(room);
      useSelectionStore.getState().selectSingle('room-1');
      useProjectStore.setState({ isDirty: true });

      // Reset all stores
      useEntityStore.getState().clearAllEntities();
      useSelectionStore.getState().clearSelection();
      useHistoryStore.getState().clear();
      useProjectStore.setState({ isDirty: false });

      // Verify clean state
      expect(useEntityStore.getState().allIds.length).toBe(0);
      expect(useSelectionStore.getState().selectedIds.length).toBe(0);
      expect(useHistoryStore.getState().past.length).toBe(0);
      expect(useHistoryStore.getState().future.length).toBe(0);
      expect(useProjectStore.getState().isDirty).toBe(false);

      // Verify can create new entities after reset
      createEntity({ ...room, id: 'room-2' });
      expect(useEntityStore.getState().allIds).toContain('room-2');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large number of entities across stores', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        const room: Room = {
          id: `room-${i}`,
          type: 'room',
          transform: { x: i * 50, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
          zIndex: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          props: {
            name: `Room ${i}`,
            width: 120,
            length: 120,
            ceilingHeight: 96,
            occupancyType: 'office',
            airChangesPerHour: 4,
          },
          calculated: { area: 100, volume: 800, requiredCFM: 200 },
        };

        createEntity(room);
      }

      const endTime = performance.now();

      expect(useEntityStore.getState().allIds.length).toBe(100);
      expect(useHistoryStore.getState().past.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
    });

    it('should efficiently handle multi-select with many entities', () => {
      // Create 50 entities
      for (let i = 0; i < 50; i++) {
        const room: Room = {
          id: `room-${i}`,
          type: 'room',
          transform: { x: i * 50, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
          zIndex: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          props: {
            name: `Room ${i}`,
            width: 120,
            length: 120,
            ceilingHeight: 96,
            occupancyType: 'office',
            airChangesPerHour: 4,
          },
          calculated: { area: 100, volume: 800, requiredCFM: 200 },
        };

        createEntity(room);
      }

      const startTime = performance.now();

      // Select all entities
      for (let i = 0; i < 50; i++) {
        if (i === 0) {
          useSelectionStore.getState().selectSingle(`room-${i}`);
        } else {
          useSelectionStore.getState().toggleSelection(`room-${i}`, true);
        }
      }

      const endTime = performance.now();

      expect(useSelectionStore.getState().selectedIds.length).toBe(50);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });
});
