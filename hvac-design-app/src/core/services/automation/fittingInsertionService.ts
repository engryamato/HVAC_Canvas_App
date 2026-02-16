import type { Entity } from '@/core/schema';
import type { Fitting, FittingProps, FittingType } from '../../schema/fitting.schema';
import type { Duct, DuctProps } from '../../schema/duct.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { createFitting } from '@/features/canvas/entities/fittingDefaults';

/**
 * Automatic Fitting Insertion Service
 * 
 * Analyzes duct geometry and automatically inserts appropriate fittings
 * (elbows, tees, reducers, transitions) at connection points.
 */

export interface Point {
  x: number;
  y: number;
}

export interface ConnectionPoint {
  ductId: string;
  point: Point;
  endPoint: 'start' | 'end';
  angle: number; // Direction in degrees
  diameter?: number;
  width?: number;
  height?: number;
}

export interface JunctionAnalysis {
  type: 'elbow' | 'tee' | 'cross' | 'transition' | 'cap';
  location?: Point;
  ducts?: string[];
  angle?: number; // For elbows
  branches?: ConnectionPoint[]; // For tees/crosses
  sizeChange?: { from: number; to: number }; // For transitions
  warning?: string; // Warning message for edge cases
}

interface AutoInsertPlan {
  insertions: Fitting[];
  orphanFittingIds: string[];
}

const CONNECTION_TOLERANCE = 12;
const STRAIGHT_ANGLE_TOLERANCE = 15;

export class FittingInsertionService {
  /**
   * Analyze junction between two ducts to determine required fitting
   */
  static analyzeJunction(
    duct1: Partial<DuctProps> & { __angle?: number },
    duct2: Partial<DuctProps> & { __angle?: number },
    _connectionPoint: Point
  ): JunctionAnalysis {
    const angle = this.calculateAngleBetweenDucts(duct1, duct2);
    const sizeChange = this.detectSizeChange(duct1, duct2);

    if (sizeChange && this.isStraightAngle(angle)) {
      return {
        type: 'transition',
        sizeChange,
      };
    }

    if (this.isStraightAngle(angle)) {
      return {
        type: 'cap',
      };
    }

    if (Math.abs(angle - 90) <= 15) {
      return {
        type: 'elbow',
        angle: 90,
      };
    }

    if (Math.abs(angle - 45) <= 15) {
      return {
        type: 'elbow',
        angle: 45,
      };
    }

    return {
      type: 'elbow',
      angle: this.normalizeElbowAngle(angle),
    };
  }

  /**
   * Detect multiple ducts connecting at a point (tee/cross junction)
   */
  static analyzeMultiDuctJunction(
    connections: ConnectionPoint[]
  ): JunctionAnalysis {
    const sortedConnections = [...connections].sort((a, b) => a.ductId.localeCompare(b.ductId));

    if (connections.length === 2) {
      const first = sortedConnections[0];
      const second = sortedConnections[1];
      if (!first || !second) {
        return { type: 'cap' };
      }
      const angle = this.calculateAngleBetweenConnectionPoints(first, second);
      const sizeChange = this.detectSizeChange(first, second);

      if (sizeChange && this.isStraightAngle(angle)) {
        return { type: 'transition', angle, branches: sortedConnections, sizeChange };
      }

      return {
        type: this.isStraightAngle(angle) ? 'cap' : 'elbow',
        angle: this.normalizeElbowAngle(angle),
        branches: sortedConnections,
      };
    }

    if (connections.length === 3) {
      return {
        type: 'tee',
        branches: sortedConnections,
      };
    }

    if (connections.length === 4) {
      return {
        type: 'cross',
        branches: sortedConnections,
      };
    }

    const excessCount = connections.length - 4;
    return {
      type: 'cap',
      branches: sortedConnections.slice(0, 4),
      location: sortedConnections[0]?.point,
      warning: `Junction has ${connections.length} connections; capped ${excessCount} extra`,
    };
  }

  /**
   * Automatically insert fitting at connection point
   */
  static insertFittingAtJunction(
    junction: JunctionAnalysis,
    _location: Point,
    _duct1Props: Partial<DuctProps>
  ): Partial<FittingProps> {
    let fittingType: FittingType = 'elbow_90';
    const additionalProps: Partial<FittingProps> = {};

    switch (junction.type) {
      case 'elbow':
        if (junction.angle && Math.abs(junction.angle - 45) <= 15) {
          fittingType = 'elbow_45';
        } else {
          fittingType = 'elbow_90';
        }
        break;

      case 'tee':
        fittingType = 'tee';
        additionalProps.connectionPoints = (junction.branches ?? []).map((branch) => ({
          ductId: branch.ductId,
          pointIndex: branch.endPoint === 'start' ? 0 : 1,
        }));
        break;

      case 'transition':
        fittingType = 'reducer';
        if (junction.sizeChange) {
          additionalProps.transitionData = {
            fromDiameter: junction.sizeChange.from,
            toDiameter: junction.sizeChange.to,
          };
        }
        break;
    }

    return {
      fittingType,
      inletDuctId: undefined, // Will be set by caller
      outletDuctId: undefined, // Will be set by caller
      angle: junction.angle,
      autoInserted: true,
      autoGenerated: true,
      ...additionalProps,
    };
  }

  static planAutoInsertForDuct(newDuctId: string, entitiesById?: Record<string, Entity>): AutoInsertPlan {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    const newDuct = entities[newDuctId];
    if (!newDuct || newDuct.type !== 'duct') {
      return { insertions: [], orphanFittingIds: this.detectOrphanFittings(entities) };
    }

    const junctions = this.findJunctionsForDuct(newDuct as Duct, entities);
    const existingFittings = Object.values(entities).filter((entity): entity is Fitting => entity.type === 'fitting');
    const insertions = junctions
      .map((junction) => this.buildFittingFromJunction(junction, entities))
      .filter((fitting): fitting is Fitting => fitting !== null)
      .filter((candidate) => !this.isDuplicateFitting(candidate, existingFittings));

    return {
      insertions,
      orphanFittingIds: this.detectOrphanFittings(entities),
    };
  }

  static detectOrphanFittings(entitiesById?: Record<string, Entity>): string[] {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    const byId = entities;

    return Object.values(entities)
      .filter((entity): entity is Fitting => entity.type === 'fitting' && Boolean(entity.props.autoInserted))
      .filter((fitting) => {
        const ductIds = this.getFittingDuctIds(fitting);
        if (ductIds.length === 0) {
          return true;
        }

        const validDucts = ductIds.filter((id) => byId[id]?.type === 'duct');
        if (validDucts.length !== ductIds.length) {
          return true;
        }

        if (fitting.props.fittingType === 'tee') {
          return validDucts.length < 3;
        }

        return validDucts.length < 2;
      })
      .map((fitting) => fitting.id)
      .sort();
  }

  /**
   * Calculate angle between two duct segments
   */
  private static calculateAngleBetweenDucts(
    duct1: Partial<DuctProps> & { __angle?: number },
    duct2: Partial<DuctProps> & { __angle?: number }
  ): number {
    const angle1 = duct1.__angle;
    const angle2 = duct2.__angle;
    if (typeof angle1 !== 'number' || typeof angle2 !== 'number') {
      return 90;
    }

    return this.calculateAngleDifference(angle1, angle2);
  }

  /**
   * Detect size change between ducts
   */
  private static detectSizeChange(
    duct1: Partial<DuctProps> | ConnectionPoint,
    duct2: Partial<DuctProps> | ConnectionPoint
  ): { from: number; to: number } | null {
    const size1 = this.getDuctSize(duct1);
    const size2 = this.getDuctSize(duct2);

    if (Math.abs(size1 - size2) > 1) {
      // Size change detected (more than 1 inch difference)
      return { from: size1, to: size2 };
    }

    return null;
  }

  /**
   * Get effective duct size (diameter or equivalent diameter)
   */
  private static getDuctSize(duct: Partial<DuctProps> | ConnectionPoint): number {
    if ('diameter' in duct && typeof duct.diameter === 'number') {
      return duct.diameter;
    }

    if ('width' in duct && 'height' in duct && typeof duct.width === 'number' && typeof duct.height === 'number') {
      const numerator = Math.pow(duct.width * duct.height, 0.625);
      const denominator = Math.pow(duct.width + duct.height, 0.25);
      return 1.30 * (numerator / denominator);
    }

    return 0;
  }

  /**
   * Validate fitting insertion based on constraints
   */
  static validateFittingInsertion(
    fitting: Partial<FittingProps>,
    connectedDucts: Partial<DuctProps>[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check size compatibility
    const ductSizes = connectedDucts.map(d => this.getDuctSize(d));
    const maxSizeChange = Math.max(...ductSizes) - Math.min(...ductSizes);

    if (maxSizeChange > 12 && fitting.fittingType !== 'reducer') {
      issues.push(
        `Size change of ${maxSizeChange.toFixed(1)}" requires a transition fitting`
      );
    }

    // Check angle feasibility
    if (fitting.fittingType?.startsWith('elbow')) {
      // Elbows should not be used for very small angle changes
      // (This would be enhanced with actual angle data)
    }

    // Check tee/cross branch count
    if (fitting.fittingType === 'tee' && (!fitting.connectionPoints || fitting.connectionPoints.length !== 3)) {
      issues.push('Tee fitting requires exactly 3 connection points');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Auto-insert fittings along a duct path
   * Scans for direction changes and inserts elbows automatically
   */
  static autoInsertFittingsAlongPath(
    ductPath: Point[],
    _ductProps: Partial<DuctProps>
  ): Partial<FittingProps>[] {
    const fittings: Partial<FittingProps>[] = [];

    // Scan through path points looking for direction changes
    for (let i = 1; i < ductPath.length - 1; i++) {
      const prev = ductPath[i - 1];
      const current = ductPath[i];
      const next = ductPath[i + 1];
      if (!prev || !current || !next) {
        continue;
      }

      // Calculate vectors
      const v1 = { x: current.x - prev.x, y: current.y - prev.y };
      const v2 = { x: next.x - current.x, y: next.y - current.y };

      // Calculate angle between vectors
      const angle = this.calculateVectorAngle(v1, v2);

      // If significant angle change, insert elbow
      if (Math.abs(angle) > 30) {
        const fittingType = Math.abs(angle - 90) < 20 ? 'elbow_90' : 'elbow_45';

        fittings.push({
          fittingType,
          autoInserted: true,
          autoGenerated: true,
        });
      }
    }

    return fittings;
  }

  /**
   * Calculate angle between two 2D vectors
   */
  private static calculateVectorAngle(
    v1: { x: number; y: number },
    v2: { x: number; y: number }
  ): number {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) {return 0;}

    const cosAngle = dot / (mag1 * mag2);
    return (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
  }

  /**
   * Suggest fitting based on context
   * Used for manual placement with smart suggestions
   */
  static suggestFitting(
    nearbyDucts: Partial<DuctProps>[],
    _placementPoint: Point
  ): { type: FittingType; confidence: number; reason: string }[] {
    const suggestions: { type: FittingType; confidence: number; reason: string }[] = [];

    const first = nearbyDucts[0];
    const second = nearbyDucts[1];

    if (first && second && nearbyDucts.length === 2) {
      // Two ducts nearby - likely need elbow or reducer
      const sizeChange = this.detectSizeChange(first, second);

      if (sizeChange) {
        suggestions.push({
          type: 'reducer',
          confidence: 0.9,
          reason: `Size change from ${sizeChange.from}" to ${sizeChange.to}"`,
        });
      } else {
        suggestions.push({
          type: 'elbow_90',
          confidence: 0.7,
          reason: 'Two ducts at perpendicular angle',
        });
      }
    } else if (nearbyDucts.length === 3) {
      suggestions.push({
        type: 'tee',
        confidence: 0.8,
        reason: 'Three ducts converging',
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private static isStraightAngle(angle: number): boolean {
    return angle <= STRAIGHT_ANGLE_TOLERANCE || angle >= 180 - STRAIGHT_ANGLE_TOLERANCE;
  }

  private static normalizeElbowAngle(angle: number): number {
    return Math.abs(angle - 45) <= 15 ? 45 : 90;
  }

  private static calculateAngleBetweenConnectionPoints(a: ConnectionPoint, b: ConnectionPoint): number {
    return this.calculateAngleDifference(a.angle, b.angle);
  }

  private static calculateAngleDifference(a: number, b: number): number {
    let diff = Math.abs(a - b) % 360;
    if (diff > 180) {
      diff = 360 - diff;
    }
    return diff;
  }

  private static findJunctionsForDuct(newDuct: Duct, entitiesById: Record<string, Entity>): JunctionAnalysis[] {
    const newEndpoints = this.getDuctEndpoints(newDuct);
    const otherDucts = Object.values(entitiesById).filter(
      (entity): entity is Duct => entity.type === 'duct' && entity.id !== newDuct.id
    );

    const junctions: JunctionAnalysis[] = [];

    for (const endpoint of newEndpoints) {
      const nearby = otherDucts
        .flatMap((duct) => this.getDuctEndpoints(duct))
        .filter((point) => this.arePointsConnected(endpoint.point, point.point));

      if (nearby.length === 0) {
        continue;
      }

      const branchPoints = [endpoint, ...nearby].sort((a, b) => a.ductId.localeCompare(b.ductId));
      const analysis = this.analyzeMultiDuctJunction(branchPoints);
      const ductIds = branchPoints.map((point) => point.ductId).sort();

      if (analysis.type === 'cap' || analysis.type === 'cross') {
        continue;
      }

      junctions.push({
        ...analysis,
        location: endpoint.point,
        ducts: ductIds,
        branches: branchPoints,
      });
    }

    return junctions.sort((a, b) => {
      const ax = a.location?.x ?? 0;
      const bx = b.location?.x ?? 0;
      if (ax !== bx) {
        return ax - bx;
      }
      const ay = a.location?.y ?? 0;
      const by = b.location?.y ?? 0;
      if (ay !== by) {
        return ay - by;
      }
      return (a.ducts?.join(',') ?? '').localeCompare(b.ducts?.join(',') ?? '');
    });
  }

  private static getDuctEndpoints(duct: Duct): ConnectionPoint[] {
    const { x, y, rotation } = duct.transform;
    const lengthPixels = duct.props.length * 12;
    const radians = (rotation * Math.PI) / 180;
    const endX = x + lengthPixels * Math.cos(radians);
    const endY = y + lengthPixels * Math.sin(radians);

    return [
      {
        ductId: duct.id,
        endPoint: 'start',
        point: { x, y },
        angle: rotation,
        diameter: duct.props.shape === 'round' ? duct.props.diameter : undefined,
        width: duct.props.shape === 'rectangular' ? duct.props.width : undefined,
        height: duct.props.shape === 'rectangular' ? duct.props.height : undefined,
      },
      {
        ductId: duct.id,
        endPoint: 'end',
        point: { x: endX, y: endY },
        angle: rotation,
        diameter: duct.props.shape === 'round' ? duct.props.diameter : undefined,
        width: duct.props.shape === 'rectangular' ? duct.props.width : undefined,
        height: duct.props.shape === 'rectangular' ? duct.props.height : undefined,
      },
    ];
  }

  private static arePointsConnected(a: Point, b: Point): boolean {
    return Math.hypot(a.x - b.x, a.y - b.y) <= CONNECTION_TOLERANCE;
  }

  private static buildFittingFromJunction(
    junction: JunctionAnalysis,
    entitiesById: Record<string, Entity>
  ): Fitting | null {
    if (!junction.location || !junction.ducts || junction.ducts.length < 2) {
      return null;
    }

    const [inletDuctId, outletDuctId] = junction.ducts;
    if (!inletDuctId || !outletDuctId) {
      return null;
    }

    const firstDuct = entitiesById[inletDuctId];
    if (!firstDuct || firstDuct.type !== 'duct') {
      return null;
    }

    const fittingProps = this.insertFittingAtJunction(junction, junction.location, firstDuct.props);
    const fitting = createFitting(fittingProps.fittingType ?? 'elbow_90', {
      x: junction.location.x,
      y: junction.location.y,
      angle: fittingProps.angle,
      inletDuctId,
      outletDuctId,
      autoGenerated: true,
      autoInserted: true,
      connectionPoints: fittingProps.connectionPoints,
      serviceId: firstDuct.props.serviceId,
    });

    return fitting;
  }

  private static isDuplicateFitting(candidate: Fitting, existing: Fitting[]): boolean {
    const candidateDucts = new Set(this.getFittingDuctIds(candidate));

    return existing.some((fitting) => {
      if (fitting.props.fittingType !== candidate.props.fittingType) {
        return false;
      }

      const distance = Math.hypot(
        fitting.transform.x - candidate.transform.x,
        fitting.transform.y - candidate.transform.y
      );
      if (distance > CONNECTION_TOLERANCE) {
        return false;
      }

      const fittingDucts = new Set(this.getFittingDuctIds(fitting));
      if (fittingDucts.size !== candidateDucts.size) {
        return false;
      }

      for (const ductId of candidateDucts) {
        if (!fittingDucts.has(ductId)) {
          return false;
        }
      }

      return true;
    });
  }

  private static getFittingDuctIds(fitting: Fitting): string[] {
    return Array.from(
      new Set([
        fitting.props.inletDuctId,
        fitting.props.outletDuctId,
        ...(fitting.props.connectionPoints?.map((point) => point.ductId) ?? []),
      ].filter((id): id is string => typeof id === 'string' && id.length > 0))
    ).sort();
  }
}

/**
 * Export singleton instance
 */
export const fittingInsertionService = FittingInsertionService;
