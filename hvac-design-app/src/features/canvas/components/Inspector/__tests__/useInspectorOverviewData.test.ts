import { describe, expect, it } from 'vitest';

import {
  buildActivityItems,
  buildElementInventory,
  buildHealthItems,
  buildSystems,
} from '../useInspectorOverviewData';

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
});
