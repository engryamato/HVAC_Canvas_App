import { beforeEach, describe, expect, it } from 'vitest';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../store/selectionStore';
import { DuctTool } from '../DuctTool';
import { SelectTool } from '../SelectTool';

describe('DuctTool duct_run hydration', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
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

    expect(entities[0].props.installLength).toBeGreaterThan(0);
    expect(entities[0].props.segments.length).toBeGreaterThan(0);
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
});
