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

    const connections: DetectedConnection[] = [];
    const newDuctPoints = this.getDuctEndpoints(newDuct as Duct);

    //Search all existing ducts
    Object.values(entities).forEach((entity) => {
      if (entity.type !== 'duct' || entity.id === newDuctId) {
        return;
      }

      const existingDuct = entity as Duct;
      const existingPoints = this.getDuctEndpoints(existingDuct);

      // Check all combinations of endpoints
      for (const newPoint of newDuctPoints) {
        for (const existingPoint of existingPoints) {
          if (this.arePointsConnected(newPoint, existingPoint)) {
            const connection = this.classifyConnection(newPoint, existingPoint);
            if (connection) {
              connections.push(connection);
            }
          }
        }
      }
    });

    return connections;
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
  private static arePointsConnected(
    point1: ConnectionPoint,
    point2: ConnectionPoint
  ): boolean {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const distance = Math.hypot(dx, dy);
    return distance <= CONNECTION_TOLERANCE;
  }

  /**
   * Classify the type of connection based on the angle between ducts
   */
  private static classifyConnection(
    newPoint: ConnectionPoint,
    existingPoint: ConnectionPoint
  ): DetectedConnection | null {
    // Calculate angle difference (normalize to 0-180)
    let angleDiff = Math.abs(newPoint.angle - existingPoint.angle) % 360;
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }

    // Determine fitting type based on angle
    let fittingType: DetectedConnection['fittingType'];
    
    if (angleDiff < 15 || angleDiff > 165) {
      // Straight connection or 180° - likely extends existing duct (no fitting needed)
      return null;
    } else if (angleDiff >= 75 && angleDiff <= 105) {
      // 90° connection - elbow or tee
      // For now, assume elbow (tee detection requires checking for third duct)
      fittingType = 'elbow';
    } else if (angleDiff >= 30 && angleDiff < 75) {
      // 45° or 60° connection
      fittingType = 'elbow';
    } else {
      // Other angles - custom elbow
      fittingType = 'elbow';
    }

    return {
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
      angle: angleDiff,
    };
  }
}
