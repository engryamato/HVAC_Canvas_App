import { beforeEach, describe, expect, it } from 'vitest';
import { useEntityStore } from '@/core/store/entityStore';
import { createDuctRun, resetDuctRunCounter } from '../../entities/ductRunDefaults';
import { useSelectionStore } from '../../store/selectionStore';
import { SelectTool } from '../SelectTool';

describe('SelectTool duct_run segment selection', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
    useSelectionStore.getState().setHovered(null);
    resetDuctRunCounter();
  });

  function seedRun() {
    const run = createDuctRun({ x: 100, y: 100, installLength: 10, sectionLengthOverride: 5 });
    run.props.segments = [
      { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
      { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
    ];
    useEntityStore.getState().addEntity(run);
    return run;
  }

  it('selects the run before allowing segment selection', () => {
    const run = seedRun();
    const tool = new SelectTool();

    tool.onMouseDown({ x: 120, y: 100, button: 0 });
    tool.onMouseUp({ x: 120, y: 100, button: 0 });
    expect(useSelectionStore.getState().selectedIds).toEqual([run.id]);
    expect(useSelectionStore.getState().selectedSegments).toEqual([]);

    tool.onMouseDown({ x: 120, y: 100, button: 0 });
    tool.onMouseUp({ x: 120, y: 100, button: 0 });
    expect(useSelectionStore.getState().selectedSegments).toEqual([{ runId: run.id, segmentIndex: 0 }]);
  });

  it('adds segment selections with modifier clicks without dropping the parent run', () => {
    const run = seedRun();
    const tool = new SelectTool();

    useSelectionStore.getState().select(run.id);

    tool.onMouseDown({ x: 120, y: 100, button: 0 });
    tool.onMouseUp({ x: 120, y: 100, button: 0 });
    tool.onMouseDown({ x: 190, y: 100, button: 0, shiftKey: true });
    tool.onMouseUp({ x: 190, y: 100, button: 0, shiftKey: true });

    expect(useSelectionStore.getState().selectedIds).toEqual([run.id]);
    expect(useSelectionStore.getState().selectedSegments).toEqual([
      { runId: run.id, segmentIndex: 0 },
      { runId: run.id, segmentIndex: 1 },
    ]);
  });

  it('clears run and segment selection on empty-canvas click', () => {
    const run = seedRun();
    const tool = new SelectTool();

    useSelectionStore.getState().select(run.id);
    useSelectionStore.getState().selectSegment(run.id, 0);

    tool.onMouseDown({ x: 400, y: 400, button: 0 });
    tool.onMouseUp({ x: 400, y: 400, button: 0 });

    expect(useSelectionStore.getState().selectedIds).toEqual([]);
    expect(useSelectionStore.getState().selectedSegments).toEqual([]);
  });
});
