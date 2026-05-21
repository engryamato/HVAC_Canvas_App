import { beforeEach, describe, expect, it } from 'vitest';
import { createEntity } from '@/core/commands/entityCommands';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../store/selectionStore';
import { createDuctRun } from '../../entities/ductRunDefaults';
import { DuctTool } from '../DuctTool';
import { SelectTool } from '../SelectTool';

describe('DuctTool duct_run hydration', () => {
  beforeEach(() => {
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

  it('creates duct_run entities for new draws', () => {
    const tool = new DuctTool();
    tool.onActivate();
    tool.onMouseDown({ x: 120, y: 120, button: 0 });
    tool.onMouseMove({ x: 240, y: 120 });
    tool.onMouseDown({ x: 240, y: 120, button: 0 });

    const entities = useEntityStore.getState().allIds.map((id) => useEntityStore.getState().byId[id]);
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

    const entities = useEntityStore.getState().allIds.map((id) => useEntityStore.getState().byId[id]);
    expect(entities).toHaveLength(1);
    expect(entities[0]?.type).toBe('duct_run');

    if (entities[0]?.type !== 'duct_run') {
      throw new Error('Expected duct_run entity');
    }

    expect(entities[0].props.startPoint).toEqual({ x: 120, y: 120 });
    expect(entities[0].props.endPoint).toEqual({ x: 240, y: 120 });
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
    expect(runs.map((entity) => entity?.props.installLength).sort((a, b) => a - b)).toEqual([5, 5, 10]);
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
