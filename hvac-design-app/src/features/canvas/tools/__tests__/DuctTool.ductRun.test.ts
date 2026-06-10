import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEntity } from '@/core/commands/entityCommands';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../store/selectionStore';
import { createEquipment } from '../../entities/equipmentDefaults';
import { createDuctRun } from '../../entities/ductRunDefaults';
import { createFitting } from '../../entities/fittingDefaults';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import { getAngleDegrees } from '../angleConstraint';
import { DuctTool } from '../DuctTool';
import { SelectTool } from '../SelectTool';

function keyEvent(key: string, shiftKey: boolean): Parameters<DuctTool['onKeyDown']>[0] {
  return {
    key,
    code: key === 'Shift' ? 'ShiftLeft' : key,
    shiftKey,
    ctrlKey: false,
    altKey: false,
    repeat: false,
  };
}

function pointAt(
  start: { x: number; y: number },
  angleDeg: number,
  length = 120
): { x: number; y: number } {
  const radians = angleDeg * (Math.PI / 180);
  return {
    x: start.x + length * Math.cos(radians),
    y: start.y + length * Math.sin(radians),
  };
}

describe('DuctTool duct_run hydration', () => {
  beforeEach(() => {
    DuctTool.setAutoFittingEnabled(false);
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
    useToolStore.getState().setDuctDrawSettings({
      shape: 'rectangular',
      diameter: 12,
      width: 12,
      height: 8,
      insulationType: null,
      insulationThickness: 1,
      startEndType: 'flange',
      endEndType: 'flange',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    DuctTool.clearAutoFittingEnabledOverride();
  });

  it('creates duct_run entities for new draws', () => {
    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseDown({ x: 120, y: 120, button: 0 });
    tool.onMouseMove({ x: 240, y: 120 });
    tool.onMouseDown({ x: 240, y: 120, button: 0 });

    const entities = useEntityStore
      .getState()
      .allIds.map((id) => useEntityStore.getState().byId[id]);
    expect(entities).toHaveLength(1);
    expect(entities[0]?.type).toBe('duct_run');

    if (entities[0]?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }

    expect(entities[0].props.startPoint).toEqual({ x: 120, y: 120 });
    expect(entities[0].props.endPoint).toEqual({ x: 240, y: 120 });
    expect(entities[0].transform.rotation).toBe(0);
    expect(entities[0].props.installLength).toBeGreaterThan(0);
    expect(entities[0].props.segments.length).toBeGreaterThan(0);
    expect(entities[0].props.segments[0]).toMatchObject({
      insulationType: undefined,
      insulationThickness: 1,
      startEndType: 'flange',
      endEndType: 'flange',
    });
  });

  it('creates a duct_run when the user draws with a drag gesture', () => {
    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseDown({ x: 120, y: 120, button: 0 });
    tool.onMouseMove({ x: 240, y: 120 });
    tool.onMouseUp({ x: 240, y: 120, button: 0 });

    const entities = useEntityStore
      .getState()
      .allIds.map((id) => useEntityStore.getState().byId[id]);
    expect(entities).toHaveLength(1);
    expect(entities[0]?.type).toBe('duct_run');

    if (entities[0]?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }

    expect(entities[0].props.startPoint).toEqual({ x: 120, y: 120 });
    expect(entities[0].props.endPoint).toEqual({ x: 240, y: 120 });
  });

  it('constrains unsnapped duct drawing to 15 degree angle steps by default', () => {
    const start = { x: 120, y: 120 };
    const cursor = pointAt(start, 47);
    const tool = new DuctTool();
    tool.onActivate();

    tool.onMouseDown({ ...start, button: 0 });
    tool.onMouseMove({ ...cursor, shiftKey: false });
    tool.onMouseDown({ ...cursor, button: 0, shiftKey: false });

    const run = useEntityStore.getState().byId[useEntityStore.getState().allIds[0]!];
    expect(run?.type).toBe('duct_run');
    if (run?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }

    expect(run.transform.rotation).toBeCloseTo(45, 6);
    expect(getAngleDegrees(run.props.startPoint!, run.props.endPoint!)).toBeCloseTo(45, 6);
  });

  it('uses 1 degree angle steps while Shift is held', () => {
    const start = { x: 120, y: 120 };
    const cursor = pointAt(start, 47);
    const tool = new DuctTool();
    tool.onActivate();

    tool.onMouseDown({ ...start, button: 0 });
    tool.onMouseMove({ ...cursor, shiftKey: true });
    tool.onMouseDown({ ...cursor, button: 0, shiftKey: true });

    const run = useEntityStore.getState().byId[useEntityStore.getState().allIds[0]!];
    expect(run?.type).toBe('duct_run');
    if (run?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }

    expect(run.transform.rotation).toBeCloseTo(47, 6);
    expect(getAngleDegrees(run.props.startPoint!, run.props.endPoint!)).toBeCloseTo(47, 6);
  });

  it('keeps magnetic snap endpoints ahead of angle constraints', () => {
    const target = createDuctRun({ x: 401, y: 333, installLength: 10, sectionLengthOverride: 5 });
    target.props.startPoint = { x: 401, y: 333 };
    target.props.endPoint = { x: 521, y: 333 };
    createEntity(target);

    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseDown({ x: 120, y: 120, button: 0 });
    tool.onMouseMove({ x: 403, y: 334, shiftKey: false });
    tool.onMouseDown({ x: 403, y: 334, button: 0, shiftKey: false });

    const run = useEntityStore
      .getState()
      .allIds.map((id) => useEntityStore.getState().byId[id])
      .find((entity) => entity?.type === 'duct_run' && entity.id !== target.id);
    expect(run?.type).toBe('duct_run');
    if (run?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }

    expect(run.props.endPoint?.x).toBeCloseTo(401, 3);
    expect(run.props.endPoint?.y).toBeCloseTo(333, 3);
  });

  it('recomputes the preview angle when Shift is pressed or released without pointer movement', () => {
    const start = { x: 120, y: 120 };
    const cursor = pointAt(start, 47);
    const tool = new DuctTool();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineCap: '',
      font: '',
      textAlign: '',
      textBaseline: '',
    } as unknown as CanvasRenderingContext2D;

    tool.onActivate();
    tool.onMouseDown({ ...start, button: 0 });
    tool.onMouseMove({ ...cursor, shiftKey: false });
    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
    expect(ctx.fillText).toHaveBeenLastCalledWith(
      expect.stringContaining('@ 45deg'),
      expect.any(Number),
      expect.any(Number)
    );

    tool.onKeyDown(keyEvent('Shift', true));
    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
    expect(ctx.fillText).toHaveBeenLastCalledWith(
      expect.stringContaining('@ 47deg 1deg'),
      expect.any(Number),
      expect.any(Number)
    );

    tool.onKeyUp(keyEvent('Shift', false));
    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });
    expect(ctx.fillText).toHaveBeenLastCalledWith(
      expect.stringContaining('@ 45deg'),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('treats prompted duct draw settings as the latest source of truth for new run size', () => {
    useToolStore.getState().setDuctDrawSettings({
      shape: 'round',
      diameter: 18,
    });

    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseDown({ x: 120, y: 120, button: 0 });
    tool.onMouseMove({ x: 240, y: 120 });
    tool.onMouseDown({ x: 240, y: 120, button: 0 });

    const entity = useEntityStore.getState().byId[useEntityStore.getState().allIds[0]!];
    expect(entity?.type).toBe('duct_run');
    if (entity?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }
    expect(entity.props.shape).toBe('round');
    expect(entity.props.diameter).toBe(18);
  });

  it('starts a duct_run from an AHU supply port magnetic snap', () => {
    const ahu = createEquipment('air_handler', {
      name: 'AHU-1',
      x: 100,
      y: 100,
      width: 60,
      depth: 48,
    });
    createEntity(ahu);

    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseMove({ x: 159, y: 114 });
    tool.onMouseDown({ x: 159, y: 114, button: 0 });
    tool.onMouseMove({ x: 220, y: 114 });
    tool.onMouseDown({ x: 220, y: 114, button: 0 });

    const run = useEntityStore
      .getState()
      .allIds.map((id) => useEntityStore.getState().byId[id])
      .find((entity) => entity?.type === 'duct_run');
    expect(run?.type).toBe('duct_run');
    if (run?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }

    expect(run.props.startPoint?.x).toBeCloseTo(160, 3);
    expect(run.props.startPoint?.y).toBeCloseTo(114.4, 3);

    const connectedAhu = useEntityStore.getState().byId[ahu.id];
    expect(connectedAhu?.type).toBe('equipment');
    if (connectedAhu?.type !== 'equipment') {
      throw new Error('Expected equipment entity');
    }
    expect(
      connectedAhu.props.connectionPorts?.find((port) => port.id === 'supply-1')?.connectedDuctId
    ).toBe(run.id);
  });

  it('shows magnetic proximity indicators for non-AHU equipment ports before snap distance', () => {
    const rtu = createEquipment('rtu', {
      name: 'RTU-1',
      x: 100,
      y: 100,
      width: 84,
      depth: 48,
    });
    createEntity(rtu);

    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseMove({ x: 129.4, y: 165 });

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      globalAlpha: 1,
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineCap: '',
      font: '',
      textAlign: '',
      textBaseline: '',
    } as unknown as CanvasRenderingContext2D;

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.arc).toHaveBeenCalledWith(129.4, 148, expect.any(Number), 0, Math.PI * 2);
  });

  it('renders rectangular duct snap indicators using width while ignoring duct height', () => {
    useToolStore.getState().setDuctDrawSettings({
      shape: 'rectangular',
      width: 24,
      height: 36,
    });
    const target = createDuctRun({
      x: 100,
      y: 100,
      installLength: 10,
      sectionLengthOverride: 5,
    });
    target.props.startPoint = { x: 100, y: 100 };
    target.props.endPoint = { x: 220, y: 100 };
    createEntity(target);

    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseMove({ x: 101, y: 100 });

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      globalAlpha: 1,
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineCap: '',
      font: '',
      textAlign: '',
      textBaseline: '',
    } as unknown as CanvasRenderingContext2D;

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.arc).not.toHaveBeenCalledWith(100, 100, 8, 0, Math.PI * 2);
    expect(ctx.strokeRect).toHaveBeenCalledWith(88, 96, 24, 8);
  });

  it('renders an auto-fitting ghost preview while drawing toward a planned junction', () => {
    DuctTool.setAutoFittingEnabled(true);
    const previewFitting = createFitting('elbow_90', { x: 240, y: 120 });
    previewFitting.props.autoInserted = true;
    vi.spyOn(fittingInsertionService, 'planAutoInsertForDuct').mockReturnValue({
      insertions: [previewFitting],
      orphanFittingIds: [],
    });

    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseDown({ x: 120, y: 120, button: 0 });
    tool.onMouseMove({ x: 240, y: 120 });

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      globalAlpha: 1,
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
      font: '',
      textAlign: '',
      textBaseline: '',
    } as unknown as CanvasRenderingContext2D;

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.fillText).toHaveBeenCalledWith('Auto-fitting: elbow 90', 240, 100);
  });

  it('allows segment hit selection once the run is selected', () => {
    const ductTool = new DuctTool();
    ductTool.onActivate();
    ductTool.onMouseDown({ x: 120, y: 120, button: 0 });
    ductTool.onMouseMove({ x: 240, y: 120 });
    ductTool.onMouseDown({ x: 240, y: 120, button: 0 });

    const runId = useEntityStore.getState().allIds[0]!;
    const selectTool = new SelectTool();

    selectTool.onMouseDown({ x: 140, y: 120, button: 0 });
    selectTool.onMouseUp({ x: 140, y: 120, button: 0 });
    expect(useSelectionStore.getState().selectedIds).toEqual([runId]);

    selectTool.onMouseDown({ x: 140, y: 120, button: 0 });
    selectTool.onMouseUp({ x: 140, y: 120, button: 0 });
    expect(useSelectionStore.getState().selectedSegments).toHaveLength(1);
    expect(useSelectionStore.getState().selectedSegments[0]?.runId).toBe(runId);
  });

  it('splits an existing duct_run when a new branch starts from a mid-run body snap', () => {
    const trunk = createDuctRun({ x: 100, y: 100, installLength: 10, sectionLengthOverride: 5 });
    createEntity(trunk);

    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseMove({ x: 160, y: 104 });
    tool.onMouseDown({ x: 160, y: 104, button: 0 });
    tool.onMouseMove({ x: 160, y: 220 });
    tool.onMouseDown({ x: 160, y: 220, button: 0 });

    const runs = useEntityStore
      .getState()
      .allIds.map((id) => useEntityStore.getState().byId[id])
      .filter((entity) => entity?.type === 'duct_run');

    expect(runs).toHaveLength(3);
    expect(runs.some((entity) => entity?.id === trunk.id)).toBe(false);
    expect(
      runs.map((entity) => Number(entity?.props.installLength.toFixed(2))).sort((a, b) => a - b)
    ).not.toEqual([5, 5, 10]);
  });

  // Latest magnetic-center snapping regression: if this fails after error fixes,
  // preserve the CAD-grade centerline behavior and update the implementation/test expectations.
  it('center-aligns a dragged duct_run endpoint to a target duct_run body snap on drop', () => {
    const trunk = createDuctRun({ x: 100, y: 100, installLength: 10, sectionLengthOverride: 5 });
    trunk.id = '11111111-1111-4111-8111-111111111111';
    trunk.props.startPoint = { x: 100, y: 100 };
    trunk.props.endPoint = { x: 220, y: 100 };

    const branch = createDuctRun({ x: 160, y: 130, installLength: 5, sectionLengthOverride: 5 });
    branch.id = '22222222-2222-4222-8222-222222222222';
    branch.transform.rotation = 90;
    branch.props.startPoint = { x: 160, y: 130 };
    branch.props.endPoint = { x: 160, y: 190 };

    createEntity(trunk);
    createEntity(branch);
    useSelectionStore.getState().select(branch.id);

    const selectTool = new SelectTool();
    selectTool.onMouseDown({ x: 160, y: 150, button: 0 });
    selectTool.onMouseMove({ x: 160, y: 144 });
    selectTool.onMouseMove({ x: 160, y: 108 });
    selectTool.onMouseUp({ x: 160, y: 108, button: 0 });

    const moved = useEntityStore.getState().byId[branch.id];
    expect(moved?.type).toBe('duct_run');
    if (moved?.type !== 'duct_run') {
      throw new Error('Expected moved duct_run entity');
    }

    expect(moved.transform.x).toBeCloseTo(160, 3);
    expect(moved.transform.y).toBeCloseTo(100, 3);
    expect(moved.props.startPoint?.x).toBeCloseTo(160, 3);
    expect(moved.props.startPoint?.y).toBeCloseTo(100, 3);
    expect(moved.props.endPoint?.x).toBeCloseTo(160, 3);
    expect(moved.props.endPoint?.y).toBeCloseTo(160, 3);
  });
});
