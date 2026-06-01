import { describe, expect, it } from 'vitest';

import {
  buildActivityItems,
  buildEntityBounds,
  buildElementInventory,
  buildHealthItems,
  buildProject,
  buildSystems,
} from '../useInspectorOverviewData';
import { buildGeometryRepairPlan } from '../../../services/geometryRepairService';
import { buildInspectorFocusRequest } from '../../../utils/inspectorFocus';

describe('inspector overview data helpers', () => {
  it('builds element inventory with zero-count categories intact', () => {
    const inventory = buildElementInventory([
      { id: 'duct-1', type: 'duct', props: { shape: 'rectangular' } },
      { id: 'duct-2', type: 'duct', props: { shape: 'round' } },
      { id: 'fitting-1', type: 'fitting', props: { fittingType: 'elbow' } },
      { id: 'equipment-1', type: 'equipment', props: {} },
    ] as never);

    expect(inventory.inventory).toEqual({ Ducts: 2, Fittings: 1, Equipment: 1, Rooms: 0 });
    expect(inventory.breakdown).toEqual({ Rectangular: 1, Round: 1, Flex: 0, Elbows: 1, Tees: 0, Reducers: 0 });
  });

  it('builds health items from validation results without hardcoded check names', () => {
    const health = buildHealthItems({
      'duct-1': {
        entityId: 'duct-1',
        catalogStatus: 'resolved',
        lastValidated: new Date('2026-05-26T00:00:00.000Z'),
        violations: [{ ruleId: 'topology', type: 'unconnected', severity: 'warning', message: 'Unconnected' }],
      },
      'duct-2': {
        entityId: 'duct-2',
        catalogStatus: 'resolved',
        lastValidated: new Date('2026-05-26T00:00:00.000Z'),
        violations: [{ ruleId: 'geometry', type: 'invalid_transition', severity: 'blocker', message: 'Invalid' }],
      },
    } as never);

    expect(health).toEqual([
      { id: 'unconnected', status: 'warning', label: 'Unconnected', count: 1 },
      { id: 'invalid_transition', status: 'error', label: 'Invalid Transition', count: 1 },
    ]);
  });

  // Model health intentionally renders the validation store's actual violation types.
  // It does not maintain a fixed list of SMACNA checks in the component.
  it('groups unresolved catalog and multiple validation rule families', () => {
    const health = buildHealthItems({
      'fitting-1': {
        entityId: 'fitting-1',
        catalogStatus: 'unresolved',
        lastValidated: new Date('2026-05-26T00:00:00.000Z'),
        violations: [
          { ruleId: 'topology', type: 'unconnected', severity: 'warning', message: 'Unconnected' },
          { ruleId: 'geometry', type: 'invalid_transition', severity: 'blocker', message: 'Invalid transition' },
        ],
      },
    } as never);

    expect(health).toEqual([
      { id: 'unconnected', status: 'warning', label: 'Unconnected', count: 1 },
      { id: 'invalid_transition', status: 'error', label: 'Invalid Transition', count: 1 },
      { id: 'unresolved_catalog', status: 'warning', label: 'Unresolved Catalog', count: 1 },
    ]);
  });

  it('builds system totals from duct and duct-run entities', () => {
    const systems = buildSystems([
      {
        id: 'duct-1',
        type: 'duct',
        props: { engineeringSystem: 'Supply', length: 25, airflow: 600 },
        calculated: { area: 2, frictionLoss: 0.14 },
      },
      {
        id: 'run-1',
        type: 'duct_run',
        props: { engineeringSystem: 'Supply', installLength: 15, airflow: 400 },
        calculated: { area: 1.5, cumulativePressureDrop: 0.11 },
      },
    ] as never, true);

    expect(systems).toHaveLength(1);
    expect(systems[0]).toMatchObject({
      id: 'Supply',
      name: 'Supply',
      segmentCount: 2,
      totalLength: 40,
      designAirflow: 1000,
      status: 'balanced',
    });
    expect(systems[0].pressureLoss).toBeCloseTo(0.25);
  });

  it('builds recent activity from history commands newest first', () => {
    const activity = buildActivityItems(
      [
        { id: '1', type: 'CREATE_ENTITY', payload: { entity: { type: 'duct', props: { name: 'Duct A' } } }, timestamp: 1000 },
        { id: '2', type: 'MOVE_ENTITY', payload: { transforms: [{ id: 'duct-1' }] }, timestamp: 2000 },
      ] as never,
      new Date(3000)
    );

    expect(activity).toEqual([
      { id: '2', action: 'Moved', type: 'Entity', target: '1 item', time: '1 sec ago' },
      { id: '1', action: 'Added', type: 'Duct', target: 'Duct A', time: '2 sec ago' },
    ]);
  });

  it('limits recent activity to ten newest commands', () => {
    const commands = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      type: 'CREATE_ENTITY',
      payload: { entity: { type: 'duct', props: { name: `Duct ${index}` } } },
      timestamp: index * 1000,
    }));

    const activity = buildActivityItems(commands as never, new Date(12000));

    expect(activity).toHaveLength(10);
    expect(activity[0].id).toBe('11');
    expect(activity[9].id).toBe('2');
  });

  it('replaces raw UUID targets with readable activity copy', () => {
    const activity = buildActivityItems(
      [
        {
          id: '1',
          type: 'UPDATE_ENTITY',
          payload: { id: '06d8ae67-d9c3-4ba3-9216-8f31acc7fbc0' },
          timestamp: 1000,
        },
      ] as never,
      new Date(3000)
    );

    expect(activity[0].target).toBe('Selected item');
    expect(activity[0].target).not.toContain('06d8ae67');
  });

  it('builds focus metadata for inspector selections', () => {
    expect(buildInspectorFocusRequest(['a', 'a', 'b'])).toEqual({
      ids: ['a', 'b'],
      shouldFocus: true,
      status: 'Selected 2 canvas elements.',
    });
  });

  it('builds bounds from entities with position and size props', () => {
    const bounds = buildEntityBounds([
      { id: 'room-1', type: 'room', props: { x: 10, y: 20, width: 100, height: 50 } },
      { id: 'duct-1', type: 'duct', props: { x: 200, y: 100, width: 40, height: 20 } },
    ] as never);

    expect(bounds).toEqual({ x: 10, y: 20, width: 230, height: 100 });
  });

  it('builds equipment bounds from canvas transform, plan width, and depth', () => {
    const bounds = buildEntityBounds([
      {
        id: 'equipment-1',
        type: 'equipment',
        transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
        props: { width: 160, depth: 40, height: 240 },
      },
    ] as never);

    expect(bounds).toEqual({ x: 10, y: 20, width: 160, height: 40 });
  });

  it('builds bounds from duct run endpoints', () => {
    const bounds = buildEntityBounds([
      {
        id: 'run-1',
        type: 'duct_run',
        props: {
          startPoint: { x: 100, y: 200 },
          endPoint: { x: 280, y: 140 },
        },
      },
    ] as never);

    expect(bounds).toEqual({ x: 100, y: 140, width: 180, height: 60 });
  });

  it('plans geometry repair without silently mutating model geometry', () => {
    const result = buildGeometryRepairPlan({
      'duct-1': {
        entityId: 'duct-1',
        catalogStatus: 'resolved',
        lastValidated: new Date('2026-05-26T00:00:00.000Z'),
        violations: [{ ruleId: 'geometry', type: 'invalid_transition', severity: 'blocker', message: 'Invalid' }],
      },
    } as never);

    expect(result.requiresConfirmation).toBe(true);
    expect(result.reversible).toBe(true);
    expect(result.changedEntityIds).toEqual(['duct-1']);
  });

  it('renders dash values instead of fabricated project metadata', () => {
    expect(buildProject(null as never)).toMatchObject({
      name: 'Untitled',
      modified: '-',
      engineer: '-',
      author: '-',
    });
  });
});
