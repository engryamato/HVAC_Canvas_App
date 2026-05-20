import type { Entity, Equipment, Fitting } from '@/core/schema';
import { feetToPixels } from '@/core/constants/coordinates';
import { getDuctStartAndEnd, type DuctLike } from './ductGeometryHelpers';

const SNAP_TOLERANCE = feetToPixels(1);
const ENDPOINT_PRIORITY_TOLERANCE = SNAP_TOLERANCE;

export type MagneticSnapType = 'duct_endpoint' | 'fitting_port' | 'equipment_point' | 'duct_body';

export interface MagneticSnapResult {
  snapType: MagneticSnapType;
  point: { x: number; y: number };
  distance: number;
  angle?: number;
  ductId?: string;
  entityType?: 'duct' | 'duct_run';
  endPoint?: 'start' | 'end';
  projectionT?: number;
  fittingId?: string;
  equipmentId?: string;
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

function resolveNearestFittingPort(fittings: Fitting[], x: number, y: number): MagneticSnapResult | null {
  let nearest: MagneticSnapResult | null = null;

  for (const fitting of fittings) {
    const distance = Math.hypot(fitting.transform.x - x, fitting.transform.y - y);
    if (distance > SNAP_TOLERANCE) {
      continue;
    }

    if (!nearest || distance < nearest.distance) {
      nearest = {
        snapType: 'fitting_port',
        point: { x: fitting.transform.x, y: fitting.transform.y },
        distance,
        fittingId: fitting.id,
      };
    }
  }

  return nearest;
}

function resolveNearestEquipmentPoint(equipment: Equipment[], x: number, y: number): MagneticSnapResult | null {
  let nearest: MagneticSnapResult | null = null;

  for (const entity of equipment) {
    const distance = Math.hypot(entity.transform.x - x, entity.transform.y - y);
    if (distance > SNAP_TOLERANCE) {
      continue;
    }

    if (!nearest || distance < nearest.distance) {
      nearest = {
        snapType: 'equipment_point',
        point: { x: entity.transform.x, y: entity.transform.y },
        distance,
        equipmentId: entity.id,
      };
    }
  }

  return nearest;
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
    const entities = Object.values(entitiesById).filter((entity) => !excluded.has(entity.id));
    const ducts = entities.filter((entity): entity is DuctLike => entity.type === 'duct' || entity.type === 'duct_run');
    const fittings = entities.filter((entity): entity is Fitting => entity.type === 'fitting');
    const equipment = entities.filter((entity): entity is Equipment => entity.type === 'equipment');

    return (
      resolveNearestDuctEndpoint(ducts, x, y) ??
      resolveNearestDuctBody(ducts, x, y) ??
      resolveNearestFittingPort(fittings, x, y) ??
      resolveNearestEquipmentPoint(equipment, x, y)
    );
  }
}

export const magneticConnectionService = MagneticConnectionService;
