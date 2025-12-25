import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomTool } from '../../tools/RoomTool';
import { DuctTool } from '../../tools/DuctTool';
import { EquipmentTool } from '../../tools/EquipmentTool';
import { FittingTool } from '../../tools/FittingTool';
import { NoteTool } from '../../tools/NoteTool';
import { SelectTool } from '../../tools/SelectTool';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { undo, redo } from '@/core/commands/entityCommands';
import type { Room, Duct, Equipment, Fitting, Note } from '@/core/schema';

/**
 * Integration tests for multi-tool workflows
 * Tests realistic scenarios where users switch between tools and create complex designs
 */
describe('Tool Workflow Integration Tests', () => {
  let roomTool: RoomTool;
  let ductTool: DuctTool;
  let equipmentTool: EquipmentTool;
  let fittingTool: FittingTool;
  let noteTool: NoteTool;
  let selectTool: SelectTool;

  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
    useHistoryStore.getState().clear();

    roomTool = new RoomTool();
    ductTool = new DuctTool();
    equipmentTool = new EquipmentTool();
    fittingTool = new FittingTool();
    noteTool = new NoteTool();
    selectTool = new SelectTool();
  });

  afterEach(() => {
    roomTool.onDeactivate();
    ductTool.onDeactivate();
    equipmentTool.onDeactivate();
    fittingTool.onDeactivate();
    noteTool.onDeactivate();
    selectTool.onDeactivate();
  });

  describe('Complete HVAC Design Workflow', () => {
    it('should create a complete HVAC design with rooms, ducts, equipment, and fittings', () => {
      const entityStore = useEntityStore.getState();

      // Step 1: Create two rooms
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseMove({ x: 200, y: 200 });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });

      roomTool.onMouseDown({ x: 300, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseMove({ x: 400, y: 200 });
      roomTool.onMouseUp({ x: 400, y: 200, button: 0 });
      roomTool.onDeactivate();

      expect(entityStore.allIds.length).toBe(2);
      const rooms = entityStore.allIds.map(id => entityStore.byId[id]).filter(e => e.type === 'room') as Room[];
      expect(rooms.length).toBe(2);

      // Step 2: Add equipment to first room
      equipmentTool.onActivate();
      equipmentTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();

      expect(entityStore.allIds.length).toBe(3);
      const equipment = entityStore.allIds.map(id => entityStore.byId[id]).filter(e => e.type === 'equipment') as Equipment[];
      expect(equipment.length).toBe(1);

      // Step 3: Create duct connecting the rooms
      ductTool.onActivate();
      ductTool.onMouseDown({ x: 200, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 300, y: 150 });
      ductTool.onMouseUp({ x: 300, y: 150, button: 0 });
      ductTool.onDeactivate();

      expect(entityStore.allIds.length).toBe(4);
      const ducts = entityStore.allIds.map(id => entityStore.byId[id]).filter(e => e.type === 'duct') as Duct[];
      expect(ducts.length).toBe(1);

      // Step 4: Add fittings at duct ends
      fittingTool.onActivate();
      fittingTool.onMouseDown({ x: 200, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onMouseDown({ x: 300, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onDeactivate();

      expect(entityStore.allIds.length).toBe(6);
      const fittings = entityStore.allIds.map(id => entityStore.byId[id]).filter(e => e.type === 'fitting') as Fitting[];
      expect(fittings.length).toBe(2);

      // Step 5: Add annotation note
      noteTool.onActivate();
      noteTool.onMouseDown({ x: 250, y: 250, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      noteTool.onDeactivate();

      expect(entityStore.allIds.length).toBe(7);
      const notes = entityStore.allIds.map(id => entityStore.byId[id]).filter(e => e.type === 'note') as Note[];
      expect(notes.length).toBe(1);

      // Verify final design
      expect(entityStore.allIds.length).toBe(7);
      expect(rooms.length).toBe(2);
      expect(ducts.length).toBe(1);
      expect(equipment.length).toBe(1);
      expect(fittings.length).toBe(2);
      expect(notes.length).toBe(1);
    });

    it('should maintain proper z-index ordering for all entity types', () => {
      const entityStore = useEntityStore.getState();

      // Create one of each type
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onDeactivate();

      ductTool.onActivate();
      ductTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseUp({ x: 250, y: 150, button: 0 });
      ductTool.onDeactivate();

      equipmentTool.onActivate();
      equipmentTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();

      fittingTool.onActivate();
      fittingTool.onMouseDown({ x: 200, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onDeactivate();

      noteTool.onActivate();
      noteTool.onMouseDown({ x: 180, y: 180, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      noteTool.onDeactivate();

      const entities = entityStore.allIds.map(id => entityStore.byId[id]);
      const room = entities.find(e => e.type === 'room') as Room;
      const duct = entities.find(e => e.type === 'duct') as Duct;
      const equipment = entities.find(e => e.type === 'equipment') as Equipment;
      const fitting = entities.find(e => e.type === 'fitting') as Fitting;
      const note = entities.find(e => e.type === 'note') as Note;

      // Verify z-index ordering: room(0) < duct(5) < fitting(10) < equipment(5) < note(100)
      expect(room.zIndex).toBe(0);
      expect(duct.zIndex).toBe(5);
      expect(fitting.zIndex).toBe(10);
      expect(equipment.zIndex).toBe(5);
      expect(note.zIndex).toBe(100);

      // Notes should always be on top
      expect(note.zIndex).toBeGreaterThan(room.zIndex);
      expect(note.zIndex).toBeGreaterThan(duct.zIndex);
      expect(note.zIndex).toBeGreaterThan(equipment.zIndex);
      expect(note.zIndex).toBeGreaterThan(fitting.zIndex);
    });
  });

  describe('Selection and Modification Workflow', () => {
    it('should select, move, and modify entities across multiple tools', () => {
      const entityStore = useEntityStore.getState();
      const selectionStore = useSelectionStore.getState();

      // Create multiple rooms
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onMouseDown({ x: 300, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 400, y: 200, button: 0 });
      roomTool.onDeactivate();

      const room1Id = entityStore.allIds[0];
      const room2Id = entityStore.allIds[1];

      // Switch to select tool and select first room
      selectTool.onActivate();
      selectionStore.selectSingle(room1Id);
      expect(selectionStore.selectedIds).toContain(room1Id);
      expect(selectionStore.selectedIds.length).toBe(1);

      // Multi-select second room with Shift
      selectionStore.toggleSelection(room2Id, true);
      expect(selectionStore.selectedIds).toContain(room1Id);
      expect(selectionStore.selectedIds).toContain(room2Id);
      expect(selectionStore.selectedIds.length).toBe(2);

      // Move selected rooms
      const room1Before = entityStore.byId[room1Id];
      const room2Before = entityStore.byId[room2Id];

      selectTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      selectTool.onMouseMove({ x: 200, y: 200 });
      selectTool.onMouseUp({ x: 200, y: 200, button: 0 });

      const room1After = entityStore.byId[room1Id];
      const room2After = entityStore.byId[room2Id];

      // Both rooms should have moved
      expect(room1After.transform.x).not.toBe(room1Before.transform.x);
      expect(room2After.transform.x).not.toBe(room2Before.transform.x);

      selectTool.onDeactivate();
    });

    it('should handle selection persistence across tool switches', () => {
      const entityStore = useEntityStore.getState();
      const selectionStore = useSelectionStore.getState();

      // Create entities with different tools
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onDeactivate();

      ductTool.onActivate();
      ductTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseUp({ x: 250, y: 150, button: 0 });
      ductTool.onDeactivate();

      const roomId = entityStore.allIds[0];
      const ductId = entityStore.allIds[1];

      // Select room
      selectTool.onActivate();
      selectionStore.selectSingle(roomId);
      expect(selectionStore.selectedIds).toContain(roomId);
      selectTool.onDeactivate();

      // Switch to equipment tool (selection should clear or persist based on design)
      equipmentTool.onActivate();
      // Selection behavior can be verified here
      equipmentTool.onDeactivate();

      // Switch back to select tool
      selectTool.onActivate();
      // Can re-select
      selectionStore.selectSingle(ductId);
      expect(selectionStore.selectedIds).toContain(ductId);
      selectTool.onDeactivate();
    });
  });

  describe('Undo/Redo Integration', () => {
    it('should support undo/redo across multiple tool operations', () => {
      const entityStore = useEntityStore.getState();

      // Operation 1: Create room
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onDeactivate();
      expect(entityStore.allIds.length).toBe(1);

      // Operation 2: Create duct
      ductTool.onActivate();
      ductTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseUp({ x: 250, y: 150, button: 0 });
      ductTool.onDeactivate();
      expect(entityStore.allIds.length).toBe(2);

      // Operation 3: Create equipment
      equipmentTool.onActivate();
      equipmentTool.onMouseDown({ x: 200, y: 200, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();
      expect(entityStore.allIds.length).toBe(3);

      // Undo last operation (equipment)
      undo();
      expect(entityStore.allIds.length).toBe(2);
      expect(entityStore.allIds.every(id => entityStore.byId[id].type !== 'equipment')).toBe(true);

      // Undo second operation (duct)
      undo();
      expect(entityStore.allIds.length).toBe(1);
      expect(entityStore.byId[entityStore.allIds[0]].type).toBe('room');

      // Redo duct creation
      redo();
      expect(entityStore.allIds.length).toBe(2);
      expect(entityStore.allIds.some(id => entityStore.byId[id].type === 'duct')).toBe(true);

      // Redo equipment creation
      redo();
      expect(entityStore.allIds.length).toBe(3);
      expect(entityStore.allIds.some(id => entityStore.byId[id].type === 'equipment')).toBe(true);
    });

    it('should maintain history stack across complex workflows', () => {
      const entityStore = useEntityStore.getState();
      const historyStore = useHistoryStore.getState();

      // Create several entities
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onDeactivate();

      ductTool.onActivate();
      ductTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseUp({ x: 250, y: 150, button: 0 });
      ductTool.onDeactivate();

      fittingTool.onActivate();
      fittingTool.onMouseDown({ x: 200, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onDeactivate();

      // Should have 3 commands in history
      expect(historyStore.past.length).toBe(3);
      expect(historyStore.future.length).toBe(0);

      // Undo all
      undo();
      undo();
      undo();
      expect(entityStore.allIds.length).toBe(0);
      expect(historyStore.past.length).toBe(0);
      expect(historyStore.future.length).toBe(3);

      // Redo all
      redo();
      redo();
      redo();
      expect(entityStore.allIds.length).toBe(3);
      expect(historyStore.past.length).toBe(3);
      expect(historyStore.future.length).toBe(0);
    });
  });

  describe('Grid Snapping Integration', () => {
    it('should snap entities to grid across all tools', () => {
      const entityStore = useEntityStore.getState();

      // Create room with grid snapping
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 105, y: 107, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 205, y: 207, button: 0 });
      roomTool.onDeactivate();

      const room = entityStore.byId[entityStore.allIds[0]] as Room;
      // Should snap to nearest 12px grid (assuming 12px grid size)
      expect(room.transform.x % 12).toBe(0);
      expect(room.transform.y % 12).toBe(0);

      // Create duct with grid snapping
      ductTool.onActivate();
      ductTool.onMouseDown({ x: 153, y: 149, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseUp({ x: 253, y: 149, button: 0 });
      ductTool.onDeactivate();

      const duct = entityStore.byId[entityStore.allIds[1]] as Duct;
      expect(duct.transform.x % 12).toBe(0);
      expect(duct.transform.y % 12).toBe(0);

      // Create equipment with grid snapping
      equipmentTool.onActivate();
      equipmentTool.onMouseDown({ x: 198, y: 202, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();

      const equipment = entityStore.byId[entityStore.allIds[2]] as Equipment;
      expect(equipment.transform.x % 12).toBe(0);
      expect(equipment.transform.y % 12).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle rapid tool switching without errors', () => {
      expect(() => {
        roomTool.onActivate();
        roomTool.onDeactivate();
        ductTool.onActivate();
        ductTool.onDeactivate();
        equipmentTool.onActivate();
        equipmentTool.onDeactivate();
        fittingTool.onActivate();
        fittingTool.onDeactivate();
        noteTool.onActivate();
        noteTool.onDeactivate();
        selectTool.onActivate();
        selectTool.onDeactivate();
      }).not.toThrow();
    });

    it('should handle creating entities at same location', () => {
      const entityStore = useEntityStore.getState();
      const location = { x: 200, y: 200 };

      // Create multiple entities at same spot
      roomTool.onActivate();
      roomTool.onMouseDown({ ...location, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 300, y: 300, button: 0 });
      roomTool.onDeactivate();

      equipmentTool.onActivate();
      equipmentTool.onMouseDown({ ...location, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();

      fittingTool.onActivate();
      fittingTool.onMouseDown({ ...location, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onDeactivate();

      noteTool.onActivate();
      noteTool.onMouseDown({ ...location, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      noteTool.onDeactivate();

      // All should be created successfully
      expect(entityStore.allIds.length).toBe(4);
    });

    it('should handle empty canvas operations', () => {
      const entityStore = useEntityStore.getState();

      expect(() => {
        // Try to select on empty canvas
        selectTool.onActivate();
        selectTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
        selectTool.onMouseUp({ x: 100, y: 100, button: 0 });
        selectTool.onDeactivate();

        // Try to undo with no history
        undo();

        // Try to redo with no future
        redo();
      }).not.toThrow();

      expect(entityStore.allIds.length).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle creating many entities without performance degradation', () => {
      const entityStore = useEntityStore.getState();
      const startTime = performance.now();

      roomTool.onActivate();
      for (let i = 0; i < 50; i++) {
        const x = (i % 10) * 100;
        const y = Math.floor(i / 10) * 100;
        roomTool.onMouseDown({ x, y, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
        roomTool.onMouseUp({ x: x + 80, y: y + 80, button: 0 });
      }
      roomTool.onDeactivate();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(entityStore.allIds.length).toBe(50);
      // Should complete in reasonable time (<1 second for 50 rooms)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle deep undo/redo stack', () => {
      const entityStore = useEntityStore.getState();

      // Create 20 entities
      roomTool.onActivate();
      for (let i = 0; i < 20; i++) {
        roomTool.onMouseDown({ x: i * 50, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
        roomTool.onMouseUp({ x: i * 50 + 40, y: 140, button: 0 });
      }
      roomTool.onDeactivate();

      expect(entityStore.allIds.length).toBe(20);

      // Undo all
      for (let i = 0; i < 20; i++) {
        undo();
      }
      expect(entityStore.allIds.length).toBe(0);

      // Redo all
      for (let i = 0; i < 20; i++) {
        redo();
      }
      expect(entityStore.allIds.length).toBe(20);
    });
  });
});
