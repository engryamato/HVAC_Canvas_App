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
  angle: number;
  diameter?: number;
  width?: number;
  height?: number;
}

export interface JunctionAnalysis {
  type: 'elbow' | 'tee' | 'cross' | 'transition' | 'cap';
  location?: Point;
  ducts?: string[];
  angle?: number;
  branches?: ConnectionPoint[];
  sizeChange?: { from: number; to: number };
  warning?: string;
}

export interface AutoInsertPlan {
  insertions: Fitting[];
  orphanFittingIds: string[];
}

interface FittingPlanDescriptor {
  key: string;
  fitting: Fitting;
  signature: string;
}

export interface PlannedAutoFittingChange {
  action: 'insert' | 'update' | 'remove';
  key: string;
  existingFittingId?: string;
  existingSignature?: string;
  desiredFitting?: Fitting;
  desiredSignature?: string;
}

export interface AutoFittingReRunPlan {
  changes: PlannedAutoFittingChange[];
  preservedManualOverrideCount: number;
}

export interface AutoFittingReRunResult {
  insertedOrUpdatedCount: number;
  insertedCount: number;
  updatedCount: number;
  removedCount: number;
  manualOverridesPreserved: number;
  skippedChangedCount: number;
  operations: Array<
    | { action: 'insert'; next: Fitting }
    | { action: 'update'; previous: Fitting; next: Fitting }
    | { action: 'remove'; previous: Fitting }
  >;
}

const CONNECTION_TOLERANCE = 12;
const STRAIGHT_ANGLE_TOLERANCE = 15;
const COORDINATE_PRECISION = 3;

export class FittingInsertionService {
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

  static analyzeMultiDuctJunction(connections: ConnectionPoint[]): JunctionAnalysis {
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
      inletDuctId: undefined,
      outletDuctId: undefined,
      angle: junction.angle,
      autoInserted: true,
      autoGenerated: true,
      manualOverride: false,
      ...additionalProps,
    };
  }

  static planAutoInsertForDuct(newDuctId: string, entitiesById?: Record<string, Entity>): AutoInsertPlan {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    const newDuct = entities[newDuctId];
    if (!newDuct || newDuct.type !== 'duct') {
      return { insertions: [], orphanFittingIds: this.detectOrphanFittings(entities) };
    }

    const junctions = this.findJunctionsForDuct(newDuct, entities);
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

  static buildReRunPlan(entitiesById?: Record<string, Entity>): AutoFittingReRunPlan {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    const desiredByKey = this.getDesiredAutoFittingsByKey(entities);
    const existingFittings = Object.values(entities)
      .filter((entity): entity is Fitting => entity.type === 'fitting' && Boolean(entity.props.autoInserted))
      .sort((a, b) => a.id.localeCompare(b.id));

    const existingEligibleByKey = new Map<string, Fitting>();
    const manualOverrideByKey = new Map<string, Fitting>();

    for (const fitting of existingFittings) {
      const key = this.getFittingKey(fitting);
      if (fitting.props.manualOverride) {
        if (!manualOverrideByKey.has(key)) {
          manualOverrideByKey.set(key, fitting);
        }
        continue;
      }

      if (!existingEligibleByKey.has(key)) {
        existingEligibleByKey.set(key, fitting);
      }
    }

    const changes: PlannedAutoFittingChange[] = [];

    for (const [key, desired] of desiredByKey.entries()) {
      if (manualOverrideByKey.has(key)) {
        continue;
      }

      const current = existingEligibleByKey.get(key);
      if (!current) {
        if (this.findAnyFittingForKey(key, entities)) {
          continue;
        }

        changes.push({
          action: 'insert',
          key,
          desiredFitting: desired.fitting,
          desiredSignature: desired.signature,
        });
        continue;
      }

      if (this.getComparableFittingSignature(current) !== desired.signature) {
        changes.push({
          action: 'update',
          key,
          existingFittingId: current.id,
          existingSignature: this.getComparableFittingSignature(current),
          desiredFitting: desired.fitting,
          desiredSignature: desired.signature,
        });
      }
    }

    for (const [key, fitting] of existingEligibleByKey.entries()) {
      if (desiredByKey.has(key)) {
        continue;
      }

      changes.push({
        action: 'remove',
        key,
        existingFittingId: fitting.id,
        existingSignature: this.getComparableFittingSignature(fitting),
      });
    }

    changes.sort((a, b) => {
      if (a.key !== b.key) {
        return a.key.localeCompare(b.key);
      }
      return a.action.localeCompare(b.action);
    });

    return {
      changes,
      preservedManualOverrideCount: manualOverrideByKey.size,
    };
  }

  static resolveReRunPlan(plan: AutoFittingReRunPlan, entitiesById?: Record<string, Entity>): AutoFittingReRunResult {
    const seedEntities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    const workingEntities: Record<string, Entity> = { ...seedEntities };
    let insertedCount = 0;
    let updatedCount = 0;
    let removedCount = 0;
    let manualOverridesPreserved = 0;
    let skippedChangedCount = 0;
    const operations: AutoFittingReRunResult['operations'] = [];

    for (const change of plan.changes) {
      const desiredNow = this.getDesiredAutoFittingsByKey(workingEntities).get(change.key);
      const manualOverrideAtKey = this.findManualOverrideForKey(change.key, workingEntities);

      if (manualOverrideAtKey) {
        manualOverridesPreserved += 1;
        continue;
      }

      if (change.action === 'insert') {
        if (!desiredNow || desiredNow.signature !== change.desiredSignature) {
          skippedChangedCount += 1;
          continue;
        }

        const existingFittingAtKey = this.findAnyFittingForKey(change.key, workingEntities);
        if (existingFittingAtKey) {
          if (
            existingFittingAtKey.props.autoInserted &&
            !existingFittingAtKey.props.manualOverride &&
            this.getComparableFittingSignature(existingFittingAtKey) === desiredNow.signature
          ) {
            continue;
          }

          continue;
        }

        operations.push({ action: 'insert', next: desiredNow.fitting });
        workingEntities[desiredNow.fitting.id] = desiredNow.fitting;
        insertedCount += 1;
        continue;
      }

      const current = change.existingFittingId ? workingEntities[change.existingFittingId] : undefined;
      if (!current || current.type !== 'fitting') {
        skippedChangedCount += 1;
        continue;
      }

      if (current.props.manualOverride) {
        manualOverridesPreserved += 1;
        continue;
      }

      if (this.getComparableFittingSignature(current) !== change.existingSignature) {
        skippedChangedCount += 1;
        continue;
      }

      if (change.action === 'remove') {
        if (desiredNow) {
          skippedChangedCount += 1;
          continue;
        }

        operations.push({ action: 'remove', previous: current });
        delete workingEntities[current.id];
        removedCount += 1;
        continue;
      }

      if (!desiredNow || desiredNow.signature !== change.desiredSignature) {
        skippedChangedCount += 1;
        continue;
      }

      const next: Fitting = {
        ...current,
        props: {
          ...desiredNow.fitting.props,
          name: current.props.name,
          manualOverride: false,
          autoInserted: true,
          autoGenerated: true,
        },
        transform: { ...desiredNow.fitting.transform },
        modifiedAt: new Date().toISOString(),
      };
      operations.push({ action: 'update', previous: current, next });
      workingEntities[current.id] = next;
      updatedCount += 1;
    }

    return {
      insertedOrUpdatedCount: insertedCount + updatedCount,
      insertedCount,
      updatedCount,
      removedCount,
      manualOverridesPreserved: plan.preservedManualOverrideCount + manualOverridesPreserved,
      skippedChangedCount,
      operations,
    };
  }

  static planManualOverrideReset(
    fittingId: string,
    entitiesById?: Record<string, Entity>
  ): { previous: Fitting; next: Fitting } | null {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    const current = entities[fittingId];
    if (!current || current.type !== 'fitting' || !current.props.autoInserted || !current.props.manualOverride) {
      return null;
    }

    const desired = this.getDesiredFittingForExisting(current, entities);
    const previous = JSON.parse(JSON.stringify(current)) as Fitting;

    if (!desired) {
      return {
        previous,
        next: {
          ...current,
          props: {
            ...current.props,
            manualOverride: false,
          },
          modifiedAt: new Date().toISOString(),
        },
      };
    }

    return {
      previous,
      next: {
        ...current,
        props: {
          ...desired.props,
          name: current.props.name,
          manualOverride: false,
          autoInserted: true,
          autoGenerated: true,
        },
        transform: { ...desired.transform },
        modifiedAt: new Date().toISOString(),
      },
    };
  }

  static getManualOverrideFittingIds(entitiesById?: Record<string, Entity>): string[] {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    return Object.values(entities)
      .filter(
        (entity): entity is Fitting =>
          entity.type === 'fitting' && Boolean(entity.props.autoInserted) && Boolean(entity.props.manualOverride)
      )
      .map((fitting) => fitting.id)
      .sort();
  }

  static getAutoInsertedFittingsForDuct(ductId: string, entitiesById?: Record<string, Entity>): Fitting[] {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    return Object.values(entities)
      .filter((entity): entity is Fitting => entity.type === 'fitting' && Boolean(entity.props.autoInserted))
      .filter((fitting) => this.getFittingDuctIds(fitting).includes(ductId))
      .sort((a, b) => a.id.localeCompare(b.id));
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

  static validateFittingInsertion(
    fitting: Partial<FittingProps>,
    connectedDucts: Partial<DuctProps>[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    const ductSizes = connectedDucts.map((duct) => this.getDuctSize(duct));
    const maxSizeChange = Math.max(...ductSizes) - Math.min(...ductSizes);

    if (maxSizeChange > 12 && fitting.fittingType !== 'reducer') {
      issues.push(`Size change of ${maxSizeChange.toFixed(1)}" requires a transition fitting`);
    }

    if (fitting.fittingType === 'tee' && (!fitting.connectionPoints || fitting.connectionPoints.length !== 3)) {
      issues.push('Tee fitting requires exactly 3 connection points');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  static autoInsertFittingsAlongPath(
    ductPath: Point[],
    _ductProps: Partial<DuctProps>
  ): Partial<FittingProps>[] {
    const fittings: Partial<FittingProps>[] = [];

    for (let i = 1; i < ductPath.length - 1; i++) {
      const prev = ductPath[i - 1];
      const current = ductPath[i];
      const next = ductPath[i + 1];
      if (!prev || !current || !next) {
        continue;
      }

      const v1 = { x: current.x - prev.x, y: current.y - prev.y };
      const v2 = { x: next.x - current.x, y: next.y - current.y };
      const angle = this.calculateVectorAngle(v1, v2);

      if (Math.abs(angle) > 30) {
        const fittingType = Math.abs(angle - 90) < 20 ? 'elbow_90' : 'elbow_45';

        fittings.push({
          fittingType,
          autoInserted: true,
          autoGenerated: true,
          manualOverride: false,
        });
      }
    }

    return fittings;
  }

  static suggestFitting(
    nearbyDucts: Partial<DuctProps>[],
    _placementPoint: Point
  ): { type: FittingType; confidence: number; reason: string }[] {
    const suggestions: { type: FittingType; confidence: number; reason: string }[] = [];

    const first = nearbyDucts[0];
    const second = nearbyDucts[1];

    if (first && second && nearbyDucts.length === 2) {
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

  private static detectSizeChange(
    duct1: Partial<DuctProps> | ConnectionPoint,
    duct2: Partial<DuctProps> | ConnectionPoint
  ): { from: number; to: number } | null {
    const size1 = this.getDuctSize(duct1);
    const size2 = this.getDuctSize(duct2);

    if (Math.abs(size1 - size2) > 1) {
      return { from: size1, to: size2 };
    }

    return null;
  }

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

  private static calculateVectorAngle(v1: { x: number; y: number }, v2: { x: number; y: number }): number {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }

    const cosAngle = dot / (mag1 * mag2);
    return (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
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
    return createFitting(fittingProps.fittingType ?? 'elbow_90', {
      x: junction.location.x,
      y: junction.location.y,
      angle: fittingProps.angle,
      inletDuctId,
      outletDuctId,
      autoGenerated: true,
      autoInserted: true,
      manualOverride: false,
      connectionPoints: fittingProps.connectionPoints,
      serviceId: firstDuct.props.serviceId,
    });
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

  private static getDesiredAutoFittingsByKey(entitiesById: Record<string, Entity>): Map<string, FittingPlanDescriptor> {
    const ducts = Object.values(entitiesById)
      .filter((entity): entity is Duct => entity.type === 'duct')
      .sort((a, b) => a.id.localeCompare(b.id));

    const desired = new Map<string, FittingPlanDescriptor>();

    for (const duct of ducts) {
      const junctions = this.findJunctionsForDuct(duct, entitiesById);
      for (const junction of junctions) {
        const fitting = this.buildFittingFromJunction(junction, entitiesById);
        if (!fitting) {
          continue;
        }

        const key = this.getFittingKey(fitting);
        if (desired.has(key)) {
          continue;
        }

        desired.set(key, {
          key,
          signature: this.getComparableFittingSignature(fitting),
          fitting,
        });
      }
    }

    return desired;
  }

  private static getDesiredFittingForExisting(
    fitting: Fitting,
    entitiesById: Record<string, Entity>
  ): Fitting | null {
    const desired = Array.from(this.getDesiredAutoFittingsByKey(entitiesById).values())
      .map((entry) => entry.fitting)
      .filter((candidate) => {
        const candidateDucts = this.getFittingDuctIds(candidate);
        const fittingDucts = this.getFittingDuctIds(fitting);
        if (candidateDucts.length !== fittingDucts.length) {
          return false;
        }
        return candidateDucts.every((ductId, index) => ductId === fittingDucts[index]);
      })
      .sort((a, b) => {
        const distanceA = Math.hypot(a.transform.x - fitting.transform.x, a.transform.y - fitting.transform.y);
        const distanceB = Math.hypot(b.transform.x - fitting.transform.x, b.transform.y - fitting.transform.y);
        return distanceA - distanceB;
      });

    return desired[0] ?? null;
  }

  private static findManualOverrideForKey(key: string, entitiesById: Record<string, Entity>): Fitting | null {
    return (
      Object.values(entitiesById)
        .filter(
          (entity): entity is Fitting =>
            entity.type === 'fitting' &&
            Boolean(entity.props.autoInserted) &&
            Boolean(entity.props.manualOverride)
        )
        .find((fitting) => this.getFittingKey(fitting) === key) ?? null
    );
  }

  private static findAnyFittingForKey(key: string, entitiesById: Record<string, Entity>): Fitting | null {
    return (
      Object.values(entitiesById)
        .filter((entity): entity is Fitting => entity.type === 'fitting')
        .find((fitting) => this.getFittingKey(fitting) === key) ?? null
    );
  }

  private static getFittingKey(fitting: Fitting): string {
    const ductIds = this.getFittingDuctIds(fitting).join('|');
    return `${ductIds}@${this.roundCoordinate(fitting.transform.x)},${this.roundCoordinate(fitting.transform.y)}`;
  }

  private static getComparableFittingSignature(fitting: Fitting): string {
    return JSON.stringify({
      key: this.getFittingKey(fitting),
      fittingType: fitting.props.fittingType,
      angle: fitting.props.angle ?? null,
      rotation: this.roundCoordinate(fitting.transform.rotation ?? 0),
      serviceId: fitting.props.serviceId ?? null,
      connectionPoints: (fitting.props.connectionPoints ?? [])
        .map((point) => ({ ductId: point.ductId, pointIndex: point.pointIndex ?? null }))
        .sort((a, b) => `${a.ductId}:${a.pointIndex}`.localeCompare(`${b.ductId}:${b.pointIndex}`)),
      transitionData: fitting.props.transitionData ?? null,
    });
  }

  private static roundCoordinate(value: number): string {
    return value.toFixed(COORDINATE_PRECISION);
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

export const fittingInsertionService = FittingInsertionService;
