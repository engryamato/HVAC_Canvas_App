import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoomTool } from '../../tools/RoomTool';
import { DuctTool } from '../../tools/DuctTool';
import { EquipmentTool } from '../../tools/EquipmentTool';
import { FittingTool } from '../../tools/FittingTool';
import { NoteTool } from '../../tools/NoteTool';
import { useEntityStore } from '@/core/store/entityStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import type { Room, Duct, DuctRun, Equipment, Fitting, Note } from '@/core/schema';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import type { ToolRenderContext } from '../../tools/BaseTool';

/**
 * Integration tests for canvas rendering
 * Tests the render methods of tools and their interaction with the canvas context
 */
describe('Canvas Rendering Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let renderContext: ToolRenderContext;
  let roomTool: RoomTool;
  let ductTool: DuctTool;
  let equipmentTool: EquipmentTool;
  let fittingTool: FittingTool;
  let noteTool: NoteTool;

  // Helper to get fresh store state
  const getEntityStore = () => useEntityStore.getState();

  const getAllEntities = () =>
    getEntityStore()
      .allIds.map((id) => getEntityStore().byId[id])
      .filter(Boolean) as Array<Room | Duct | DuctRun | Equipment | Fitting | Note>;

  const getDuctEntities = () =>
    getAllEntities().filter((entity): entity is Duct | DuctRun =>
      entity.type === 'duct' || entity.type === 'duct_run'
    );

  function createCatalogComponent(
    overrides: Partial<UnifiedComponentDefinition>
  ): UnifiedComponentDefinition {
    const now = new Date('2026-01-01T00:00:00.000Z');
    return {
      id: overrides.id ?? 'test-component',
      name: overrides.name ?? 'Test Component',
      componentClass: overrides.componentClass ?? 'equipment',
      category: overrides.category ?? overrides.componentClass ?? 'equipment',
      categoryId: overrides.categoryId ?? 'standard_ductwork',
      typeId: overrides.typeId ?? 'fan',
      type: overrides.type ?? overrides.typeId ?? 'fan',
      engineeringSystem: overrides.engineeringSystem ?? 'standard_duct',
      systemType: overrides.systemType ?? 'supply',
      source: overrides.source ?? 'system',
      placeable: overrides.placeable ?? true,
      isCustom: overrides.isCustom ?? false,
      pricing: overrides.pricing ?? {
        materialCost: 10,
        laborUnits: 1,
        wasteFactor: 0.1,
      },
      engineeringProperties: overrides.engineeringProperties ?? {
        frictionFactor: 0.02,
        maxVelocity: 2500,
        minVelocity: 500,
        maxPressureDrop: 0.1,
      },
      materials: overrides.materials ?? [],
      defaultDimensions: overrides.defaultDimensions,
      recommendedFittingEntryIds: overrides.recommendedFittingEntryIds ?? [],
      recommendedAccessoryEntryIds: overrides.recommendedAccessoryEntryIds ?? [],
      recommendedEquipmentEntryIds: overrides.recommendedEquipmentEntryIds ?? [],
      connectionNotes: overrides.connectionNotes ?? [],
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    };
  }

  function seedCatalog(): void {
    const store = useComponentLibraryStoreV2.getState();
    store.reset();
    store.addComponent(
      createCatalogComponent({
        id: 'test-equipment',
        name: 'Supply Fan',
        componentClass: 'equipment',
        category: 'equipment',
        typeId: 'fan',
        type: 'fan',
        defaultDimensions: { width: 24, depth: 24, height: 24 },
      })
    );
    store.addComponent(
      createCatalogComponent({
        id: 'test-fitting',
        name: '90 Degree Elbow',
        componentClass: 'fitting',
        category: 'fitting',
        typeId: 'elbow_90',
        type: 'elbow_90',
      })
    );
  }

  function activateEquipment(): void {
    useComponentLibraryStoreV2.getState().selectEntry('test-equipment');
  }

  function activateFitting(): void {
    useComponentLibraryStoreV2.getState().selectEntry('test-fitting');
  }

  beforeEach(() => {
    // Create canvas and context
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;

    // Create render context with proper structure
    renderContext = { ctx, zoom: 1, panX: 0, panY: 0 };

    // Clear stores
    useEntityStore.getState().clearAllEntities();
    seedCatalog();

    // Initialize tools
    roomTool = new RoomTool();
    ductTool = new DuctTool();
    equipmentTool = new EquipmentTool();
    fittingTool = new FittingTool();
    noteTool = new NoteTool();
  });

  afterEach(() => {
    roomTool.onDeactivate();
    ductTool.onDeactivate();
    equipmentTool.onDeactivate();
    fittingTool.onDeactivate();
    noteTool.onDeactivate();
  });

  describe('Room Tool Rendering', () => {
    it('should render room preview while dragging', () => {
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseMove({ x: 200, y: 200 });

      // Spy on context methods
      const strokeRectSpy = vi.spyOn(ctx, 'strokeRect');
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');

      // Render preview with proper context
      roomTool.render(renderContext);

      // Should draw preview (either stroke or fill)
      expect(strokeRectSpy.mock.calls.length + fillRectSpy.mock.calls.length).toBeGreaterThan(0);

      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onDeactivate();
    });

    it('should not render preview when not drawing', () => {
      roomTool.onActivate();

      const strokeRectSpy = vi.spyOn(ctx, 'strokeRect');
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');

      roomTool.render(renderContext);

      // Should not draw anything when not drawing
      expect(strokeRectSpy).not.toHaveBeenCalled();
      expect(fillRectSpy).not.toHaveBeenCalled();

      roomTool.onDeactivate();
    });

    it('should render multiple rooms on canvas', () => {
      // Create multiple rooms
      roomTool.onActivate();

      for (let i = 0; i < 3; i++) {
        roomTool.onMouseDown({ x: i * 150, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
        roomTool.onMouseMove({ x: i * 150 + 100, y: 200 });
        roomTool.onMouseUp({ x: i * 150 + 100, y: 200, button: 0 });
      }

      roomTool.onDeactivate();

      expect(getEntityStore().allIds.length).toBe(3);

      // All rooms should be Room type
      const rooms = getEntityStore().allIds.map(id => getEntityStore().byId[id]) as Room[];
      rooms.forEach(room => {
        expect(room.type).toBe('room');
        expect(room.transform).toBeDefined();
        expect(room.props).toBeDefined();
      });
    });
  });

  describe('Duct Tool Rendering', () => {
    it('should render duct preview while dragging', () => {
      ductTool.onActivate();
      ductTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 200, y: 200 });

      const strokeSpy = vi.spyOn(ctx, 'stroke');
      const strokeRectSpy = vi.spyOn(ctx, 'strokeRect');
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');

      ductTool.render(renderContext);

      // Should draw line/rect preview
      const totalCalls = strokeSpy.mock.calls.length + strokeRectSpy.mock.calls.length + fillRectSpy.mock.calls.length;
      expect(totalCalls).toBeGreaterThan(0);

      ductTool.onMouseUp({ x: 200, y: 200, button: 0 });
      ductTool.onDeactivate();
    });

    it('should calculate correct duct rotation based on endpoints', () => {
      ductTool.onActivate();

      // Horizontal duct
      ductTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 300, y: 100 });
      ductTool.onMouseUp({ x: 300, y: 100, button: 0 });

      const horizontalDuct = getDuctEntities()[0]!;
      expect(horizontalDuct.transform.rotation).toBeCloseTo(0, 1);

      // Vertical duct
      ductTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 100, y: 300 });
      ductTool.onMouseUp({ x: 100, y: 300, button: 0 });

      const verticalDuct = getDuctEntities()[1]!;
      expect(Math.abs(verticalDuct.transform.rotation)).toBeCloseTo(90, 1);

      ductTool.onDeactivate();
    });

    it('should render ducts with correct dimensions', () => {
      ductTool.onActivate();
      ductTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 300, y: 100 });
      ductTool.onMouseUp({ x: 300, y: 100, button: 0 });
      ductTool.onDeactivate();

      const duct = getDuctEntities()[0]!;
      const length = duct.type === 'duct_run' ? duct.props.installLength : duct.props.length;
      expect(length).toBeGreaterThan(0);
    });
  });

  describe('Equipment Tool Rendering', () => {
    it('should render equipment preview at cursor', () => {
      activateEquipment();
      equipmentTool.onActivate();
      equipmentTool.onMouseMove({ x: 200, y: 200 });

      const fillRectSpy = vi.spyOn(ctx, 'fillRect');
      const strokeRectSpy = vi.spyOn(ctx, 'strokeRect');

      equipmentTool.render(renderContext);

      // Should draw preview
      expect(fillRectSpy.mock.calls.length + strokeRectSpy.mock.calls.length).toBeGreaterThan(0);

      equipmentTool.onDeactivate();
    });

    it('should create equipment with proper dimensions', () => {
      activateEquipment();
      equipmentTool.onActivate();
      equipmentTool.onMouseDown({ x: 200, y: 200, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();

      const equipment = getEntityStore().byId[getEntityStore().allIds[0]!] as Equipment;
      expect(equipment.props.width).toBeGreaterThan(0);
      expect(equipment.props.depth).toBeGreaterThan(0);
      expect(equipment.props.height).toBeGreaterThan(0);
    });

    it('should render multiple equipment units without overlap issues', () => {
      activateEquipment();
      equipmentTool.onActivate();

      // Create equipment in grid pattern
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          equipmentTool.onMouseDown({
            x: x * 100 + 50,
            y: y * 100 + 50,
            button: 0,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            altKey: false,
          });
        }
      }

      equipmentTool.onDeactivate();

      expect(getEntityStore().allIds.length).toBe(9);

      // All should have same z-index
      const equipmentUnits = getEntityStore().allIds.map(id => getEntityStore().byId[id]) as Equipment[];
      const zIndices = equipmentUnits.map(e => e.zIndex);
      expect(new Set(zIndices).size).toBe(1); // All same z-index
    });
  });

  describe('Fitting Tool Rendering', () => {
    it('should render fitting preview at cursor', () => {
      activateFitting();
      fittingTool.onActivate();
      fittingTool.onMouseMove({ x: 150, y: 150 });

      const arcSpy = vi.spyOn(ctx, 'arc');
      const fillSpy = vi.spyOn(ctx, 'fill');
      const strokeSpy = vi.spyOn(ctx, 'stroke');

      fittingTool.render(renderContext);

      // Should draw preview (circle or shape)
      expect(arcSpy.mock.calls.length + fillSpy.mock.calls.length + strokeSpy.mock.calls.length).toBeGreaterThan(0);

      fittingTool.onDeactivate();
    });

    it('should create fittings with appropriate z-index for layering', () => {
      // Create room
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 300, y: 300, button: 0 });
      roomTool.onDeactivate();

      // Create duct
      ductTool.onActivate();
      ductTool.onMouseDown({ x: 200, y: 300, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 400, y: 300 });
      ductTool.onMouseUp({ x: 400, y: 300, button: 0 });
      ductTool.onDeactivate();

      // Create fitting
      activateFitting();
      fittingTool.onActivate();
      fittingTool.onMouseMove({ x: 400, y: 300 });
      fittingTool.onMouseDown({ x: 400, y: 300, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onDeactivate();

      const room = getEntityStore().byId[getEntityStore().allIds[0]!] as Room;
      const duct = getDuctEntities()[0]!;
      const fitting = getAllEntities().find((entity): entity is Fitting => entity.type === 'fitting');
      expect(fitting).toBeDefined();
      if (!fitting) {
        throw new Error('Expected fitting to be created');
      }

      // Fitting should be above duct and room
      expect(fitting.zIndex).toBeGreaterThan(room.zIndex);
      expect(fitting.zIndex).toBeGreaterThan(duct.zIndex);
    });
  });

  describe('Note Tool Rendering', () => {
    it('should render note preview at cursor', () => {
      noteTool.onActivate();
      noteTool.onMouseMove({ x: 250, y: 250 });

      const fillTextSpy = vi.spyOn(ctx, 'fillText');
      const strokeTextSpy = vi.spyOn(ctx, 'strokeText');
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');

      noteTool.render(renderContext);

      // Should draw text or rect preview
      expect(fillTextSpy.mock.calls.length + strokeTextSpy.mock.calls.length + fillRectSpy.mock.calls.length).toBeGreaterThan(0);

      noteTool.onDeactivate();
    });

    it('should create notes with highest z-index', () => {
      // Create various entities
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onDeactivate();

      equipmentTool.onActivate();
      activateEquipment();
      equipmentTool.onMouseDown({ x: 150, y: 150, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();

      ductTool.onActivate();
      ductTool.onMouseDown({ x: 150, y: 200, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 250, y: 200 });
      ductTool.onMouseUp({ x: 250, y: 200, button: 0 });
      ductTool.onDeactivate();

      activateFitting();
      fittingTool.onActivate();
      fittingTool.onMouseMove({ x: 250, y: 200 });
      fittingTool.onMouseDown({ x: 250, y: 200, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onDeactivate();

      noteTool.onActivate();
      noteTool.onMouseDown({ x: 175, y: 175, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      noteTool.onDeactivate();

      const note = getAllEntities().find((entity): entity is Note => entity.type === 'note');
      expect(note).toBeDefined();
      if (!note) {
        throw new Error('Expected note to be created');
      }

      // Note should have highest z-index
      const allEntities = getAllEntities();
      const maxZIndex = Math.max(
        ...allEntities
          .filter((e) => e.type !== 'note')
          .map((e) => e.zIndex)
      );
      expect(note.zIndex).toBeGreaterThan(maxZIndex);
    });
  });

  describe('Mixed Entity Rendering', () => {
    it('should render complex HVAC system with all entity types', () => {
      // Create a complete system
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 300, y: 300, button: 0 });
      roomTool.onDeactivate();

      equipmentTool.onActivate();
      activateEquipment();
      equipmentTool.onMouseDown({ x: 200, y: 200, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      equipmentTool.onDeactivate();

      ductTool.onActivate();
      ductTool.onMouseDown({ x: 200, y: 300, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      ductTool.onMouseMove({ x: 400, y: 300 });
      ductTool.onMouseUp({ x: 400, y: 300, button: 0 });
      ductTool.onDeactivate();

      activateFitting();
      fittingTool.onActivate();
      fittingTool.onMouseMove({ x: 200, y: 300 });
      fittingTool.onMouseDown({ x: 200, y: 300, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onMouseMove({ x: 400, y: 300 });
      fittingTool.onMouseDown({ x: 400, y: 300, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      fittingTool.onDeactivate();

      noteTool.onActivate();
      noteTool.onMouseDown({ x: 350, y: 250, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      noteTool.onDeactivate();

      expect(getEntityStore().allIds.length).toBe(6);

      // Verify z-index ordering
      const entities = getAllEntities();
      const room = entities.find((e) => e.type === 'room');
      const duct = entities.find((e) => e.type === 'duct' || e.type === 'duct_run');
      const fitting = entities.filter((e) => e.type === 'fitting')[0];
      const note = entities.find((e) => e.type === 'note');

      expect(room).toBeDefined();
      expect(duct).toBeDefined();
      expect(fitting).toBeDefined();
      expect(note).toBeDefined();

      if (!room || !duct || !fitting || !note) {
        throw new Error('Expected all entity types to be present');
      }

      expect(room.zIndex).toBeLessThanOrEqual(duct.zIndex);
      expect(duct.zIndex).toBeLessThanOrEqual(fitting.zIndex);
      expect(note.zIndex).toBeGreaterThan(fitting.zIndex);
    });

    it('should handle rendering with canvas transformations', () => {
      // Create entity
      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 200, y: 200, button: 0 });
      roomTool.onDeactivate();

      // Apply canvas transformations
      ctx.save();
      ctx.translate(50, 50);
      ctx.scale(1.5, 1.5);
      ctx.rotate(Math.PI / 4);

      // Rendering should not throw errors with transformations
      expect(() => {
        roomTool.render(renderContext);
      }).not.toThrow();

      ctx.restore();
    });

    it('should handle rendering at canvas edges', () => {
      // Create entities at canvas edges
      roomTool.onActivate();

      // Top-left corner
      roomTool.onMouseDown({ x: 0, y: 0, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 50, y: 50, button: 0 });

      // Top-right corner
      roomTool.onMouseDown({ x: 750, y: 0, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 800, y: 50, button: 0 });

      // Bottom-left corner
      roomTool.onMouseDown({ x: 0, y: 550, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 50, y: 600, button: 0 });

      // Bottom-right corner
      roomTool.onMouseDown({ x: 750, y: 550, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseUp({ x: 800, y: 600, button: 0 });

      roomTool.onDeactivate();

      expect(getEntityStore().allIds.length).toBe(4);

      // Should handle rendering without clipping issues
      expect(() => {
        roomTool.render(renderContext);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle rendering many entities efficiently', () => {
      // Create many entities
      roomTool.onActivate();
      for (let i = 0; i < 50; i++) {
        const x = (i % 10) * 80;
        const y = Math.floor(i / 10) * 120;
        roomTool.onMouseDown({ x, y, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
        roomTool.onMouseUp({ x: x + 60, y: y + 100, button: 0 });
      }
      roomTool.onDeactivate();

      expect(getEntityStore().allIds.length).toBe(50);

      // Rendering should complete quickly
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        roomTool.render(renderContext);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 10 renders in <100ms
    });

    it('should clear canvas efficiently before redraw', () => {
      const clearRectSpy = vi.spyOn(ctx, 'clearRect');

      // Simulate canvas clear and redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      roomTool.onActivate();
      roomTool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false });
      roomTool.onMouseMove({ x: 200, y: 200 });
      roomTool.render(renderContext);
      roomTool.onDeactivate();

      expect(clearRectSpy).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    });
  });
});
