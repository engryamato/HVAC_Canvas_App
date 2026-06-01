import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentTool } from '../EquipmentTool';
import type { ToolMouseEvent, ToolKeyEvent } from '../BaseTool';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockSetTool = vi.fn();
const mockSetEquipmentPlacementDialogOpen = vi.fn();
const mockSetEquipmentPlacementDraft = vi.fn();
const mockSetStatusMessage = vi.fn();
const mockCreateEntity = vi.fn();
const mockValidateAndRecord = vi.fn();
const mockCreateEquipment = vi.fn();

vi.mock('@/core/store/canvas.store', () => ({
  useToolStore: {
    getState: vi.fn(),
  },
}));

vi.mock('@/features/canvas/store/viewportStore', () => ({
  useViewportStore: {
    getState: vi.fn(),
  },
}));

vi.mock('@/core/commands/entityCommands', () => ({
  createEntity: (...args: unknown[]) => mockCreateEntity(...args),
  validateAndRecord: (...args: unknown[]) => mockValidateAndRecord(...args),
}));

vi.mock('@/features/canvas/entities/equipmentDefaults', () => ({
  createEquipment: (...args: unknown[]) => mockCreateEquipment(...args),
}));

import { useToolStore } from '@/core/store/canvas.store';
import { useViewportStore } from '@/features/canvas/store/viewportStore';

const mockToolStore = vi.mocked(useToolStore);
const mockViewportStore = vi.mocked(useViewportStore);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDraft(overrides = {}) {
  return {
    catalogEntryId: null,
    name: 'AHU-1',
    equipmentType: 'air_handler',
    equipmentCategory: 'air_handling',
    manufacturer: '',
    model: '',
    locationTag: '',
    capacity: 10000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 48,
    depth: 60,
    height: 48,
    engineeringSystem: 'standard_duct',
    ...overrides,
  };
}

function buildViewportState(overrides = {}) {
  return {
    snapToGrid: false,
    gridSize: 12,
    zoom: 1,
    panX: 0,
    panY: 0,
    ...overrides,
  };
}

function buildToolStoreState(overrides = {}) {
  return {
    equipmentPlacementDialogOpen: false,
    equipmentPlacementDraft: buildDraft(),
    setTool: mockSetTool,
    setEquipmentPlacementDialogOpen: mockSetEquipmentPlacementDialogOpen,
    setEquipmentPlacementDraft: mockSetEquipmentPlacementDraft,
    setStatusMessage: mockSetStatusMessage,
    ...overrides,
  };
}

function buildMouseEvent(overrides: Partial<ToolMouseEvent> = {}): ToolMouseEvent {
  return { x: 100, y: 200, button: 0, ...overrides };
}

function buildKeyEvent(key: string, overrides: Partial<ToolKeyEvent> = {}): ToolKeyEvent {
  return {
    key,
    code: `Key${key.toUpperCase()}`,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    repeat: false,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EquipmentTool', () => {
  let tool: EquipmentTool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new EquipmentTool();

    // Default store states
    (mockToolStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
      buildToolStoreState()
    );
    (mockViewportStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
      buildViewportState()
    );

    // createEquipment returns a fake entity
    mockCreateEquipment.mockReturnValue({
      id: 'eq-uuid-123',
      type: 'equipment',
      props: { name: 'AHU-1', equipmentType: 'air_handler' },
    });
  });

  // ── Identity ──────────────────────────────────────────────────────────────

  it('has name "equipment"', () => {
    expect(tool.name).toBe('equipment');
  });

  it('returns "crosshair" cursor', () => {
    expect(tool.getCursor()).toBe('crosshair');
  });

  // ── Activation ────────────────────────────────────────────────────────────

  describe('onActivate / onDeactivate', () => {
    it('resets internal state on activate', () => {
      // No observable side-effect beyond not crashing; state is private
      expect(() => tool.onActivate()).not.toThrow();
    });

    it('resets internal state on deactivate', () => {
      expect(() => tool.onDeactivate()).not.toThrow();
    });
  });

  // ── Keyboard: Escape ──────────────────────────────────────────────────────

  describe('onKeyDown – Escape', () => {
    it('calls setTool("select") when Escape is pressed', () => {
      tool.onKeyDown(buildKeyEvent('Escape'));
      expect(mockSetTool).toHaveBeenCalledWith('select');
    });

    it('does NOT call setEquipmentPlacementDialogOpen on Escape', () => {
      tool.onKeyDown(buildKeyEvent('Escape'));
      expect(mockSetEquipmentPlacementDialogOpen).not.toHaveBeenCalled();
    });
  });

  // ── Keyboard: E ───────────────────────────────────────────────────────────

  describe('onKeyDown – E key', () => {
    it('opens placement dialog when lowercase "e" is pressed', () => {
      tool.onKeyDown(buildKeyEvent('e'));
      expect(mockSetEquipmentPlacementDialogOpen).toHaveBeenCalledWith(true);
    });

    it('opens placement dialog when uppercase "E" is pressed', () => {
      tool.onKeyDown(buildKeyEvent('E'));
      expect(mockSetEquipmentPlacementDialogOpen).toHaveBeenCalledWith(true);
    });

    it('does NOT call setTool on E key', () => {
      tool.onKeyDown(buildKeyEvent('e'));
      expect(mockSetTool).not.toHaveBeenCalled();
    });
  });

  // ── Keyboard: other keys ──────────────────────────────────────────────────

  describe('onKeyDown – unrelated keys', () => {
    it('ignores unrelated keys without calling store actions', () => {
      tool.onKeyDown(buildKeyEvent('d'));
      tool.onKeyDown(buildKeyEvent('r'));
      tool.onKeyDown(buildKeyEvent('Enter'));
      expect(mockSetTool).not.toHaveBeenCalled();
      expect(mockSetEquipmentPlacementDialogOpen).not.toHaveBeenCalled();
    });
  });

  // ── Mouse: placement ──────────────────────────────────────────────────────

  describe('onMouseDown – placement', () => {
    it('calls createEquipment on left-click when dialog is closed', () => {
      tool.onMouseDown(buildMouseEvent({ button: 0 }));
      expect(mockCreateEquipment).toHaveBeenCalledOnce();
    });

    it('calls createEntity with the created equipment', () => {
      tool.onMouseDown(buildMouseEvent({ button: 0 }));
      expect(mockCreateEntity).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'eq-uuid-123' })
      );
    });

    it('calls validateAndRecord with the new entity id', () => {
      tool.onMouseDown(buildMouseEvent({ button: 0 }));
      expect(mockValidateAndRecord).toHaveBeenCalledWith('eq-uuid-123');
    });

    it('does NOT place equipment when right-click (button=2)', () => {
      tool.onMouseDown(buildMouseEvent({ button: 2 }));
      expect(mockCreateEquipment).not.toHaveBeenCalled();
    });

    it('does NOT place equipment when dialog is open', () => {
      (mockToolStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildToolStoreState({ equipmentPlacementDialogOpen: true })
      );
      tool.onMouseDown(buildMouseEvent({ button: 0 }));
      expect(mockCreateEquipment).not.toHaveBeenCalled();
    });
  });

  // ── Name auto-increment ───────────────────────────────────────────────────

  describe('name auto-increment after placement', () => {
    it('increments the name draft after placement (AHU-1 → AHU-2)', () => {
      (mockToolStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildToolStoreState({ equipmentPlacementDraft: buildDraft({ name: 'AHU-1' }) })
      );
      tool.onMouseDown(buildMouseEvent());
      expect(mockSetEquipmentPlacementDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AHU-2' })
      );
    });

    it('increments 9 to 10', () => {
      (mockToolStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildToolStoreState({ equipmentPlacementDraft: buildDraft({ name: 'RTU-9' }) })
      );
      tool.onMouseDown(buildMouseEvent());
      expect(mockSetEquipmentPlacementDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'RTU-10' })
      );
    });
  });

  // ── Grid snapping ─────────────────────────────────────────────────────────

  describe('grid snapping', () => {
    it('passes raw coordinates when snapToGrid is off', () => {
      (mockViewportStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildViewportState({ snapToGrid: false, gridSize: 12 })
      );
      tool.onMouseDown(buildMouseEvent({ x: 103, y: 207 }));
      expect(mockCreateEquipment).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ x: 103, y: 207 })
      );
    });

    it('snaps coordinates to grid when snapToGrid is on', () => {
      (mockViewportStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildViewportState({ snapToGrid: true, gridSize: 12 })
      );
      // 103 snaps to 108 (nearest multiple of 12), 207 snaps to 204
      tool.onMouseDown(buildMouseEvent({ x: 103, y: 207 }));
      expect(mockCreateEquipment).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ x: 108, y: 204 })
      );
    });

    it('snaps exactly on-grid coordinates without change', () => {
      (mockViewportStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildViewportState({ snapToGrid: true, gridSize: 12 })
      );
      tool.onMouseDown(buildMouseEvent({ x: 96, y: 120 }));
      expect(mockCreateEquipment).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ x: 96, y: 120 })
      );
    });
  });

  // ── Mouse move ────────────────────────────────────────────────────────────

  describe('onMouseMove', () => {
    it('does not throw and does not place equipment', () => {
      expect(() => tool.onMouseMove(buildMouseEvent({ x: 50, y: 75 }))).not.toThrow();
      expect(mockCreateEquipment).not.toHaveBeenCalled();
    });
  });

  // ── Status bar ────────────────────────────────────────────────────────────

  describe('status bar update', () => {
    it('calls setStatusMessage after placement', () => {
      tool.onMouseDown(buildMouseEvent());
      expect(mockSetStatusMessage).toHaveBeenCalledWith(expect.stringContaining('AHU-1'));
    });
  });

  // ── Render preview ────────────────────────────────────────────────────────

  describe('render()', () => {
    function buildCtx() {
      return {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        setLineDash: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: '',
        textBaseline: '',
      } as unknown as CanvasRenderingContext2D;
    }

    it('does not draw when dialog is open', () => {
      (mockToolStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildToolStoreState({ equipmentPlacementDialogOpen: true })
      );
      const ctx = buildCtx();
      tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });

    it('does not draw when no current point (mouse has not moved)', () => {
      const ctx = buildCtx();
      tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });

    it('draws preview box after mouse has moved into canvas', () => {
      // Simulate a mouse move to set currentPoint
      tool.onMouseMove(buildMouseEvent({ x: 200, y: 300 }));
      const ctx = buildCtx();
      tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
      expect(ctx.fillRect).toHaveBeenCalledOnce();
      expect(ctx.strokeRect).toHaveBeenCalledOnce();
    });

    it('draws the preview from the same top-left plan position used for placement and ignores physical height', () => {
      (mockToolStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildToolStoreState({ equipmentPlacementDraft: buildDraft({ width: 48, depth: 60, height: 240 }) })
      );

      tool.onMouseMove(buildMouseEvent({ x: 200, y: 300 }));
      const ctx = buildCtx();
      tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

      expect(ctx.fillRect).toHaveBeenCalledWith(200, 300, 48, 60);
      expect(ctx.strokeRect).toHaveBeenCalledWith(200, 300, 48, 60);
      expect(ctx.fillRect).not.toHaveBeenCalledWith(200, 300, 48, 240);
    });

    it('draws the equipment name label in preview', () => {
      tool.onMouseMove(buildMouseEvent({ x: 200, y: 300 }));
      const ctx = buildCtx();
      tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
      // fillText called at least twice: name + CFM label
      expect(ctx.fillText).toHaveBeenCalledWith('AHU-1', expect.any(Number), expect.any(Number));
    });

    it('draws the CFM label in preview', () => {
      (mockToolStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState.mockReturnValue(
        buildToolStoreState({ equipmentPlacementDraft: buildDraft({ capacity: 10000, capacityUnit: 'CFM' }) })
      );
      tool.onMouseMove(buildMouseEvent({ x: 200, y: 300 }));
      const ctx = buildCtx();
      tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('10,000'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});
