import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DuctRun, Entity, Fitting } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { updateEntity, undo } from '@/core/commands/entityCommands';
import { resolveFittingGeometry } from '@/features/canvas/services/connectionPoints';

/**
 * WS6e E6 — §9D recompute pipeline (integration).
 *
 * Proves the locked E6 acceptance criterion: a fitting `variant` change
 * re-resolves the fitting geometry + ports AND re-snaps the connected duct
 * endpoint onto the recomputed port, all inside ONE undo group (a single
 * history command). This already falls out of the committed pipeline
 * (`entityCommands.updateEntity` → `executeAndRecord` → store `updateEntity` →
 * `runCommittedPipeline` → `ConnectionReconciliationService.reconcile` →
 * `reconcileFittingByPorts` + WS6d cutback), with the WS6e E2–E5 variant-aware
 * resolvers feeding `resolveFittingGeometry`. These tests lock that behavior.
 *
 * The §9D *adapter enforcement* and the deferred net-new detection (mid-span
 * takeoff, offset-pair, boot-vs-cap) co-ship with WS4 and are out of scope here.
 */

const now = '2026-01-01T00:00:00.000Z';
const SERVICE_ID = '00000000-0000-0000-0000-000000000001';
const FITTING_ID = '550e8400-e29b-41d4-a716-446655440200';
const DUCT_ID = '550e8400-e29b-41d4-a716-446655440201';

/** A concentric round 12→8 reducer at (100, 100). */
function reducer(): Fitting {
  return {
    id: FITTING_ID,
    type: 'fitting',
    transform: { x: 100, y: 100, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      engineeringSystem: 'standard_duct',
      serviceId: SERVICE_ID,
      fittingType: 'reducer',
      transitionData: { fromShape: 'round', fromDiameter: 12, toShape: 'round', toDiameter: 8 },
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  } as Fitting;
}

function outletWorld(fitting: Fitting): { x: number; y: number } {
  const outlet = resolveFittingGeometry(fitting).connectionPoints.find((p) => p.role === 'outlet');
  if (!outlet) throw new Error('reducer has no outlet port');
  return { x: outlet.worldPosition.x, y: outlet.worldPosition.y };
}

/** A duct_run whose START sits exactly on the reducer's concentric outlet port. */
function ductOnOutlet(start: { x: number; y: number }): DuctRun {
  return {
    id: DUCT_ID,
    type: 'duct_run',
    transform: { x: start.x, y: start.y, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Branch',
      engineeringSystem: 'standard_duct',
      shape: 'round',
      diameter: 8,
      installLength: 5,
      airflow: 0,
      staticPressure: 0.1,
      startPoint: { ...start },
      endPoint: { x: 400, y: 400 },
      segments: [],
    },
    calculated: { area: 50, velocity: 0, frictionLoss: 0 },
  } as DuctRun;
}

function seed(): { startBefore: { x: number; y: number } } {
  const fitting = reducer();
  const startBefore = outletWorld(fitting);
  const duct = ductOnOutlet(startBefore);
  useEntityStore.setState({
    byId: { [fitting.id]: fitting, [duct.id]: duct } as Record<string, Entity>,
    allIds: [fitting.id, duct.id],
  });
  useHistoryStore.setState({ past: [], future: [] });
  return { startBefore };
}

const storedDuct = () => useEntityStore.getState().byId[DUCT_ID] as DuctRun;
const storedFitting = () => useEntityStore.getState().byId[FITTING_ID] as Fitting;

describe('WS6e E6 — variant change recomputes geometry + duct endpoints in one undo group', () => {
  beforeEach(() => {
    seed();
  });
  afterEach(() => {
    useEntityStore.setState({ byId: {}, allIds: [] });
    useHistoryStore.setState({ past: [], future: [] });
  });

  it('re-snaps the connected duct endpoint onto the recomputed eccentric port', () => {
    const before = storedDuct();
    const startBefore = { ...before.props.startPoint! };

    const previous = storedFitting();
    const nextProps = { ...previous.props, variant: { eccentricOffset: 'bottom' as const } };
    updateEntity(FITTING_ID, { props: nextProps, modifiedAt: '2026-01-02T00:00:00.000Z' }, previous);

    // The reducer's outlet moved off-axis (eccentric 'bottom' = +y); the duct
    // start follows the recomputed port via the WS6d cutback (pulled along the
    // duct axis, so it tracks the move rather than landing exactly on the port).
    const after = storedDuct().props.startPoint!;
    expect(after.y).not.toBeCloseTo(startBefore.y, 3);
    expect(after.y).toBeGreaterThan(startBefore.y);

    // Ports were recomputed and the fitting records the connection to the duct.
    expect(storedFitting().props.ports?.some((p) => p.connectedDuctRunId === DUCT_ID)).toBe(true);
  });

  it('records exactly one history command and undo reverts both fitting and duct', () => {
    const { startBefore } = seed();
    const previous = storedFitting();
    const nextProps = { ...previous.props, variant: { eccentricOffset: 'bottom' as const } };
    updateEntity(FITTING_ID, { props: nextProps, modifiedAt: '2026-01-02T00:00:00.000Z' }, previous);

    // ONE undo group for the whole recompute (props + reconcile + cutback).
    expect(useHistoryStore.getState().past).toHaveLength(1);

    const movedY = storedDuct().props.startPoint!.y;
    expect(movedY).not.toBeCloseTo(startBefore.y, 3);

    expect(undo()).toBe(true);

    // Variant cleared and the duct endpoint restored to the concentric port.
    expect(storedFitting().props.variant?.eccentricOffset).toBeUndefined();
    expect(storedDuct().props.startPoint!.y).toBeCloseTo(startBefore.y, 3);
  });
});
