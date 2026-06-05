import { describe, expect, it } from 'vitest';
import type { DuctRun, Entity, Equipment, Fitting } from '@/core/schema';
import { ConnectionGraphBuilder } from '../ConnectionGraphBuilder';
import { ConnectionReconciliationService } from '../ConnectionReconciliationService';
import { FlowPropagationService } from '../FlowPropagationService';
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
    } as DuctRun['props'],
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

  it('writes AHU supply and return port connections from snapped duct endpoints', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440070', 0, 0, {
      width: 60,
      depth: 48,
      connectionPorts: [
        { id: 'supply-1', role: 'supply', edge: 'east', offsetRatio: 0.3, label: 'Supply' },
        { id: 'return-1', role: 'return', edge: 'west', offsetRatio: 0.3, label: 'Return' },
      ],
    });
    const supplyRun = ductRun('550e8400-e29b-41d4-a716-446655440071', 60, 14.4);
    const returnRun = ductRun('550e8400-e29b-41d4-a716-446655440072', -120, 14.4, 10, {
      endPoint: { x: 0, y: 14.4 },
    });

    const reconciled = ConnectionReconciliationService.reconcile({
      [source.id]: source,
      [supplyRun.id]: supplyRun,
      [returnRun.id]: returnRun,
    });

    const ports = (reconciled[source.id] as Equipment).props.connectionPorts ?? [];
    expect(ports.find((port) => port.id === 'supply-1')?.connectedDuctId).toBe(supplyRun.id);
    expect(ports.find((port) => port.id === 'return-1')?.connectedDuctId).toBe(returnRun.id);
    expect((reconciled[supplyRun.id] as DuctRun).props.connectedFrom).toBe(source.id);
    expect((reconciled[returnRun.id] as DuctRun).props.connectedTo).toBe(source.id);
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

  it('records explicit connection points when endpoints align with resolved tee ports', () => {
    // Tee centred at (200,140): resolved ports INLET (174.8,140), OUTLET (225.2,140), BRANCH (200,116).
    const inlet = ductRun('550e8400-e29b-41d4-a716-4466554400a1', 100, 140, 10, {
      startPoint: { x: 100, y: 140 },
      endPoint: { x: 174.8, y: 140 },
    });
    const straight = ductRun('550e8400-e29b-41d4-a716-4466554400a2', 225.2, 140, 10, {
      startPoint: { x: 225.2, y: 140 },
      endPoint: { x: 320, y: 140 },
    });
    const branch = ductRun('550e8400-e29b-41d4-a716-4466554400a3', 200, 116, 10, {
      startPoint: { x: 200, y: 116 },
      endPoint: { x: 230, y: 88 },
    });
    const tee = fitting('550e8400-e29b-41d4-a716-4466554400a4', 200, 140, { fittingType: 'tee' });

    const reconciled = ConnectionReconciliationService.reconcile({
      [inlet.id]: inlet,
      [straight.id]: straight,
      [branch.id]: branch,
      [tee.id]: tee,
    });

    const reconciledTee = reconciled[tee.id] as Fitting;
    // PR-2: every connection refers to objectInstanceId + connectionPointId (pointIndex), never the origin.
    expect(reconciledTee.props.connectionPoints).toEqual(
      expect.arrayContaining([
        { ductId: inlet.id, pointIndex: 0 },
        { ductId: straight.id, pointIndex: 1 },
        { ductId: branch.id, pointIndex: 2 },
      ])
    );
    expect(reconciledTee.props.ports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'inlet', connectedDuctRunId: inlet.id }),
        expect.objectContaining({ role: 'straight_out', connectedDuctRunId: straight.id }),
        expect.objectContaining({ role: 'branch_out', connectedDuctRunId: branch.id }),
      ])
    );
  });

  it('cuts legacy origin-connected auto-fitted ducts back to resolved tee ports', () => {
    const junction = { x: 200, y: 140 };
    const inlet = ductRun('550e8400-e29b-41d4-a716-4466554400b1', 100, 140, 10, {
      startPoint: { x: 100, y: 140 },
      endPoint: junction,
    });
    const straight = ductRun('550e8400-e29b-41d4-a716-4466554400b2', 200, 140, 10, {
      startPoint: junction,
      endPoint: { x: 320, y: 140 },
    });
    const branch = ductRun('550e8400-e29b-41d4-a716-4466554400b3', 200, 140, 10, {
      startPoint: junction,
      endPoint: { x: 200, y: 60 },
    });
    const tee = fitting('550e8400-e29b-41d4-a716-4466554400b4', junction.x, junction.y, {
      fittingType: 'tee',
      autoInserted: true,
      connectionPoints: [
        { ductId: inlet.id, pointIndex: 0 },
        { ductId: straight.id, pointIndex: 1 },
        { ductId: branch.id, pointIndex: 2 },
      ],
    });

    const reconciled = ConnectionReconciliationService.reconcile({
      [inlet.id]: inlet,
      [straight.id]: straight,
      [branch.id]: branch,
      [tee.id]: tee,
    });

    expect((reconciled[inlet.id] as DuctRun).props.endPoint).toEqual({ x: 174.8, y: 140 });
    expect((reconciled[straight.id] as DuctRun).props.startPoint).toEqual({ x: 225.2, y: 140 });
    expect((reconciled[branch.id] as DuctRun).props.startPoint).toEqual({ x: 200, y: 116 });
    expect((reconciled[tee.id] as Fitting).props.connectionPoints).toEqual([
      { ductId: inlet.id, pointIndex: 0 },
      { ductId: straight.id, pointIndex: 1 },
      { ductId: branch.id, pointIndex: 2 },
    ]);
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

  it('builds directed equipment port edges from persisted connectionPorts metadata', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440080', 0, 0, {
      connectionPorts: [
        {
          id: 'supply-1',
          role: 'supply',
          edge: 'east',
          offsetRatio: 0.3,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440081',
        },
        {
          id: 'return-1',
          role: 'return',
          edge: 'west',
          offsetRatio: 0.3,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440082',
        },
      ],
    });
    const supplyRun = ductRun('550e8400-e29b-41d4-a716-446655440081', 60, 14.4);
    const returnRun = ductRun('550e8400-e29b-41d4-a716-446655440082', -120, 14.4);

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [source.id]: source,
      [supplyRun.id]: supplyRun,
      [returnRun.id]: returnRun,
    });

    expect(graph.edges.get(`${source.id}:supply-1->${supplyRun.id}`)).toMatchObject({
      source: source.id,
      target: supplyRun.id,
    });
    expect(graph.edges.get(`${returnRun.id}->${source.id}:return-1`)).toMatchObject({
      source: returnRun.id,
      target: source.id,
    });
  });

  it('annotates equipment port graph edges with explicit connection point references', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440140', 0, 0, {
      connectionPorts: [
        {
          id: 'supply-1',
          role: 'supply',
          edge: 'east',
          offsetRatio: 0.5,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440141',
        },
        {
          id: 'return-1',
          role: 'return',
          edge: 'west',
          offsetRatio: 0.5,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440142',
        },
      ],
    });
    const supplyRun = ductRun('550e8400-e29b-41d4-a716-446655440141', 60, 24, 10, {
      connectedFrom: source.id,
    });
    const returnRun = ductRun('550e8400-e29b-41d4-a716-446655440142', -120, 24, 10, {
      connectedTo: source.id,
    });

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [source.id]: source,
      [supplyRun.id]: supplyRun,
      [returnRun.id]: returnRun,
    });

    expect(graph.edges.get(`${source.id}:supply-1->${supplyRun.id}`)?.metadata).toMatchObject({
      sourceEndpoint: { objectId: source.id, objectType: 'equipment', connectionPointId: 'supply-1' },
      targetEndpoint: { objectId: supplyRun.id, objectType: 'duct_run', connectionPointId: 'start' },
    });
    expect(graph.edges.get(`${returnRun.id}->${source.id}:return-1`)?.metadata).toMatchObject({
      sourceEndpoint: { objectId: returnRun.id, objectType: 'duct_run', connectionPointId: 'end' },
      targetEndpoint: { objectId: source.id, objectType: 'equipment', connectionPointId: 'return-1' },
    });
  });

  it('annotates fitting graph edges with resolved fitting port and duct endpoint references', () => {
    const inlet = ductRun('550e8400-e29b-41d4-a716-446655440143', 0, 0);
    const outlet = ductRun('550e8400-e29b-41d4-a716-446655440144', 120, 0);
    const branch = ductRun('550e8400-e29b-41d4-a716-446655440145', 120, 0, 10, { startPoint: { x: 120, y: 0 } });
    const wye = fitting('550e8400-e29b-41d4-a716-446655440146', 120, 0, {
      fittingType: 'wye',
      ports: [
        { id: 'in', role: 'inlet', direction: 'in', connectedDuctRunId: inlet.id, connectedEnd: 'end' },
        { id: 'out', role: 'outlet', direction: 'out', connectedDuctRunId: outlet.id, connectedEnd: 'start' },
        { id: 'branch', role: 'branch_out', direction: 'out', connectedDuctRunId: branch.id, connectedEnd: 'start' },
      ],
    });

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [inlet.id]: inlet,
      [outlet.id]: outlet,
      [branch.id]: branch,
      [wye.id]: wye,
    });

    expect(graph.edges.get(`${inlet.id}->${wye.id}`)?.metadata).toMatchObject({
      sourceEndpoint: { objectId: inlet.id, objectType: 'duct_run', connectionPointId: 'end' },
      targetEndpoint: { objectId: wye.id, objectType: 'fitting', connectionPointId: 'INLET' },
    });
    expect(graph.edges.get(`${wye.id}->${branch.id}`)?.metadata).toMatchObject({
      sourceEndpoint: { objectId: wye.id, objectType: 'fitting', connectionPointId: 'BRANCH' },
      targetEndpoint: { objectId: branch.id, objectType: 'duct_run', connectionPointId: 'start' },
    });
  });

  it('resolves equipment port edge direction from airflow role for exhaust, outdoor air, relief, and inline ports', () => {
    const equipment = sourceEquipment('550e8400-e29b-41d4-a716-446655440085', 0, 0, {
      connectionPorts: [
        {
          id: 'exhaust-1',
          role: 'exhaust',
          edge: 'north',
          offsetRatio: 0.2,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440086',
        },
        {
          id: 'outdoor-air-1',
          role: 'outdoor_air',
          edge: 'north',
          offsetRatio: 0.4,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440087',
        },
        {
          id: 'relief-1',
          role: 'relief',
          edge: 'north',
          offsetRatio: 0.6,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440088',
        },
        {
          id: 'inline-1',
          role: 'inline',
          edge: 'north',
          offsetRatio: 0.8,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440089',
        },
      ],
    });
    const exhaustRun = ductRun('550e8400-e29b-41d4-a716-446655440086', 0, -120);
    const outdoorAirRun = ductRun('550e8400-e29b-41d4-a716-446655440087', 60, -120);
    const reliefRun = ductRun('550e8400-e29b-41d4-a716-446655440088', 120, -120);
    const inlineRun = ductRun('550e8400-e29b-41d4-a716-446655440089', 180, -120);

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [equipment.id]: equipment,
      [exhaustRun.id]: exhaustRun,
      [outdoorAirRun.id]: outdoorAirRun,
      [reliefRun.id]: reliefRun,
      [inlineRun.id]: inlineRun,
    });

    expect(graph.edges.get(`${equipment.id}:exhaust-1->${exhaustRun.id}`)).toMatchObject({
      source: equipment.id,
      target: exhaustRun.id,
    });
    expect(graph.edges.get(`${outdoorAirRun.id}->${equipment.id}:outdoor-air-1`)).toMatchObject({
      source: outdoorAirRun.id,
      target: equipment.id,
    });
    expect(graph.edges.get(`${equipment.id}:relief-1->${reliefRun.id}`)).toMatchObject({
      source: equipment.id,
      target: reliefRun.id,
    });
    expect(graph.edges.get(`${equipment.id}:inline-1->${inlineRun.id}`)).toMatchObject({
      source: equipment.id,
      target: inlineRun.id,
    });
  });

  it('falls back to connection port id when legacy port metadata is missing a role', () => {
    const equipment = sourceEquipment('550e8400-e29b-41d4-a716-446655440092', 0, 0, {
      connectionPorts: [
        {
          id: 'supply-legacy',
          edge: 'east',
          offsetRatio: 0.5,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440093',
        } as Equipment['props']['connectionPorts'][number],
      ],
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440093', 60, 24);

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [equipment.id]: equipment,
      [run.id]: run,
    });

    expect(graph.edges.get(`${equipment.id}:supply-legacy->${run.id}`)).toMatchObject({
      source: equipment.id,
      target: run.id,
    });
  });

  it('orients terminal air-device ports by equipment context, not just raw port role', () => {
    const supplyRun = ductRun('550e8400-e29b-41d4-a716-446655440097', 0, 0);
    const diffuser = sourceEquipment('550e8400-e29b-41d4-a716-446655440098', 120, 0, {
      equipmentType: 'diffuser',
      connectionPorts: [
        {
          id: 'supply-1',
          role: 'supply',
          edge: 'west',
          offsetRatio: 0.5,
          connectedDuctId: supplyRun.id,
        },
      ],
    });
    const returnRun = ductRun('550e8400-e29b-41d4-a716-446655440099', 0, 120);
    const grille = sourceEquipment('550e8400-e29b-41d4-a716-446655440100', 120, 120, {
      equipmentType: 'grille',
      connectionPorts: [
        {
          id: 'return-1',
          role: 'return',
          edge: 'west',
          offsetRatio: 0.5,
          connectedDuctId: returnRun.id,
        },
      ],
    });
    const exhaustRun = ductRun('550e8400-e29b-41d4-a716-446655440101', 0, 240);
    const hood = sourceEquipment('550e8400-e29b-41d4-a716-446655440102', 120, 240, {
      equipmentType: 'hood',
      connectionPorts: [
        {
          id: 'exhaust-1',
          role: 'exhaust',
          edge: 'west',
          offsetRatio: 0.5,
          connectedDuctId: exhaustRun.id,
        },
      ],
    });

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [supplyRun.id]: supplyRun,
      [diffuser.id]: diffuser,
      [returnRun.id]: returnRun,
      [grille.id]: grille,
      [exhaustRun.id]: exhaustRun,
      [hood.id]: hood,
    });

    expect(graph.edges.get(`${supplyRun.id}->${diffuser.id}:supply-1`)).toMatchObject({
      source: supplyRun.id,
      target: diffuser.id,
    });
    expect(graph.edges.get(`${grille.id}:return-1->${returnRun.id}`)).toMatchObject({
      source: grille.id,
      target: returnRun.id,
    });
    expect(graph.edges.get(`${hood.id}:exhaust-1->${exhaustRun.id}`)).toMatchObject({
      source: hood.id,
      target: exhaustRun.id,
    });
  });

  it('deduplicates equipment port and reciprocal duct metadata as one logical connection', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440083', 0, 0, {
      connectionPorts: [
        {
          id: 'supply-1',
          role: 'supply',
          edge: 'east',
          offsetRatio: 0.3,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440084',
        },
      ],
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440084', 60, 14.4, 10, {
      connectedFrom: source.id,
    });
    const entities = { [source.id]: source, [run.id]: run };

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);
    const sourceToRunEdges = Array.from(graph.edges.values()).filter(
      (edge) => edge.source === source.id && edge.target === run.id
    );
    const [result] = TopologyValidationService.validate(graph, entities);

    expect(sourceToRunEdges).toHaveLength(1);
    expect(result).toMatchObject({ isValid: true, sourceEquipmentId: source.id });
  });

  it('preserves distinct equipment port connection points on the same equipment and duct pair', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440103', 0, 0, {
      connectionPorts: [
        {
          id: 'supply-low',
          role: 'supply',
          edge: 'east',
          offsetRatio: 0.25,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440104',
        },
        {
          id: 'supply-high',
          role: 'supply',
          edge: 'east',
          offsetRatio: 0.75,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440104',
        },
      ],
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440104', 60, 24);

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata({
      [source.id]: source,
      [run.id]: run,
    });

    expect(graph.edges.get(`${source.id}:supply-low->${run.id}`)).toMatchObject({
      source: source.id,
      target: run.id,
    });
    expect(graph.edges.get(`${source.id}:supply-high->${run.id}`)).toMatchObject({
      source: source.id,
      target: run.id,
    });
  });

  it('collapses contradictory reciprocal duct metadata into a single physical edge', () => {
    // A and B each name the other as their downstream (`connectedTo`), producing directional
    // edges A->B and B->A for one physical link. The canonical pair key must keep only one,
    // otherwise TopologyValidationService reads the reversed pair as a false 2-cycle.
    const runA = ductRun('550e8400-e29b-41d4-a716-446655440120', 0, 0, 10, {
      connectedTo: '550e8400-e29b-41d4-a716-446655440121',
    });
    const runB = ductRun('550e8400-e29b-41d4-a716-446655440121', 120, 0, 10, {
      connectedTo: '550e8400-e29b-41d4-a716-446655440120',
    });
    const entities = { [runA.id]: runA, [runB.id]: runB };

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);
    const pairEdges = Array.from(graph.edges.values()).filter(
      (edge) =>
        (edge.source === runA.id && edge.target === runB.id) ||
        (edge.source === runB.id && edge.target === runA.id)
    );

    expect(pairEdges).toHaveLength(1);
    const [result] = TopologyValidationService.validate(graph, entities);
    expect(result.reason).not.toBe('CYCLE_DETECTED');
  });
});

describe('TopologyValidationService', () => {
  it('treats exhaust fans as source equipment for exhaust networks', () => {
    const exhaustFan = sourceEquipment('550e8400-e29b-41d4-a716-446655440110', 0, 0, {
      equipmentType: 'exhaust_fan',
      capacity: 750,
      connectionPorts: [
        {
          id: 'exhaust-1',
          role: 'exhaust',
          edge: 'north',
          offsetRatio: 0.5,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440111',
        },
      ],
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440111', 0, -120);
    const entities = { [exhaustFan.id]: exhaustFan, [run.id]: run };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);

    const [result] = TopologyValidationService.validate(graph, entities);
    const flows = FlowPropagationService.calculateFlows(graph, entities);

    expect(result).toMatchObject({ isValid: true, sourceEquipmentId: exhaustFan.id });
    expect(flows.get(run.id)).toBe(750);
  });

  it('classifies return ducts reachable through incoming airflow edges from source equipment', () => {
    const airHandler = sourceEquipment('550e8400-e29b-41d4-a716-446655440120', 0, 0, {
      connectionPorts: [
        {
          id: 'return-1',
          role: 'return',
          edge: 'west',
          offsetRatio: 0.5,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440121',
        },
      ],
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440121', -120, 0, 10, {
      airflow: 500,
      connectedTo: airHandler.id,
    });
    const grille = sourceEquipment('550e8400-e29b-41d4-a716-446655440122', -240, 0, {
      equipmentType: 'grille',
      capacity: 500,
      connectionPorts: [
        {
          id: 'return-1',
          role: 'return',
          edge: 'east',
          offsetRatio: 0.5,
          connectedDuctId: run.id,
        },
      ],
    });
    const entities = { [airHandler.id]: airHandler, [run.id]: run, [grille.id]: grille };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);

    const [result] = TopologyValidationService.validate(graph, entities);

    expect(result).toMatchObject({ isValid: true, sourceEquipmentId: airHandler.id });
    expect(result?.ductRoles).toMatchObject({ [run.id]: 'main' });
  });

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
  it('uses return grille capacity as terminal demand for connected return duct runs', () => {
    const airHandler = sourceEquipment('550e8400-e29b-41d4-a716-446655440094', 0, 0, {
      connectionPorts: [
        {
          id: 'return-1',
          role: 'return',
          edge: 'west',
          offsetRatio: 0.5,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440095',
        },
      ],
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440095', -120, 0, 10, {
      connectedTo: airHandler.id,
    });
    const grille = sourceEquipment('550e8400-e29b-41d4-a716-446655440096', -240, 0, {
      equipmentType: 'grille',
      capacity: 325,
      connectionPorts: [
        {
          id: 'return-1',
          role: 'return',
          edge: 'east',
          offsetRatio: 0.5,
          connectedDuctId: run.id,
        },
      ],
    });
    const entities = { [airHandler.id]: airHandler, [run.id]: run, [grille.id]: grille };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);

    const flows = FlowPropagationService.calculateFlows(graph, entities);

    expect(flows.get(run.id)).toBe(325);
  });

  it('uses source equipment capacity as duct airflow when no terminal CFM is assigned', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655440090', 0, 0, {
      capacity: 2000,
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440091',
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440091', 0, 0, 10, {
      airflow: 0,
      connectedFrom: source.id,
    });
    const entities = { [source.id]: source, [run.id]: run };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);

    const flows = FlowPropagationService.calculateFlows(graph, entities);

    expect(flows.get(run.id)).toBe(2000);
  });

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

  it('propagates source static pressure across return ducts connected by incoming airflow edges', () => {
    const airHandler = sourceEquipment('550e8400-e29b-41d4-a716-446655440130', 0, 0, {
      staticPressure: 1.5,
      connectionPorts: [
        {
          id: 'return-1',
          role: 'return',
          edge: 'west',
          offsetRatio: 0.5,
          connectedDuctId: '550e8400-e29b-41d4-a716-446655440131',
        },
      ],
    });
    const run = ductRun('550e8400-e29b-41d4-a716-446655440131', -120, 0, 10, {
      airflow: 2000,
      connectedTo: airHandler.id,
    });
    const grille = sourceEquipment('550e8400-e29b-41d4-a716-446655440132', -240, 0, {
      equipmentType: 'grille',
      capacity: 2000,
      connectionPorts: [
        {
          id: 'return-1',
          role: 'return',
          edge: 'east',
          offsetRatio: 0.5,
          connectedDuctId: run.id,
        },
      ],
    });
    const entities = { [airHandler.id]: airHandler, [run.id]: run, [grille.id]: grille };
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);
    const validationResults = TopologyValidationService.validate(graph, entities);

    const results = PressurePropagationService.calculatePressures(graph, entities, validationResults);

    expect(results.get(run.id)?.cumulativePressureDrop).toBeGreaterThan(0);
    expect(results.get(run.id)?.availableStaticPressure).toBeLessThan(1.5);
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
