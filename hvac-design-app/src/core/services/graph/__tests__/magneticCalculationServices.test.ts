import { describe, expect, it } from 'vitest';
import type { DuctRun, Entity, Equipment, Fitting } from '@/core/schema';
import { ConnectionGraphBuilder } from '../ConnectionGraphBuilder';
import { ConnectionReconciliationService } from '../ConnectionReconciliationService';
import { TopologyValidationService } from '../TopologyValidationService';
import { PressurePropagationService } from '../../calculations/PressurePropagationService';
import {
  classifyDuctVelocity,
  ductVelocityThresholds,
} from '../../calculations/ductVelocityThresholds';

const now = '2026-01-01T00:00:00.000Z';

function ductRun(id: string, x: number, y: number, lengthFeet = 10, props: Partial<DuctRun['props']> = {}): DuctRun {
  return {
    id,
    type: 'duct_run',
    transform: { x, y, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 12,
      height: 12,
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
      installLength: lengthFeet,
      segments: [{ index: 0, startStation: 0, endStation: lengthFeet, length: lengthFeet, isPartial: false }],
      ...props,
    },
    calculated: { area: 144, velocity: 0, frictionLoss: 0.1 },
  };
}

function sourceEquipment(id: string, x: number, y: number, props: Partial<Equipment['props']> = {}): Equipment {
  return {
    id,
    type: 'equipment',
    transform: { x, y, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      equipmentType: 'air_handler',
      capacity: 2000,
      capacityUnit: 'CFM',
      staticPressure: 2,
      staticPressureUnit: 'in_wg',
      width: 60,
      depth: 48,
      height: 72,
      mountHeightUnit: 'in',
      ...props,
    },
  };
}

function fitting(id: string, x: number, y: number, props: Partial<Fitting['props']> = {}): Fitting {
  return {
    id,
    type: 'fitting',
    transform: { x, y, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      engineeringSystem: 'standard_duct',
      fittingType: 'tee',
      manualOverride: false,
      ...props,
    },
    calculated: { equivalentLength: 10, pressureLoss: 0.02 },
  };
}

describe('ConnectionReconciliationService', () => {
  it('writes persisted duct_run and equipment connections from snapped endpoints', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440000', 0, 0);
    const first = ductRun('550e8400-e29b-41d4-a716-446655440001', 0, 0);
    const second = ductRun('550e8400-e29b-41d4-a716-446655440002', 120, 0);
    const entities: Record<string, Entity> = {
      [source.id]: source,
      [first.id]: first,
      [second.id]: second,
    };

    const reconciled = ConnectionReconciliationService.reconcile(entities);

    expect(reconciled[source.id]?.type).toBe('equipment');
    expect((reconciled[source.id] as Equipment).props.connectedDuctId).toBe(first.id);
    expect((reconciled[first.id] as DuctRun).props.connectedFrom).toBe(source.id);
    expect((reconciled[first.id] as DuctRun).props.connectedTo).toBe(second.id);
    expect((reconciled[second.id] as DuctRun).props.connectedFrom).toBe(first.id);
  });

  it('writes fitting ports with role and direction for connected duct_run endpoints', () => {
    const inlet = ductRun('550e8400-e29b-41d4-a716-446655440011', 0, 0);
    const straight = ductRun('550e8400-e29b-41d4-a716-446655440012', 120, 0);
    const branch = ductRun('550e8400-e29b-41d4-a716-446655440013', 120, 0, 10, { startPoint: { x: 120, y: 0 } });
    const tee = fitting('550e8400-e29b-41d4-a716-446655440014', 120, 0, { fittingType: 'tee' });
    const reconciled = ConnectionReconciliationService.reconcile({
      [inlet.id]: inlet,
      [straight.id]: straight,
      [branch.id]: branch,
      [tee.id]: tee,
    });

    expect((reconciled[tee.id] as Fitting).props.ports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'inlet', direction: 'in', connectedDuctRunId: inlet.id }),
        expect.objectContaining({ role: 'straight_out', direction: 'out', connectedDuctRunId: straight.id }),
        expect.objectContaining({ role: 'branch_out', direction: 'out', connectedDuctRunId: branch.id }),
      ])
    );
  });

  it('clears stale persisted links when no snapped neighbor remains', () => {
    const run = ductRun('550e8400-e29b-41d4-a716-446655440015', 400, 0, 10, {
      connectedFrom: '550e8400-e29b-41d4-a716-446655440016',
      connectedTo: '550e8400-e29b-41d4-a716-446655440017',
    });

    const reconciled = ConnectionReconciliationService.reconcile({ [run.id]: run });

    expect((reconciled[run.id] as DuctRun).props.connectedFrom).toBeUndefined();
    expect((reconciled[run.id] as DuctRun).props.connectedTo).toBeUndefined();
  });
});

describe('ConnectionGraphBuilder persisted metadata', () => {
  it('builds directed duct_run and fitting edges from persisted metadata', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440020', 0, 0, {
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440021',
    });
    const first = ductRun('550e8400-e29b-41d4-a716-446655440021', 0, 0, 10, {
      connectedFrom: source.id,
      connectedTo: '550e8400-e29b-41d4-a716-446655440022',
    });
    const outlet = ductRun('550e8400-e29b-41d4-a716-446655440023', 120, 0);
    const elbow = fitting('550e8400-e29b-41d4-a716-446655440022', 120, 0, {
      fittingType: 'elbow_90',
      ports: [
        { id: 'in', role: 'inlet', direction: 'in', connectedDuctRunId: first.id, connectedEnd: 'end' },
        { id: 'out', role: 'outlet', direction: 'out', connectedDuctRunId: outlet.id, connectedEnd: 'start' },
      ],
    });

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [source.id]: source,
      [first.id]: first,
      [elbow.id]: elbow,
      [outlet.id]: outlet,
    });

    expect(graph.nodes.get(first.id)?.type).toBe('duct_run');
    expect(graph.edges.get(`${source.id}->${first.id}`)).toMatchObject({ source: source.id, target: first.id });
    expect(graph.edges.get(`${first.id}->${elbow.id}`)).toMatchObject({ source: first.id, target: elbow.id });
    expect(graph.edges.get(`${elbow.id}->${outlet.id}`)).toMatchObject({ source: elbow.id, target: outlet.id });
  });
});

describe('TopologyValidationService', () => {
  it('validates a single-source tree and classifies downstream branches', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440030', 0, 0, {
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440031',
    });
    const trunk = ductRun('550e8400-e29b-41d4-a716-446655440031', 0, 0, 10, { connectedFrom: source.id });
    const left = ductRun('550e8400-e29b-41d4-a716-446655440032', 120, 0);
    const right = ductRun('550e8400-e29b-41d4-a716-446655440033', 120, 0);
    const tee = fitting('550e8400-e29b-41d4-a716-446655440034', 120, 0, {
      ports: [
        { id: 'in', role: 'inlet', direction: 'in', connectedDuctRunId: trunk.id, connectedEnd: 'end' },
        { id: 'straight', role: 'straight_out', direction: 'out', connectedDuctRunId: left.id, connectedEnd: 'start' },
        { id: 'branch', role: 'branch_out', direction: 'out', connectedDuctRunId: right.id, connectedEnd: 'start' },
      ],
    });
    const entities = { [source.id]: source, [trunk.id]: trunk, [left.id]: left, [right.id]: right, [tee.id]: tee };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);

    const [result] = TopologyValidationService.validate(graph, entities);

    expect(result).toMatchObject({ isValid: true, sourceEquipmentId: source.id });
    expect(result?.ductRoles).toMatchObject({ [trunk.id]: 'main', [left.id]: 'branch', [right.id]: 'branch' });
  });

  it('fails closed for cycles and multiple sources', () => {
    const sourceA = sourceEquipment('550e8400-e29b-41d4-a716-446655440040', 0, 0, {
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440042',
    });
    const sourceB = sourceEquipment('550e8400-e29b-41d4-a716-446655440041', 240, 0, {
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440042',
    });
    const runA = ductRun('550e8400-e29b-41d4-a716-446655440042', 0, 0, 10, {
      connectedFrom: '550e8400-e29b-41d4-a716-446655440043',
      connectedTo: '550e8400-e29b-41d4-a716-446655440043',
    });
    const runB = ductRun('550e8400-e29b-41d4-a716-446655440043', 120, 0, 10, {
      connectedFrom: runA.id,
      connectedTo: runA.id,
    });
    const entities = { [sourceA.id]: sourceA, [sourceB.id]: sourceB, [runA.id]: runA, [runB.id]: runB };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);

    const [result] = TopologyValidationService.validate(graph, entities);

    expect(result?.isValid).toBe(false);
    expect(['MULTIPLE_SOURCES', 'CYCLE_DETECTED']).toContain(result?.reason);
  });

  it('reports no source, broken references, malformed fitting ports, and multiple upstream paths', () => {
    const noSourceRun = ductRun('550e8400-e29b-41d4-a716-446655440060', 0, 0);
    const noSourceEntities = { [noSourceRun.id]: noSourceRun };
    expect(
      TopologyValidationService.validate(
        ConnectionGraphBuilder.buildFromPersistedMetadata(noSourceEntities),
        noSourceEntities
      )[0]?.reason
    ).toBe('NO_SOURCE');

    const brokenRun = ductRun('550e8400-e29b-41d4-a716-446655440061', 0, 0, 10, {
      connectedTo: '550e8400-e29b-41d4-a716-446655440099',
    });
    const brokenEntities = { [brokenRun.id]: brokenRun };
    expect(
      TopologyValidationService.validate(
        ConnectionGraphBuilder.buildFromPersistedMetadata(brokenEntities),
        brokenEntities
      )[0]?.reason
    ).toBe('BROKEN_REFERENCE');

    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440062', 0, 0, {
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440063',
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440063', 0, 0, 10, { connectedFrom: source.id });
    const badFitting = fitting('550e8400-e29b-41d4-a716-446655440064', 120, 0, {
      ports: [{ id: 'missing', role: 'outlet', direction: 'out', connectedDuctRunId: run.id, connectedEnd: 'end' }],
    });
    const malformedEntities = { [source.id]: source, [run.id]: run, [badFitting.id]: badFitting };
    expect(
      TopologyValidationService.validate(
        ConnectionGraphBuilder.buildFromPersistedMetadata(malformedEntities),
        malformedEntities
      )[0]?.reason
    ).toBe('MALFORMED_FITTING_PORTS');

    const sourceA = sourceEquipment('550e8400-e29b-41d4-a716-446655440065', 0, 0, {
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440067',
    });
    const parentA = ductRun('550e8400-e29b-41d4-a716-446655440067', 0, 0, 10, {
      connectedFrom: sourceA.id,
      connectedTo: '550e8400-e29b-41d4-a716-446655440069',
    });
    const parentB = ductRun('550e8400-e29b-41d4-a716-446655440068', 120, 0, 10, {
      connectedTo: '550e8400-e29b-41d4-a716-446655440069',
    });
    const child = ductRun('550e8400-e29b-41d4-a716-446655440069', 240, 0, 10, {
      connectedFrom: parentA.id,
    });
    const multiParentEntities = { [sourceA.id]: sourceA, [parentA.id]: parentA, [parentB.id]: parentB, [child.id]: child };
    const multiParentResults = TopologyValidationService.validate(
      ConnectionGraphBuilder.buildFromPersistedMetadata(multiParentEntities),
      multiParentEntities
    );
    expect(multiParentResults.find((result) => result.reason === 'MULTIPLE_UPSTREAM_PATHS')?.reason).toBe(
      'MULTIPLE_UPSTREAM_PATHS'
    );
  });
});

describe('PressurePropagationService and velocity thresholds', () => {
  it('propagates available static pressure downstream through duct_run and fitting nodes', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440050', 0, 0, {
      staticPressure: 2,
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440051',
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440051', 0, 0, 10, {
      connectedFrom: source.id,
      airflow: 1000,
    });
    const elbow = fitting('550e8400-e29b-41d4-a716-446655440052', 120, 0, {
      fittingType: 'elbow_90',
      ports: [{ id: 'in', role: 'inlet', direction: 'in', connectedDuctRunId: run.id, connectedEnd: 'end' }],
    });
    const entities = { [source.id]: source, [run.id]: run, [elbow.id]: elbow };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);
    const validationResults = [{ componentId: 'c1', isValid: true, sourceEquipmentId: source.id, affectedEntityIds: Object.keys(entities) }];

    const results = PressurePropagationService.calculatePressures(graph, entities, validationResults);

    expect(results.get(run.id)?.cumulativePressureDrop).toBeGreaterThan(0);
    expect(results.get(run.id)?.availableStaticPressure).toBeLessThan(2);
    expect(results.get(elbow.id)?.cumulativePressureDrop).toBeGreaterThanOrEqual(results.get(run.id)!.cumulativePressureDrop);
  });

  it('classifies velocity using system type and topological role', () => {
    expect(ductVelocityThresholds.supply_main).toMatchObject({ greenMax: 1500, amberMax: 2500 });
    expect(classifyDuctVelocity(900, 'supply', 'branch')).toBe('green');
    expect(classifyDuctVelocity(1500, 'supply', 'branch')).toBe('amber');
    expect(classifyDuctVelocity(1900, 'supply', 'branch')).toBe('red');
    expect(Object.keys(ductVelocityThresholds).sort()).toEqual([
      'exhaust_branch',
      'exhaust_main',
      'outside_air_branch',
      'outside_air_main',
      'return_branch',
      'return_main',
      'supply_branch',
      'supply_main',
      'unassigned_branch',
      'unassigned_main',
    ]);
  });
});
