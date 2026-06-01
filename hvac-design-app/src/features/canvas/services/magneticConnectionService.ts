import type { Entity, Equipment } from '@/core/schema';
import type { ConnectionPort } from '@/core/schema/equipment.schema';
import { feetToPixels } from '@/core/constants/coordinates';
import { getDuctStartAndEnd, type DuctLike } from './ductGeometryHelpers';
import type { ConnectionRole } from './fittingConnectionService';
import { getEquipmentPlanBounds, getPortWorldPosition } from './equipmentGeometry';
import { resolveDuctConnectionProfile, type DuctConnectionProfile } from './ductConnectionProfile';
import {
  collectConnectionPoints,
  findBestConnectionPoint,
  type ConnectionPointRef,
  type Point2D,
  type ResolvedConnectionPoint,
} from './connectionPoints';

const SNAP_TOLERANCE = feetToPixels(1);
const ENDPOINT_PRIORITY_TOLERANCE = SNAP_TOLERANCE;

// 'equipment_point' (object-origin snapping) was intentionally removed: ducts
// only connect to resolved connection points, never to an object origin.
export type MagneticSnapType = 'duct_endpoint' | 'fitting_port' | 'equipment_port' | 'duct_body';

export interface MagneticSnapResult {
  snapType: MagneticSnapType;
  point: { x: number; y: number };
  distance: number;
  angle?: number;
  ductId?: string;
  entityType?: 'duct' | 'duct_run' | 'equipment' | 'fitting';
  endPoint?: 'start' | 'end';
  projectionT?: number;
  fittingId?: string;
  fittingPortRole?: ConnectionRole;
  equipmentId?: string;
  equipmentPortId?: string;
  equipmentPortRole?: ConnectionPort['role'];
  connectionPointRef?: ConnectionPointRef;
  ductConnectionProfile?: DuctConnectionProfile;
}

export interface EquipmentPortSnapResult {
  adjustedEntityPosition: { x: number; y: number };
  snappedPortId: string;
  snappedDuctId: string;
  snappedDuctEndPoint: 'start' | 'end';
  ductConnectionProfile: DuctConnectionProfile;
  distance: number;
  point: { x: number; y: number };
}

interface DuctProjection {
  point: { x: number; y: number };
  distance: number;
  t: number;
  length: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
  angle: number;
}

function getDuctEndPoint(duct: DuctLike, endPoint: 'start' | 'end'): { x: number; y: number } {
  const points = getDuctStartAndEnd(duct);
  return endPoint === 'start' ? points.start : points.end;
}

function projectPointOntoDuct(duct: DuctLike, x: number, y: number): DuctProjection | null {
  const { start, end } = getDuctStartAndEnd(duct);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return null;
  }

  const ux = dx / length;
  const uy = dy / length;
  const projectedLength = (x - start.x) * ux + (y - start.y) * uy;
  const clampedLength = Math.max(0, Math.min(length, projectedLength));
  const t = clampedLength / length;
  const point = {
    x: start.x + clampedLength * ux,
    y: start.y + clampedLength * uy,
  };

  return {
    point,
    distance: Math.hypot(point.x - x, point.y - y),
    t,
    length,
    start,
    end,
    angle: duct.transform.rotation,
  };
}

/**
 * Unified connectable-port snapping (PR-2 / PR-4 / PR-7).
 *
 * Every fitting and equipment port is resolved through the single
 * connectionPoints layer and scored with the shared deterministic snap
 * function. There is intentionally no "snap to object origin" path — ducts only
 * ever connect to resolved connection points.
 */
function resolveBestConnectablePort(
  entitiesById: Record<string, Entity>,
  x: number,
  y: number,
  excludeIds: string[]
): MagneticSnapResult | null {
  const candidates = collectConnectionPoints(entitiesById, { excludeIds, includeOccupied: true });
  const best = findBestConnectionPoint({ x, y }, candidates, {
    tolerance: SNAP_TOLERANCE,
    includeOccupied: true,
  });

  if (!best) {
    return null;
  }

  return toConnectablePortSnap(best.connectionPoint, best.distance);
}

function toConnectablePortSnap(point: ResolvedConnectionPoint, distance: number): MagneticSnapResult {
  const base = {
    point: { x: point.worldPosition.x, y: point.worldPosition.y },
    distance,
    connectionPointRef: { objectId: point.objectId, connectionPointId: point.id } satisfies ConnectionPointRef,
  };

  if (point.objectType === 'fitting') {
    return {
      ...base,
      snapType: 'fitting_port',
      fittingId: point.objectId,
      fittingPortRole: normalizeFittingRole(point.role),
      // facingDirection gives the port a real orientation so duct tools no
      // longer drop fitting-port snaps for lack of an angle.
      angle: directionToAngle(point.facingDirection),
    };
  }

  return {
    ...base,
    snapType: 'equipment_port',
    equipmentId: point.objectId,
    equipmentPortId: point.id,
    equipmentPortRole: point.role as ConnectionPort['role'],
    entityType: 'equipment',
    angle: directionToAngle(point.facingDirection),
  };
}

function normalizeFittingRole(role: string | undefined): ConnectionRole {
  if (role === 'branch' || role === 'branch_out') {
    return 'branch';
  }
  if (role === 'outlet' || role === 'straight_out') {
    return 'outlet';
  }
  return 'inlet';
}

function directionToAngle(direction: Point2D): number {
  const degrees = (Math.atan2(direction.y, direction.x) * 180) / Math.PI;
  return ((degrees % 360) + 360) % 360;
}

function resolveNearestDuctEndpoint(ducts: DuctLike[], x: number, y: number): MagneticSnapResult | null {
  let nearest: MagneticSnapResult | null = null;

  for (const duct of ducts) {
    for (const endPoint of ['start', 'end'] as const) {
      const point = getDuctEndPoint(duct, endPoint);
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance > SNAP_TOLERANCE) {
        continue;
      }

      if (!nearest || distance < nearest.distance) {
        nearest = {
          snapType: 'duct_endpoint',
          point,
          distance,
          ductId: duct.id,
          entityType: duct.type,
          endPoint,
          angle: duct.transform.rotation,
          ductConnectionProfile: resolveDuctConnectionProfile(duct),
        };
      }
    }
  }

  return nearest;
}

function resolveNearestDuctBody(ducts: DuctLike[], x: number, y: number): MagneticSnapResult | null {
  let nearest: MagneticSnapResult | null = null;

  for (const duct of ducts) {
    const projection = projectPointOntoDuct(duct, x, y);
    if (!projection || projection.distance > SNAP_TOLERANCE) {
      continue;
    }

    const distanceFromStart = projection.t * projection.length;
    const distanceFromEnd = (1 - projection.t) * projection.length;

    if (
      projection.t <= 0 ||
      projection.t >= 1 ||
      distanceFromStart <= ENDPOINT_PRIORITY_TOLERANCE ||
      distanceFromEnd <= ENDPOINT_PRIORITY_TOLERANCE
    ) {
      continue;
    }

    if (!nearest || projection.distance < nearest.distance) {
      nearest = {
        snapType: 'duct_body',
        point: projection.point,
        distance: projection.distance,
        ductId: duct.id,
        entityType: duct.type,
        angle: projection.angle,
        projectionT: projection.t,
        ductConnectionProfile: resolveDuctConnectionProfile(duct),
      };
    }
  }

  return nearest;
}

export class MagneticConnectionService {
  static readonly SNAP_TOLERANCE = SNAP_TOLERANCE;

  static resolveSnapTarget(
    x: number,
    y: number,
    entitiesById: Record<string, Entity>,
    excludeIds: string[] = []
  ): MagneticSnapResult | null {
    const excluded = new Set(excludeIds);
    const ducts = Object.values(entitiesById).filter(
      (entity): entity is DuctLike =>
        (entity.type === 'duct' || entity.type === 'duct_run') && !excluded.has(entity.id)
    );

    return (
      resolveNearestDuctEndpoint(ducts, x, y) ??
      resolveNearestDuctBody(ducts, x, y) ??
      resolveBestConnectablePort(entitiesById, x, y, excludeIds)
    );
  }

  static resolveEquipmentPortSnap(
    equipment: Equipment,
    tentativePosition: { x: number; y: number },
    entitiesById: Record<string, Entity>,
    excludeIds: string[] = []
  ): EquipmentPortSnapResult | null {
    const excluded = new Set([equipment.id, ...excludeIds]);
    const ducts = Object.values(entitiesById).filter(
      (entity): entity is DuctLike => (entity.type === 'duct' || entity.type === 'duct_run') && !excluded.has(entity.id)
    );
    const tentativeEquipment: Equipment = {
      ...equipment,
      transform: {
        ...equipment.transform,
        x: tentativePosition.x,
        y: tentativePosition.y,
      },
    };
    const bounds = getEquipmentPlanBounds(tentativeEquipment);
    let nearest: EquipmentPortSnapResult | null = null;

    for (const port of tentativeEquipment.props.connectionPorts ?? []) {
      const portPoint = getPortWorldPosition(port, bounds);

      for (const duct of ducts) {
        for (const endPoint of ['start', 'end'] as const) {
          const ductPoint = getDuctEndPoint(duct, endPoint);
          const distance = Math.hypot(portPoint.x - ductPoint.x, portPoint.y - ductPoint.y);
          if (distance > SNAP_TOLERANCE || (nearest && distance >= nearest.distance)) {
            continue;
          }

          nearest = {
            adjustedEntityPosition: {
              x: tentativePosition.x + ductPoint.x - portPoint.x,
              y: tentativePosition.y + ductPoint.y - portPoint.y,
            },
            snappedPortId: port.id,
            snappedDuctId: duct.id,
            snappedDuctEndPoint: endPoint,
            ductConnectionProfile: resolveDuctConnectionProfile(duct),
            distance,
            point: ductPoint,
          };
        }
      }
    }

    return nearest;
  }
}

export const magneticConnectionService = MagneticConnectionService;
