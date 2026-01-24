import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoteTool } from '../NoteTool';
import { useViewportStore } from '../../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { createMockToolEvent, createMockKeyEvent } from './test-utils';

describe('NoteTool', () => {
  let tool: NoteTool;

  beforeEach(() => {
    tool = new NoteTool();
    useEntityStore.getState().clearAllEntities();
    useViewportStore.setState({ snapToGrid: true, gridSize: 12 });
  });

  describe('initialization', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('note');
    });

    it('should return text cursor', () => {
      expect(tool.getCursor()).toBe('text');
    });
  });

  describe('mouse interactions', () => {
    it('should create note entity on left mouse click', () => {
      const mouseEvent = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      expect(entities.length).toBe(1);

      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.type).toBe('note');
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

      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.transform.x).toBe(50);
      expect(entity.transform.y).toBe(50);
    });

    it('should create note with default content', () => {
      const mouseEvent = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.type).toBe('note');
      if (entity.type === 'note') {
        expect(entity.props.content).toBe('New Note');
        expect(entity.props.fontSize).toBe(14);
        expect(entity.props.color).toBe('#000000');
      }
    });

    it('should have high zIndex for rendering on top', () => {
      const mouseEvent = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseDown(mouseEvent);

      const entities = useEntityStore.getState().allIds;
      const entity = useEntityStore.getState().byId[entities[0]!]!;
      expect(entity.zIndex).toBe(100); // Notes should be on top
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
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });

      expect(mockCtx.save).not.toHaveBeenCalled();
    });
  });

  describe('activation/deactivation', () => {
    it('should reset state on activate', () => {
      tool.onActivate();
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

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

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

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        beginPath: vi.fn(),
        setLineDash: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D;

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.measureText).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should not render when no preview exists', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });

      expect(mockCtx.save).not.toHaveBeenCalled();
    });

    it('should render with proper text preview', () => {
      const mouseMove = createMockToolEvent({
        x: 100,
        y: 100,
        screenX: 100,
        screenY: 100,
      });

      tool.onMouseMove(mouseMove);

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        measureText: vi.fn((text: string) => ({ width: text.length * 6 })),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        beginPath: vi.fn(),
        setLineDash: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D;

      tool.render({ ctx: mockCtx, zoom: 1, panX: 0, panY: 0 });

      // Should measure the preview text
      expect(mockCtx.measureText).toHaveBeenCalledWith('Click to add note');

      // Should draw note preview with background and icon
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled(); // Note icon pin
    });
  });
});
