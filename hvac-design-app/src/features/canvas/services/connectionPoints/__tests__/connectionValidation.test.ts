import { describe, expect, it } from 'vitest';
import type { Duct, Entity, Equipment, Fitting } from '@/core/schema';
import { buildConnectionEdges, isProfileCompatible, validateConnections } from '../connectionValidation';

const now = '2026-01-01T00:00:00.000Z';

function duct(id: string, x: number, y: number, diameter = 12): Duct {
  return {
    id,
    type: 'duct',
    transform: { x, y, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: `Duct ${id}`,
      engineeringSystem: 'standard_duct',
      shape: 'round',
      diameter,
      length: 10,
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
    },
    calculated: { area: 113, velocity: 0, frictionLoss: 0 },
  };
}

function fitting(
  id: string,
  fittingType: Fitting['props']['fittingType'],
  connectionPoints: { ductId: string; pointIndex?: number }[]
): Fitting {
  return {
    id,
    type: 'fitting',
    transform: { x: 200, y: 140, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 10,
    createdAt: now,
    modifiedAt: now,
    props: {
      engineeringSystem: 'standard_duct',
      fittingType,
      manualOverride: false,
      connectionPoints,
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

function byId(...entities: Entity[]): Record<string, Entity> {
  return Object.fromEntries(entities.map((entity) => [entity.id, entity]));
}

describe('validateConnections', () => {
  it('reports no issues for connections coincident with their resolved ports', () => {
    // cap INLET resolves to world (182.36,140) for a fitting centred at (200,140).
    const connected = duct('11111111-1111-1111-1111-111111111111', 182.36, 140);
    const cap = fitting('22222222-2222-2222-2222-222222222222', 'cap', [{ ductId: connected.id, pointIndex: 0 }]);

    expect(validateConnections(byId(connected, cap))).toEqual([]);
  });

  it('validates 1-, 2-, and 3-port objects identically with no core changes', () => {
    // cap (1 port) INLET=182.36, reducer (2 ports) INLET=174.8, tee (3 ports) INLET=174.8.
    const capDuct = duct('aaaaaaaa-0000-0000-0000-000000000001', 182.36, 140);
    const cap = fitting('aaaaaaaa-0000-0000-0000-0000000000c1', 'cap', [{ ductId: capDuct.id, pointIndex: 0 }]);

    const reducerDuct = duct('aaaaaaaa-0000-0000-0000-000000000002', 174.8, 140);
    const reducer = fitting('aaaaaaaa-0000-0000-0000-0000000000c2', 'reducer', [{ ductId: reducerDuct.id, pointIndex: 0 }]);

    const teeDuct = duct('aaaaaaaa-0000-0000-0000-000000000003', 174.8, 140);
    const tee = fitting('aaaaaaaa-0000-0000-0000-0000000000c3', 'tee', [{ ductId: teeDuct.id, pointIndex: 0 }]);

    expect(validateConnections(byId(capDuct, cap))).toEqual([]);
    expect(validateConnections(byId(reducerDuct, reducer))).toEqual([]);
    expect(validateConnections(byId(teeDuct, tee))).toEqual([]);
  });

  it('detects drift when an endpoint is not coincident with its port centre', () => {
    const drifted = duct('33333333-3333-3333-3333-333333333333', 200, 140); // 17.64px from cap INLET (182.36)
    const cap = fitting('44444444-4444-4444-4444-444444444444', 'cap', [{ ductId: drifted.id, pointIndex: 0 }]);

    const issues = validateConnections(byId(drifted, cap));
    const drift = issues.find((issue) => issue.code === 'drift');

    expect(drift).toBeDefined();
    expect(drift?.distance).toBeCloseTo(17.64, 1);
  });

  it('detects orphaned connections to a missing duct', () => {
    const cap = fitting('55555555-5555-5555-5555-555555555555', 'cap', [
      { ductId: '99999999-9999-9999-9999-999999999999', pointIndex: 0 },
    ]);

    const issues = validateConnections(byId(cap));
    expect(issues.map((issue) => issue.code)).toContain('orphaned_connection');
  });

  it('detects a missing port when the persisted index no longer resolves', () => {
    const connected = duct('66666666-6666-6666-6666-666666666666', 168, 140);
    const cap = fitting('77777777-7777-7777-7777-777777777777', 'cap', [{ ductId: connected.id, pointIndex: 7 }]);

    const issues = validateConnections(byId(connected, cap));
    expect(issues.map((issue) => issue.code)).toContain('missing_port');
  });

  it('detects port overuse beyond capacity', () => {
    const ductA = duct('88888888-0000-0000-0000-000000000001', 168, 140);
    const ductB = duct('88888888-0000-0000-0000-000000000002', 168, 140);
    const cap = fitting('88888888-0000-0000-0000-0000000000cc', 'cap', [
      { ductId: ductA.id, pointIndex: 0 },
      { ductId: ductB.id, pointIndex: 0 },
    ]);

    const issues = validateConnections(byId(ductA, ductB, cap));
    expect(issues.map((issue) => issue.code)).toContain('port_overuse');
  });

  it('detects profile incompatibility between endpoint and port', () => {
    const oversized = duct('aaaaaaaa-1111-1111-1111-111111111111', 168, 140, 24); // port default ø12
    const cap = fitting('bbbbbbbb-1111-1111-1111-111111111111', 'cap', [{ ductId: oversized.id, pointIndex: 0 }]);

    const issues = validateConnections(byId(oversized, cap));
    expect(issues.map((issue) => issue.code)).toContain('profile_mismatch');
  });
});

describe('buildConnectionEdges', () => {
  it('reads persisted fitting connections into endpoint↔port edges', () => {
    const connected = duct('cccccccc-1111-1111-1111-111111111111', 168, 140);
    const cap = fitting('dddddddd-1111-1111-1111-111111111111', 'cap', [{ ductId: connected.id, pointIndex: 0 }]);

    const edges = buildConnectionEdges(byId(connected, cap));
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      endpoint: { entityId: connected.id, endpoint: 'start' },
      connectionPoint: { objectId: cap.id, connectionPointId: 'INLET' },
    });
  });

  it('reads persisted equipment port connections via connectedDuctId', () => {
    const connected = duct('eeeeeeee-1111-1111-1111-111111111111', 160, 114.4);
    const equipment: Equipment = {
      id: 'ffffffff-1111-1111-1111-111111111111',
      type: 'equipment',
      transform: { x: 100, y: 100, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 5,
      createdAt: now,
      modifiedAt: now,
      props: {
        name: 'AHU-1',
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
        connectionPorts: [{ id: 'supply-1', role: 'supply', edge: 'east', offsetRatio: 0.3, connectedDuctId: connected.id }],
      },
    };

    const edges = buildConnectionEdges(byId(connected, equipment));
    expect(edges).toHaveLength(1);
    expect(edges[0].connectionPoint).toEqual({ objectId: equipment.id, connectionPointId: 'supply-1' });
  });
});

describe('isProfileCompatible', () => {
  it('treats unknown profiles as compatible', () => {
    expect(isProfileCompatible({ shape: 'unknown' }, { shape: 'round', diameter: 12 })).toBe(true);
  });

  it('matches round profiles within size tolerance and rejects beyond it', () => {
    expect(isProfileCompatible({ shape: 'round', diameter: 12 }, { shape: 'round', diameter: 12.2 })).toBe(true);
    expect(isProfileCompatible({ shape: 'round', diameter: 12 }, { shape: 'round', diameter: 18 })).toBe(false);
  });

  it('rejects mismatched shapes', () => {
    expect(isProfileCompatible({ shape: 'round', diameter: 12 }, { shape: 'rectangular', width: 12, height: 12 })).toBe(
      false
    );
  });
});
