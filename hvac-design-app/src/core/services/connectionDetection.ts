/**
 * Connection Detection Service
 *
 * Detects when a duct endpoint connects to existing duct centerline geometry and
 * determines the fitting required at the final aligned connection point.
 */
import type { Entity } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { feetToPixels } from '@/core/constants/coordinates';
import {
  areConnectionPointsWithinTolerance,
  calculateAngleDifference,
  detectDuctProfileChange,
  getDuctConnectionEndpoints,
  getDuctProfile,
  isStraightConnectionAngle,
  type DuctConnectionEndpoint,
  type DuctConnectionEntity,
} from './ductConnections';

export interface ConnectionPoint {
  entityId: string;
  endPoint: 'start' | 'end';
  x: number;
  y: number;
  angle: number;
}

export interface DetectedConnection {
  newDuct: {
    entityId: string;
    endPoint: 'start' | 'end';
    position: { x: number; y: number };
    angle: number;
  };
  existingDuct: {
    entityId: string;
    endPoint: 'start' | 'end' | 'body';
    position: { x: number; y: number };
    angle: number;
  };
  fittingType: 'elbow' | 'tee' | 'cross' | 'transition';
  angle: number;
}

const CONNECTION_TOLERANCE = feetToPixels(1);
const BODY_ENDPOINT_EXCLUSION = CONNECTION_TOLERANCE;

type DuctBodyConnectionEndpoint = Omit<DuctConnectionEndpoint, 'endPoint'> & {
  endPoint: 'body';
};

type NearbyConnectionEndpoint = DuctConnectionEndpoint | DuctBodyConnectionEndpoint;

export class ConnectionDetectionService {
  static detectConnections(newDuctId: string): DetectedConnection[] {
    const entities = useEntityStore.getState().byId as Record<string, Entity>;
    const newDuct = entities[newDuctId];

    if (!newDuct || !isConnectionEntity(newDuct)) {
      return [];
    }

    const allDucts = Object.values(entities).filter(isConnectionEntity);
    const connections: DetectedConnection[] = [];
    const newDuctPoints = getDuctConnectionEndpoints(newDuct);
    const seen = new Set<string>();

    for (const newPoint of newDuctPoints) {
      const nearbyConnections = allDucts
        .filter((duct) => duct.id !== newDuctId)
        .flatMap((duct) => [
          ...getDuctConnectionEndpoints(duct).filter((existingPoint) =>
            areConnectionPointsWithinTolerance(newPoint, existingPoint, CONNECTION_TOLERANCE)
          ),
          ...getDuctBodyConnectionsAtPoint(duct, newPoint.point, CONNECTION_TOLERANCE),
        ]);

      if (nearbyConnections.length === 0) {
        continue;
      }

      const fittingType = this.classifyJunctionType(newPoint, nearbyConnections);
      if (!fittingType) {
        continue;
      }

      for (const existingPoint of nearbyConnections) {
        const key = [newPoint.ductId, newPoint.endPoint, existingPoint.ductId, existingPoint.endPoint].join(':');
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        connections.push({
          newDuct: {
            entityId: newPoint.ductId,
            endPoint: newPoint.endPoint,
            position: { ...newPoint.point },
            angle: newPoint.angle,
          },
          existingDuct: {
            entityId: existingPoint.ductId,
            endPoint: existingPoint.endPoint,
            position: { ...existingPoint.point },
            angle: existingPoint.angle,
          },
          fittingType,
          angle: calculateAngleDifference(newPoint.angle, existingPoint.angle),
        });
      }
    }

    return connections.sort((a, b) => {
      const ax = a.newDuct.position.x - b.newDuct.position.x;
      if (ax !== 0) {
        return ax;
      }
      const ay = a.newDuct.position.y - b.newDuct.position.y;
      if (ay !== 0) {
        return ay;
      }
      return a.existingDuct.entityId.localeCompare(b.existingDuct.entityId);
    });
  }

  private static classifyJunctionType(
    newPoint: DuctConnectionEndpoint,
    nearbyPoints: NearbyConnectionEndpoint[]
  ): DetectedConnection['fittingType'] | null {
    if (nearbyPoints.some((point) => point.endPoint === 'body')) {
      return 'tee';
    }

    if (nearbyPoints.length >= 2) {
      return 'tee';
    }

    const firstNearby = nearbyPoints[0];
    if (!firstNearby) {
      return null;
    }

    const angleDiff = calculateAngleDifference(newPoint.angle, firstNearby.angle);
    const sizeChange = detectDuctProfileChange(newPoint.profile, firstNearby.profile);

    if (sizeChange && isStraightConnectionAngle(angleDiff)) {
      return 'transition';
    }

    if (isStraightConnectionAngle(angleDiff)) {
      return null;
    }

    return 'elbow';
  }
}

function isConnectionEntity(entity: Entity): entity is DuctConnectionEntity {
  return entity.type === 'duct' || entity.type === 'duct_run';
}

function getDuctBodyConnectionsAtPoint(
  duct: DuctConnectionEntity,
  point: { x: number; y: number },
  tolerance: number
): DuctBodyConnectionEndpoint[] {
  const projection = projectPointOntoDuctCenterline(duct, point);
  if (!projection || projection.distance > tolerance) {
    return [];
  }

  if (
    projection.distanceFromStart <= BODY_ENDPOINT_EXCLUSION ||
    projection.distanceFromEnd <= BODY_ENDPOINT_EXCLUSION
  ) {
    return [];
  }

  return [
    {
      ductId: duct.id,
      endPoint: 'body',
      point: projection.point,
      angle: duct.transform.rotation,
      profile: projection.profile,
    },
  ];
}

function projectPointOntoDuctCenterline(duct: DuctConnectionEntity, point: { x: number; y: number }) {
  const profile = getDuctProfile(duct);
  const start = getProjectionStartPoint(duct);
  const end = getProjectionEndPoint(duct, start);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return null;
  }

  const ux = dx / length;
  const uy = dy / length;
  const projectedLength = (point.x - start.x) * ux + (point.y - start.y) * uy;

  if (projectedLength <= 0 || projectedLength >= length) {
    return null;
  }

  const projectionPoint = {
    x: start.x + projectedLength * ux,
    y: start.y + projectedLength * uy,
  };

  return {
    point: projectionPoint,
    distance: Math.hypot(projectionPoint.x - point.x, projectionPoint.y - point.y),
    distanceFromStart: projectedLength,
    distanceFromEnd: length - projectedLength,
    profile,
  };
}

function getProjectionStartPoint(duct: DuctConnectionEntity): { x: number; y: number } {
  if (duct.type === 'duct_run' && duct.props.startPoint) {
    return { ...duct.props.startPoint };
  }

  return { x: duct.transform.x, y: duct.transform.y };
}

function getProjectionEndPoint(
  duct: DuctConnectionEntity,
  start: { x: number; y: number }
): { x: number; y: number } {
  if (duct.type === 'duct_run' && duct.props.endPoint) {
    return { ...duct.props.endPoint };
  }

  const length = duct.type === 'duct' ? duct.props.length : duct.props.installLength;
  const lengthPx = feetToPixels(length);
  const radians = (duct.transform.rotation * Math.PI) / 180;

  return {
    x: start.x + lengthPx * Math.cos(radians),
    y: start.y + lengthPx * Math.sin(radians),
  };
}
