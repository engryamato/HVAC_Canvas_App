import type { DuctRun, Entity, Equipment, Fitting } from '@/core/schema';
import { calculateDuctArea, calculateEquivalentDiameter, calculateVelocity } from '@/features/canvas/calculators/ductSizing';
import { calculateFittingLoss, calculateFrictionLoss } from '@/features/canvas/calculators/pressureDrop';
import type { ConnectionGraph, PressureResult, TopologyValidationResult } from '../graph/types';

const MATERIAL_ROUGHNESS: Record<string, number> = {
  galvanized: 0.0005,
  stainless: 0.0002,
  aluminum: 0.0002,
  flex: 0.003,
};

export class PressurePropagationService {
  static calculatePressures(
    graph: ConnectionGraph,
    entities: Record<string, Entity>,
    validationResults: TopologyValidationResult[]
  ): Map<string, PressureResult> {
    const results = new Map<string, PressureResult>();
    const validResults = validationResults.filter((result) => result.isValid && result.sourceEquipmentId);

    for (const validation of validResults) {
      const source = entities[validation.sourceEquipmentId!];
      if (source?.type !== 'equipment') {
        continue;
      }

      const sourceStaticPressure = (source as Equipment).props.staticPressure;
      const queue: Array<{ id: string; cumulativePressureDrop: number; availableStaticPressure: number; frictionPer100: number }> = [
        {
          id: source.id,
          cumulativePressureDrop: 0,
          availableStaticPressure: sourceStaticPressure,
          frictionPer100: 0,
        },
      ];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) {
          continue;
        }
        visited.add(current.id);

        for (const childId of getOutgoing(graph, current.id)) {
          const child = entities[childId];
          if (!child || !validation.affectedEntityIds.includes(childId)) {
            continue;
          }

          const next = calculateNodePressure(child, current);
          if (next) {
            results.set(childId, next.result);
            queue.push({
              id: childId,
              cumulativePressureDrop: next.result.cumulativePressureDrop,
              availableStaticPressure: next.result.availableStaticPressure,
              frictionPer100: next.frictionPer100,
            });
          }
        }
      }
    }

    return results;
  }
}

function getOutgoing(graph: ConnectionGraph, nodeId: string): string[] {
  return Array.from(graph.edges.values())
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);
}

function calculateNodePressure(
  entity: Entity,
  previous: { cumulativePressureDrop: number; availableStaticPressure: number; frictionPer100: number }
): { result: PressureResult; frictionPer100: number } | null {
  if (entity.type === 'duct_run') {
    const run = entity as DuctRun;
    const area = calculateDuctArea(run.props.shape === 'round' || run.props.shape === 'flexible' ? 'round' : 'rectangular', {
      diameter: 'diameter' in run.props ? run.props.diameter : undefined,
      width: 'width' in run.props ? run.props.width : undefined,
      height: 'height' in run.props ? run.props.height : undefined,
    });
    const airflow = run.props.airflow;
    const velocity = run.calculated.velocity > 0 ? run.calculated.velocity : calculateVelocity(airflow, area);
    const equivalentDiameter =
      run.props.shape === 'round' || run.props.shape === 'flexible'
        ? 'diameter' in run.props ? run.props.diameter ?? 0 : 0
        : calculateEquivalentDiameter('width' in run.props ? run.props.width ?? 0 : 0, 'height' in run.props ? run.props.height ?? 0 : 0);
    const frictionPer100 = calculateFrictionLoss(
      velocity,
      equivalentDiameter,
      run.props.installLength,
      MATERIAL_ROUGHNESS[run.props.material]
    );
    const pressureLoss = round((frictionPer100 / 100) * run.props.installLength);
    return {
      frictionPer100,
      result: buildResult(previous, pressureLoss),
    };
  }

  if (entity.type === 'fitting') {
    const fitting = entity as Fitting;
    const pressureLoss = calculateFittingLoss(previous.frictionPer100, fitting.calculated.equivalentLength);
    return {
      frictionPer100: previous.frictionPer100,
      result: buildResult(previous, pressureLoss),
    };
  }

  return null;
}

function buildResult(
  previous: { cumulativePressureDrop: number; availableStaticPressure: number },
  pressureLoss: number
): PressureResult {
  const cumulativePressureDrop = round(previous.cumulativePressureDrop + pressureLoss);
  return {
    pressureLoss,
    cumulativePressureDrop,
    availableStaticPressure: round(Math.max(0, previous.availableStaticPressure - pressureLoss)),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
