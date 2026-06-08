import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DuctRun, Entity, Fitting } from '@/core/schema';
import { ConnectionGraphBuilder } from '../ConnectionGraphBuilder';
import { TopologyValidationService } from '../TopologyValidationService';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useToolStore } from '@/core/store/canvas.store';
import { DuctTool } from '@/features/canvas/tools/DuctTool';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { getDuctCenterline } from '@/features/canvas/services/connectionPoints';
import { resetDuctRunCounter } from '@/features/canvas/entities/ductRunDefaults';
import { resetFittingCounter } from '@/features/canvas/entities/fittingDefaults';

const now = '2026-01-01T00:00:00.000Z';

/**
 * Integration coverage for the auto-fitting stabilization fixes (loop runs 9b–12).
 *
 * The four underlying fixes each ship with a focused unit test
 * (ductCutbackService / fittingInsertionService / magneticCalculationServices /
 * entityActions). These two cases assert the cross-service invariants those fixes
 * protect, driven through the real committed pipeline rather than mocks:
 *
 *   1. Reciprocal duct_run connection metadata collapses to a single physical edge
 *      and does NOT trip a false CYCLE_DETECTED (fix 6a545013).
 *   2. Auto-fitting cutback preserves the authored design centerline, so a cut duct
 *      remains restorable to its design line (fixes a40d3d3f / WS6d).
 *
 * NOTE: a full Draw→Connect→Fit→Move→Detach→Rebuild→Reconnect choreography is NOT
 * reproducible at this layer — synthetic tool-method calls do not drive the magnetic
 * multi-duct snapping that forms a clean 3-way junction (the wye binds only the first
 * leg and the collinear leg is never cut). That end-to-end path is exercised by the
 * per-fix unit tests above plus the WS6e recompute-pipeline suite.
 */

function ductRun(id: string, props: Partial<DuctRun['props']> = {}): DuctRun {
  return {
    id,
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      shape: 'round',
      diameter: 12,
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
      installLength: 10,
      segments: [{ index: 0, startStation: 0, endStation: 10, length: 10, isPartial: false }],
      ...props,
    },
    calculated: { area: 113, velocity: 0, frictionLoss: 0.1 },
  } as DuctRun;
}

function drawRun(start: { x: number; y: number }, end: { x: number; y: number }): DuctRun {
  const beforeIds = new Set(useEntityStore.getState().allIds);
  const tool = new DuctTool();
  tool.onActivate();
  tool.onMouseMove({ ...start });
  tool.onMouseDown({ ...start, button: 0 });
  tool.onMouseMove({ ...end });
  tool.onMouseDown({ ...end, button: 0 });

  const created = useEntityStore
    .getState()
    .allIds.filter((id) => !beforeIds.has(id))
    .map((id) => useEntityStore.getState().byId[id])
    .find((entity): entity is DuctRun => entity?.type === 'duct_run');
  if (!created) {
    throw new Error('Expected DuctTool to create a duct_run');
  }
  return created;
}

function storedRun(id: string): DuctRun {
  const entity = useEntityStore.getState().byId[id];
  if (entity?.type !== 'duct_run') {
    throw new Error(`Expected duct_run ${id}`);
  }
  return entity;
}

function autoFittings(): Fitting[] {
  return Object.values(useEntityStore.getState().byId)
    .filter((entity): entity is Fitting => entity.type === 'fitting' && Boolean(entity.props.autoInserted))
    .sort((a, b) => a.id.localeCompare(b.id));
}

describe('2D auto-fitting lifecycle integration', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.setState({ past: [], future: [] });
    useSelectionStore.getState().clearSelection();
    useToolStore.getState().setDuctDrawSettings({
      shape: 'round',
      diameter: 12,
      insulationType: null,
      insulationThickness: 1,
      startEndType: 'flange',
      endEndType: 'flange',
    });
    resetDuctRunCounter();
    resetFittingCounter();
    DuctTool.setAutoFittingEnabled(true);
  });

  afterEach(() => {
    DuctTool.setAutoFittingEnabled(false);
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.setState({ past: [], future: [] });
    useSelectionStore.getState().clearSelection();
  });

  it('deduplicates reciprocal duct_run graph edges without reporting a false cycle', () => {
    const runA = ductRun('550e8400-e29b-41d4-a716-446655440120', {
      connectedTo: '550e8400-e29b-41d4-a716-446655440121',
    });
    const runB = ductRun('550e8400-e29b-41d4-a716-446655440121', {
      connectedTo: '550e8400-e29b-41d4-a716-446655440120',
    });
    const entities: Record<string, Entity> = { [runA.id]: runA, [runB.id]: runB };

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);
    const pairEdges = Array.from(graph.edges.values()).filter(
      (edge) =>
        (edge.source === runA.id && edge.target === runB.id) ||
        (edge.source === runB.id && edge.target === runA.id)
    );
    const results = TopologyValidationService.validate(graph, entities);

    expect(pairEdges).toHaveLength(1);
    expect(results.map((result) => result.reason)).not.toContain('CYCLE_DETECTED');
  });

  it('preserves the authored design centerline through auto-fitting cutback', () => {
    // An angled junction forces an auto-fitting, which cuts the inlet back for clearance.
    const inlet = drawRun({ x: 100, y: 100 }, { x: 220, y: 100 });
    drawRun({ x: 220, y: 100 }, { x: 280, y: 203.923 });

    expect(autoFittings().length).toBeGreaterThanOrEqual(1);

    const stored = storedRun(inlet.id);
    const design = getDuctCenterline(stored);

    // The design centerline remains the authored line, untouched by the cutback...
    expect(design.start).toEqual({ x: 100, y: 100 });
    expect(design.end).toEqual({ x: 220, y: 100 });
    expect(stored.props.designStartPoint).toEqual({ x: 100, y: 100 });
    expect(stored.props.designEndPoint).toEqual({ x: 220, y: 100 });

    // ...while the rendered geometry was actually cut back from the design end,
    // so the restore-to-design path has something to restore.
    expect(stored.props.endPoint).not.toEqual(design.end);
  });
});
