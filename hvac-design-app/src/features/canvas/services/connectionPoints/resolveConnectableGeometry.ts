import type { Entity, Equipment, Fitting } from '@/core/schema';
import { resolveFittingGeometry } from './fittingResolver';
import { resolveEquipmentGeometry } from './equipmentResolver';
import type { ResolvedConnectableGeometry, ResolvedConnectionPoint } from './types';

/**
 * Central, object-type-agnostic dispatch (PR-3 / PR-7).
 *
 * The snapping, auto-fitting, validation and rendering layers MUST obtain
 * connection points through this single entry point so they all share one
 * resolved-geometry result. Adding a new connectable object type means adding
 * a resolver and one case here — no other layer should branch on object type.
 */
export function resolveConnectableGeometry(entity: Entity): ResolvedConnectableGeometry | null {
  switch (entity.type) {
    case 'fitting':
      return resolveFittingGeometry(entity as Fitting);
    case 'equipment':
      return resolveEquipmentGeometry(entity as Equipment);
    default:
      return null;
  }
}

/** True when an entity exposes resolvable connection points. */
export function isConnectableObject(entity: Entity): boolean {
  return entity.type === 'fitting' || entity.type === 'equipment';
}

export interface CollectConnectionPointsOptions {
  /** Entity ids to skip (e.g. the entity currently being dragged). */
  excludeIds?: Iterable<string>;
  /** When false (default) only `available` points are returned. */
  includeOccupied?: boolean;
}

/**
 * Resolve every connectable object in the model into a flat candidate list of
 * connection points. This is the input the snapping layer scores against, so
 * snapping never re-derives port positions per object type.
 */
export function collectConnectionPoints(
  entities: Record<string, Entity> | Iterable<Entity>,
  options: CollectConnectionPointsOptions = {}
): ResolvedConnectionPoint[] {
  const excluded = new Set(options.excludeIds ?? []);
  const list = isRecord(entities) ? Object.values(entities) : Array.from(entities);
  const points: ResolvedConnectionPoint[] = [];

  for (const entity of list) {
    if (excluded.has(entity.id) || !isConnectableObject(entity)) {
      continue;
    }

    const resolved = resolveConnectableGeometry(entity);
    if (!resolved) {
      continue;
    }

    for (const point of resolved.connectionPoints) {
      if (options.includeOccupied || point.status === 'available') {
        points.push(point);
      }
    }
  }

  return points;
}

function isRecord(value: Record<string, Entity> | Iterable<Entity>): value is Record<string, Entity> {
  return typeof (value as Iterable<Entity>)[Symbol.iterator] !== 'function';
}
