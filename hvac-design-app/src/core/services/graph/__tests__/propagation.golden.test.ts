import { describe, expect, it } from 'vitest';
import type { DuctRun, Entity, Equipment, Fitting } from '@/core/schema';
import type { ConnectionGraph, TopologyValidationResult } from '../types';
import { FlowPropagationService } from '../FlowPropagationService';
import { PressurePropagationService } from '../../calculations/PressurePropagationService';
import { sourceNotes } from '../../calculations/__tests__/goldenFixtures';

const now = '2026-01-01T00:00:00.000Z';

function graph(connections: Record<string, string[]>): ConnectionGraph {
  return {
    version: 1,
    timestamp: 0,
    signature: 'ws9-golden-tree',
    nodes: new Map(
      Object.entries(connections).map(([id, ids]) => [
        id,
        { id, entityId: id, type: id.startsWith('eq') || id.startsWith('diff') || id.startsWith('grille') ? 'equipment' : id.startsWith('fit') ? 'fitting' : 'duct_run', connections: ids, metadata: {} },
      ])
    ),
    edges: new Map(),
  };
}

function equipment(id: string, equipmentType: Equipment['props']['equipmentType'], capacity: number, staticPressure = 1): Equipment {
  return {
    id,
    type: 'equipment',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      equipmentType,
      capacity,
      capacityUnit: 'CFM',
      staticPressure,
      staticPressureUnit: 'in_wg',
      width: 24,
      depth: 24,
      height: 12,
      mountHeightUnit: 'in',
    },
  };
}

function run(id: string, installLength: number, velocity: number, airflow = 1000): DuctRun {
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
      airflow,
      staticPressure: 1,
      installLength,
      segments: [{ index: 0, startStation: 0, endStation: installLength, length: installLength, isPartial: false }],
    },
    calculated: {
      area: Math.PI * 6 ** 2,
      velocity,
      frictionLoss: 0,
      cumulativePressureDrop: 0,
      availableStaticPressure: 1,
    },
  };
}

function fitting(id: string, equivalentLength: number): Fitting {
  return {
    id,
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: { engineeringSystem: 'standard_duct', fittingType: 'tee', autoInserted: true, manualOverride: false },
    calculated: { equivalentLength, pressureLoss: 0 },
  };
}

describe('WS9 golden flow and pressure propagation', () => {
  function smallTree() {
    const entities: Record<string, Entity> = {
      eqSource: equipment('eqSource', 'air_handler', 1000),
      ductMain: run('ductMain', 10, 1500),
      fitTee: fitting('fitTee', 10),
      ductA: run('ductA', 10, 1200, 300),
      ductB: run('ductB', 10, 1200, 200),
      diffA: equipment('diffA', 'diffuser', 300),
      grilleB: equipment('grilleB', 'grille', 200),
    };
    const tree = graph({
      eqSource: ['ductMain'],
      ductMain: ['eqSource', 'fitTee'],
      fitTee: ['ductMain', 'ductA', 'ductB'],
      ductA: ['fitTee', 'diffA'],
      ductB: ['fitTee', 'grilleB'],
      diffA: ['ductA'],
      grilleB: ['ductB'],
    });
    return { entities, tree };
  }

  it('accumulates branch terminal CFM through a small leaf-peeling tree', () => {
    expect(sourceNotes.propagation).toContain('leaf-peeling');
    const { entities, tree } = smallTree();

    const flows = FlowPropagationService.calculateFlows(tree, entities);

    expect(flows.get('ductA')).toBe(300);
    expect(flows.get('ductB')).toBe(200);
  });

  // BUG WS9-AF-002 (docs/ductwork-program/WS9-engine-divergences.md): a rooted
  // source (AHU) is degree-1, so FlowPropagationService queues it as a leaf and
  // finalizes the trunk duct at 0 CFM before downstream demand peels up through
  // the tee. The trunk should carry the sum of branch demand (500). Fixed by
  // excluding zero-flow source equipment from initial queue seeding.
  it('accumulates summed branch demand on the trunk upstream of the tee', () => {
    const { entities, tree } = smallTree();

    const flows = FlowPropagationService.calculateFlows(tree, entities);

    expect(flows.get('ductMain')).toBe(500);
  });

  it('accumulates duct friction and fitting loss from source static pressure', () => {
    const entities: Record<string, Entity> = {
      eqSource: equipment('eqSource', 'air_handler', 1000, 1),
      ductMain: run('ductMain', 50, 1500),
      fitElbow: fitting('fitElbow', 10),
      ductBranch: run('ductBranch', 25, 1500),
      diffA: equipment('diffA', 'diffuser', 1000),
    };
    const line = graph({
      eqSource: ['ductMain'],
      ductMain: ['eqSource', 'fitElbow'],
      fitElbow: ['ductMain', 'ductBranch'],
      ductBranch: ['fitElbow', 'diffA'],
      diffA: ['ductBranch'],
    });
    const validation: TopologyValidationResult[] = [{
      componentId: 'component-1',
      isValid: true,
      sourceEquipmentId: 'eqSource',
      affectedEntityIds: Object.keys(entities),
    }];

    const pressures = PressurePropagationService.calculatePressures(line, entities, validation);

    expect(pressures.get('ductMain')).toEqual({ pressureLoss: 0.12, cumulativePressureDrop: 0.12, availableStaticPressure: 0.88 });
    expect(pressures.get('fitElbow')).toEqual({ pressureLoss: 0.02, cumulativePressureDrop: 0.14, availableStaticPressure: 0.86 });
    expect(pressures.get('ductBranch')).toEqual({ pressureLoss: 0.06, cumulativePressureDrop: 0.2, availableStaticPressure: 0.8 });
  });
});
