/**
 * Connection Detection Service
 *
 * Detects when a newly drawn duct connects to existing ducts and determines
 * the type of fitting required (elbow, tee, cross, etc.)
 */
import { Duct, Entity } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';

export interface ConnectionPoint {
  entityId: string;
  endPoint: 'start' | 'end';
  x: number;
  y: number;
  angle: number; // Rotation of the duct in degrees
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
    endPoint: 'start' | 'end';
    position: { x: number; y: number };
    angle: number;
  };
  fittingType: 'elbow' | 'tee' | 'cross' | 'transition';
  angle: number; // Angle between ducts (0-180)
}

const CONNECTION_TOLERANCE = 12; // pixels (1 foot at 12px/ft scale)
const STRAIGHT_ANGLE_TOLERANCE = 15;

export class ConnectionDetectionService {
  /**
   * Detect connections for a newly created duct
   */
  static detectConnections(newDuctId: string): DetectedConnection[] {
    const entities = useEntityStore.getState().byId as Record<string, Entity>;
    const newDuct = entities[newDuctId];

    if (!newDuct || newDuct.type !== 'duct') {
      return [];
    }

    const allDucts = Object.values(entities).filter((entity): entity is Duct => entity.type === 'duct');
    const newDuctEntity = newDuct as Duct;
    const connections: DetectedConnection[] = [];
    const newDuctPoints = this.getDuctEndpoints(newDuctEntity);
    const seen = new Set<string>();

    for (const newPoint of newDuctPoints) {
      const nearbyConnections = allDucts
        .filter((duct) => duct.id !== newDuctId)
        .flatMap((duct) => this.getDuctEndpoints(duct))
        .filter((existingPoint) => this.arePointsConnected(newPoint, existingPoint));

      if (nearbyConnections.length === 0) {
        continue;
      }

      const fittingType = this.classifyJunctionType(newPoint, nearbyConnections, entities);
      if (!fittingType) {
        continue;
      }

      for (const existingPoint of nearbyConnections) {
        const key = [newPoint.entityId, newPoint.endPoint, existingPoint.entityId, existingPoint.endPoint].join(':');
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        connections.push({
          newDuct: {
            entityId: newPoint.entityId,
            endPoint: newPoint.endPoint,
            position: { x: newPoint.x, y: newPoint.y },
            angle: newPoint.angle,
          },
          existingDuct: {
            entityId: existingPoint.entityId,
            endPoint: existingPoint.endPoint,
            position: { x: existingPoint.x, y: existingPoint.y },
            angle: existingPoint.angle,
          },
          fittingType,
          angle: this.calculateAngleDifference(newPoint.angle, existingPoint.angle),
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

  /**
   * Get the start and end points of a duct in canvas coordinates
   */
  private static getDuctEndpoints(duct: Duct): ConnectionPoint[] {
    const { x, y, rotation } = duct.transform;
    const length = duct.props.length * 12; // Convert feet to pixels

    // Calculate end point based on rotation
    const radians = (rotation * Math.PI) / 180;
    const endX = x + length * Math.cos(radians);
    const endY = y + length * Math.sin(radians);

    return [
      {
        entityId: duct.id,
        endPoint: 'start',
        x,
        y,
        angle: rotation,
      },
      {
        entityId: duct.id,
        endPoint: 'end',
        x: endX,
        y: endY,
        angle: rotation,
      },
    ];
  }

  /**
   * Check if two points are within connection tolerance
   */
  private static arePointsConnected(point1: ConnectionPoint, point2: ConnectionPoint): boolean {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const distance = Math.hypot(dx, dy);
    return distance <= CONNECTION_TOLERANCE;
  }

  private static classifyJunctionType(
    newPoint: ConnectionPoint,
    nearbyPoints: ConnectionPoint[],
    entities: Record<string, Entity>
  ): DetectedConnection['fittingType'] | null {
    if (nearbyPoints.length >= 2) {
      return 'tee';
    }

    const firstNearby = nearbyPoints[0];
    if (!firstNearby) {
      return null;
    }

    const angleDiff = this.calculateAngleDifference(newPoint.angle, firstNearby.angle);
    const sizeChange = this.detectSizeChange(newPoint.entityId, firstNearby.entityId, entities);

    if (sizeChange && this.isStraight(angleDiff)) {
      return 'transition';
    }

    if (this.isStraight(angleDiff)) {
      return null;
    }

    return 'elbow';
  }

  private static calculateAngleDifference(angle1: number, angle2: number): number {
    let angleDiff = Math.abs(angle1 - angle2) % 360;
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }
    return angleDiff;
  }

  private static isStraight(angleDiff: number): boolean {
    return angleDiff <= STRAIGHT_ANGLE_TOLERANCE || angleDiff >= 180 - STRAIGHT_ANGLE_TOLERANCE;
  }

  private static detectSizeChange(
    duct1Id: string,
    duct2Id: string,
    entities: Record<string, Entity>
  ): boolean {
    const duct1 = entities[duct1Id];
    const duct2 = entities[duct2Id];
    if (!duct1 || !duct2 || duct1.type !== 'duct' || duct2.type !== 'duct') {
      return false;
    }

    const size1 = this.getDuctSize(duct1);
    const size2 = this.getDuctSize(duct2);
    if (size1 <= 0 || size2 <= 0) {
      return false;
    }

    return Math.abs(size1 - size2) > 1;
  }

  private static getDuctSize(duct: Duct): number {
    if (duct.props.shape === 'round' && typeof duct.props.diameter === 'number') {
      return duct.props.diameter;
    }

    if (
      duct.props.shape === 'rectangular' &&
      typeof duct.props.width === 'number' &&
      typeof duct.props.height === 'number'
    ) {
      const numerator = Math.pow(duct.props.width * duct.props.height, 0.625);
      const denominator = Math.pow(duct.props.width + duct.props.height, 0.25);
      return 1.3 * (numerator / denominator);
    }

    return 0;
  }
}
