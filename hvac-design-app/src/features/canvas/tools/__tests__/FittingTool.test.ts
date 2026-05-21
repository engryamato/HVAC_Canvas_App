import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FittingTool } from '../FittingTool';
import { useToolStore } from '@/core/store/canvas.store';
import { useViewportStore } from '../../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { createMockToolEvent, createMockKeyEvent } from './test-utils';

describe('FittingTool', () => {
  let tool: FittingTool;

  function seedActiveFitting(typeId = 'elbow_90') {
    const store = useComponentLibraryStoreV2.getState();
    store.reset();
    store.addEntry({
      id: `fitting-${typeId}`,
      name: typeId === 'tee' ? 'Tee' : '90 Degree Elbow',
      componentClass: 'fitting',
      category: 'fitting',
      categoryId: 'standard_ductwork',
      typeId,
      type: typeId,
      engineeringSystem: 'standard_duct',
      systemType: 'supply',
      source: 'system',
      placeable: true,
      recommendedFittingEntryIds: [],
      recommendedAccessoryEntryIds: [],
      recommendedEquipmentEntryIds: [],
      connectionNotes: [],
      engineeringProperties: {
        frictionFactor: 0.01,
        maxVelocity: 2000,
        minVelocity: 500,
        maxPressureDrop: 0.1,
      },
      pricing: {
        materialCost: 10,
        laborUnits: 1,
        wasteFactor: 0.1,
      },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    store.selectEntry(`fitting-${typeId}`);
  }

  function createMockContext() {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      rect: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      setLineDash: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;
  }

  beforeEach(() => {
    tool = new FittingTool();
    useEntityStore.getState().clearAllEntities();
    useViewportStore.setState({ snapToGrid: true, gridSize: 12 });
    useToolStore.setState({ selectedFittingType: 'elbow_90' });
    seedActiveFitting();
  });

  describe('initialization', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('fitting');
    });

    it('should return crosshair cursor', () => {
      expect(tool.getCursor()).toBe('crosshair');
    });
  });

  describe('mouse interactions', () => {
    it('should create fitting entity on left mouse click', () => {
      const mouseEvent = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseMove(mouseEvent);
      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      expect(entities.length).toBe(1);

      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.type).toBe('fitting');
      expect(entity.transform.x).toBe(96); // Snapped to grid (100 -> 96)
      expect(entity.transform.y).toBe(96);
    });

    it('should ignore right mouse click', () => {
      const mouseEvent = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
        button: 2, // Right click
      });

      tool.onMouseMove(mouseEvent);
      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      expect(entities.length).toBe(0);
    });

    it('should snap to grid when enabled', () => {
      useViewportStore.setState({ snapToGrid: true, gridSize: 24 });

      const mouseEvent = createMockToolEvent({
        x: 50,
        y: 50,
        screenX: 50,
        screenY: 50,
      });

      tool.onMouseMove(mouseEvent);
      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.transform.x).toBe(48); // Snapped to 24px grid
      expect(entity.transform.y).toBe(48);
    });

    it('should not snap to grid when disabled', () => {
      useViewportStore.setState({ snapToGrid: false });

      const mouseEvent = createMockToolEvent({
        x: 50,
        y: 50,
        screenX: 50,
        screenY: 50,
      });

      tool.onMouseMove(mouseEvent);
      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.transform.x).toBe(50);
      expect(entity.transform.y).toBe(50);
    });

    it('should create fitting with selected type', () => {
      useToolStore.setState({ selectedFittingType: 'tee' });
      seedActiveFitting('tee');

      const mouseEvent = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseMove(mouseEvent);
      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.type).toBe('fitting');
      if (entity.type === 'fitting') {
        expect(entity.props.fittingType).toBe('tee');
      }
    });
  });

  describe('keyboard interactions', () => {
    it('should reset state on Escape key', () => {
      const mouseMove = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseMove(mouseMove);

      const keyEvent = createMockKeyEvent({
        key: 'Escape',
        code: 'Escape',
      });

      tool.onKeyDown(keyEvent);

      // After Escape, the preview should be cleared
      // We can verify this by checking that render doesn't draw anything
      const mockCtx = createMockContext();

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });

      // Escape clears placement mode but leaves a short cancel ghost.
      expect(mockCtx.translate).toHaveBeenCalledWith(96, 96);
    });
  });

  describe('activation/deactivation', () => {
    it('should reset state on activate', () => {
      tool.onActivate();
      // Should not throw and should initialize cleanly
      expect(tool).toBeDefined();
    });

    it('should reset state on deactivate', () => {
      const mouseMove = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseMove(mouseMove);
      tool.onDeactivate();

      // State should be cleared after deactivation
      const mockCtx = createMockContext();

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });
      expect(mockCtx.save).not.toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should render preview when mouse is moved', () => {
      const mouseMove = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseMove(mouseMove);

      const mockCtx = createMockContext();

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should not render when no preview exists', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });

      expect(mockCtx.save).not.toHaveBeenCalled();
    });
  });
});
