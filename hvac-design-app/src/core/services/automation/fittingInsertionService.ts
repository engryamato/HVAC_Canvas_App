import type { Entity } from '@/core/schema';
import type { Fitting, FittingProps, FittingType } from '../../schema/fitting.schema';
import type { Duct, DuctProps } from '../../schema/duct.schema';
import type { DuctRun } from '../../schema/duct-run.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { createFitting } from '@/features/canvas/entities/fittingDefaults';
import { getDuctCenterline, resolveLocalFittingPorts } from '@/features/canvas/services/connectionPoints';
import { computeFittingOriginForAnchorSnap } from '@/features/canvas/services/fittingConnectionService';
import {
  calculateAngleDifference as calculateDuctAngleDifference,
  detectDuctProfileChange,
  getDuctConnectionEndpoints,
  getDuctProfile,
  isStraightConnectionAngle,
  type DuctProfile,
} from '../ductConnections';

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
  profile?: DuctProfile;
  diameter?: number;
  width?: number;
  height?: number;
}

export interface JunctionAnalysis {
  type: 'elbow' | 'tee' | 'wye' | 'cross' | 'transition' | 'cap' | 'tap';
  location?: Point;
  ducts?: string[];
  angle?: number;
  branches?: ConnectionPoint[];
  sizeChange?: { from: number; to: number; fromShape?: DuctShape; toShape?: DuctShape };
  warning?: string;
}

export type DuctShape = 'round' | 'rectangular';

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
  conflictReason?: 'manual_override_conflicts_with_desired_auto_fitting';
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
const WYE_BRANCH_ANGLE_THRESHOLD = 60;
// WS6c Part 1 — tee/wye hysteresis deadband. Commit wye below 55°, tee above
// 65°, and keep the prior classification between 55–65° to stop flip-flop while
// dragging a branch through the boundary. Tunable.
const WYE_TEE_DEADBAND_LOW = 55;
const WYE_TEE_DEADBAND_HIGH = 65;
const ANGLE_EPSILON = 0.000001;
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

  static analyzeMultiDuctJunction(
    connections: ConnectionPoint[],
    previousType?: 'tee' | 'wye'
  ): JunctionAnalysis {
    const sortedConnections = [...connections].sort((a, b) => a.ductId.localeCompare(b.ductId));

    if (connections.length === 2) {
      const first = sortedConnections[0];
      const second = sortedConnections[1];
      if (!first || !second) {
        return { type: 'cap' };
      }
      const angle = this.calculateAngleBetweenConnectionPoints(first, second);
      const fittingTurnAngle = this.calculateFittingTurnAngle(first, second);
      const sizeChange = this.detectSizeChange(first, second);

      if (sizeChange && this.isStraightAngle(angle)) {
        return { type: 'transition', angle: fittingTurnAngle, branches: sortedConnections, sizeChange };
      }

      return {
        type: this.isStraightAngle(angle) ? 'cap' : 'elbow',
        // Store the true centerline deflection so the elbow geometry can follow
        // it; the elbow_45 / elbow_90 catalog type is still chosen by nearest.
        angle: fittingTurnAngle,
        branches: sortedConnections,
      };
    }

    if (connections.length === 3) {
      // Check for body tap: two collinear connections with opposite endPoints
      // (suggesting same continuous duct) + a perpendicular branch
      const bodyTap = this.classifyBodyTap(sortedConnections);
      if (bodyTap) {
        return {
          type: 'tap',
          angle: bodyTap.branchAngle,
          branches: sortedConnections,
        };
      }
      const branch = this.classifyThreeWayJunction(sortedConnections, previousType);
      return {
        type: branch.type,
        angle: branch.branchAngle,
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
        break;

      case 'wye':
        fittingType = 'wye';
        break;

      case 'tap':
        fittingType = 'takeoff';
        break;

      case 'transition':
        fittingType =
          junction.sizeChange?.fromShape &&
          junction.sizeChange.toShape &&
          junction.sizeChange.fromShape !== junction.sizeChange.toShape
            ? 'transition_square_to_round'
            : 'reducer';
        if (junction.sizeChange) {
          const { from, to, fromShape, toShape } = junction.sizeChange;
          additionalProps.transitionData = {
            fromShape,
            toShape,
            ...(fromShape === 'round' ? { fromDiameter: from } : {}),
            ...(toShape === 'round' ? { toDiameter: to } : {}),
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
      connectionPoints: this.buildFittingConnectionPoints(junction, fittingType),
      ...additionalProps,
    };
  }

  static planAutoInsertForDuct(newDuctId: string, entitiesById?: Record<string, Entity>): AutoInsertPlan {
    const entities = entitiesById ?? (useEntityStore.getState().byId as Record<string, Entity>);
    const newDuct = entities[newDuctId];
    if (!newDuct || (newDuct.type !== 'duct' && newDuct.type !== 'duct_run')) {
      return { insertions: [], orphanFittingIds: this.detectOrphanFittings(entities) };
    }

    const junctions = this.findJunctionsForDuct(newDuct as Duct | DuctRun, entities);
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
    const preservedManualOverrideKeys = new Set<string>();
    const conflictingManualOverrideIds = new Set<string>();

    for (const [key, desired] of desiredByKey.entries()) {
      const manualOverride = manualOverrideByKey.get(key);
      if (manualOverride) {
        const existingSignature = this.getComparableFittingSignature(manualOverride);
        if (!this.manualOverrideConflictsWithDesired(manualOverride, desired.fitting)) {
          preservedManualOverrideKeys.add(key);
          continue;
        }

        conflictingManualOverrideIds.add(manualOverride.id);
        changes.push({
          action: 'update',
          key,
          existingFittingId: manualOverride.id,
          existingSignature,
          desiredFitting: desired.fitting,
          desiredSignature: desired.signature,
          conflictReason: 'manual_override_conflicts_with_desired_auto_fitting',
        });
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
      preservedManualOverrideCount:
        preservedManualOverrideKeys.size +
        Array.from(manualOverrideByKey.values()).filter(
          (fitting) => !conflictingManualOverrideIds.has(fitting.id) && !desiredByKey.has(this.getFittingKey(fitting))
        ).length,
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

      if (manualOverrideAtKey && manualOverrideAtKey.id !== change.existingFittingId) {
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

      const fittingCurrent = current as Fitting;

      if (fittingCurrent.props.manualOverride && !change.conflictReason) {
        manualOverridesPreserved += 1;
        continue;
      }

      if (this.getComparableFittingSignature(fittingCurrent) !== change.existingSignature) {
        skippedChangedCount += 1;
        continue;
      }

      if (change.action === 'remove') {
        if (desiredNow) {
          skippedChangedCount += 1;
          continue;
        }

        operations.push({ action: 'remove', previous: fittingCurrent });
        delete workingEntities[current.id];
        removedCount += 1;
        continue;
      }

      if (!desiredNow || desiredNow.signature !== change.desiredSignature) {
        skippedChangedCount += 1;
        continue;
      }

      const next: Fitting = {
        ...fittingCurrent,
        props: {
          ...desiredNow.fitting.props,
          name: fittingCurrent.props.name,
          manualOverride: false,
          autoInserted: true,
          autoGenerated: true,
        },
        transform: { ...desiredNow.fitting.transform },
        modifiedAt: new Date().toISOString(),
      };
      operations.push({ action: 'update', previous: fittingCurrent, next });
      workingEntities[fittingCurrent.id] = next;
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
      .filter((fitting) => !fitting.props.manualOverride)
      .filter((fitting) => {
        const ductIds = this.getFittingDuctIds(fitting);
        if (ductIds.length === 0) {
          return true;
        }

        const validDucts = ductIds.filter((id) => byId[id]?.type === 'duct' || byId[id]?.type === 'duct_run');
        if (validDucts.length !== ductIds.length) {
          return true;
        }

        if (fitting.props.fittingType === 'tee' || fitting.props.fittingType === 'wye') {
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
  ): { from: number; to: number; fromShape?: DuctShape; toShape?: DuctShape } | null {
    const profile1 = this.getConnectionProfile(duct1);
    const profile2 = this.getConnectionProfile(duct2);

    if (profile1 && profile2) {
      if (detectDuctProfileChange(profile1, profile2)) {
        return {
          from: profile1.equivalentDiameter,
          to: profile2.equivalentDiameter,
          fromShape: profile1.shape,
          toShape: profile2.shape,
        };
      }
      return null;
    }

    const size1 = this.getDuctSize(duct1);
    const size2 = this.getDuctSize(duct2);

    if (Math.abs(size1 - size2) > 1) {
      return { from: size1, to: size2 };
    }

    return null;
  }

  private static getDuctSize(duct: Partial<DuctProps> | ConnectionPoint): number {
    const profile = this.getConnectionProfile(duct);
    if (profile) {
      return profile.equivalentDiameter;
    }

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
    return isStraightConnectionAngle(angle, STRAIGHT_ANGLE_TOLERANCE);
  }

  private static normalizeElbowAngle(angle: number): number {
    return Math.abs(angle - 45) <= 15 ? 45 : 90;
  }

  private static calculateAngleBetweenConnectionPoints(a: ConnectionPoint, b: ConnectionPoint): number {
    return this.calculateAngleDifference(a.angle, b.angle);
  }

  private static calculateFittingTurnAngle(a: ConnectionPoint, b: ConnectionPoint): number {
    const inlet = a.endPoint === 'end' ? a : b.endPoint === 'end' ? b : a;
    const outlet = inlet === a ? b : a;
    const inletOutward = this.outwardDirectionForEndpoint(inlet);
    const inletIntoFitting = { x: -inletOutward.x, y: -inletOutward.y };
    const outletOutward = this.outwardDirectionForEndpoint(outlet);

    return this.calculateAngleDifference(
      vectorAngle(inletIntoFitting),
      vectorAngle(outletOutward)
    );
  }

  private static calculateAngleDifference(a: number, b: number): number {
    return calculateDuctAngleDifference(a, b);
  }

  /**
   * Classify a 3-way junction as a tee or a wye from the duct centerlines, and
   * return the branch angle (degrees, measured against the main run) so the
   * fitting geometry can be generated to follow the detected angle.
   */
  private static classifyThreeWayJunction(
    connections: ConnectionPoint[],
    previousType?: 'tee' | 'wye'
  ): { type: 'tee' | 'wye'; branchAngle: number } {
    const main = this.findMainRunPair(connections);
    if (!main) {
      return { type: 'tee', branchAngle: 90 };
    }

    const branch = connections.find((connection) => connection !== main.first && connection !== main.second);
    if (!branch) {
      return { type: 'tee', branchAngle: 90 };
    }

    const rawBranchAngle = Math.min(
      this.calculateAngleDifference(branch.angle, main.first.angle),
      this.calculateAngleDifference(branch.angle, main.second.angle)
    );
    // Fold to the acute branch angle off the main run (0–90).
    const branchAngle = rawBranchAngle > 90 ? 180 - rawBranchAngle : rawBranchAngle;
    const type = this.classifyTeeWyeWithHysteresis(branchAngle, previousType);
    return { type, branchAngle };
  }

  /**
   * WS6c Part 1 — sticky tee/wye classification. Commits to wye below the low
   * deadband edge and tee above the high edge; inside the 55–65° deadband it
   * keeps the prior classification (if any) so a branch dragged through the
   * boundary does not flip-flop. With no prior classification it falls back to
   * the ratified single cutoff (wye ≤ 60°, tee > 60°).
   */
  private static classifyTeeWyeWithHysteresis(
    branchAngle: number,
    previousType?: 'tee' | 'wye'
  ): 'tee' | 'wye' {
    if (branchAngle < WYE_TEE_DEADBAND_LOW - ANGLE_EPSILON) {
      return 'wye';
    }
    if (branchAngle > WYE_TEE_DEADBAND_HIGH + ANGLE_EPSILON) {
      return 'tee';
    }
    if (previousType) {
      return previousType;
    }
    return branchAngle <= WYE_BRANCH_ANGLE_THRESHOLD + ANGLE_EPSILON ? 'wye' : 'tee';
  }

  /**
   * Find the tee/wye classification of an existing auto-inserted fitting that
   * already sits at this junction (matched by its inlet+outlet ducts), so the
   * hysteresis deadband can stay sticky across drag re-evaluations.
   */
  private static findPriorTeeWyeType(
    ductIds: string[],
    entitiesById: Record<string, Entity>
  ): 'tee' | 'wye' | undefined {
    const ductSet = new Set(ductIds);
    for (const entity of Object.values(entitiesById)) {
      if (entity.type !== 'fitting') {
        continue;
      }
      const fittingType = entity.props.fittingType;
      if (fittingType !== 'tee' && fittingType !== 'wye') {
        continue;
      }
      const { inletDuctId, outletDuctId } = entity.props;
      if (inletDuctId && outletDuctId && ductSet.has(inletDuctId) && ductSet.has(outletDuctId)) {
        return fittingType;
      }
    }
    return undefined;
  }

  /**
   * Detect a body takeoff (tap) junction: a branch connecting perpendicularly
   * to the body of a continuous trunk duct. The trunk appears as two connections
   * with opposite endPoints (one 'start', one 'end') at collinear angles (~0 or ~180),
   * and the branch is perpendicular (~90 deg) AND connects at a position along the
   * trunk body (not at the trunk endpoints).
   */
  private static classifyBodyTap(connections: ConnectionPoint[]): { branchAngle: number } | null {
    // Find the two most collinear connections (potential main run)
    const main = this.findMainRunPair(connections);
    if (!main) {
      return null;
    }

    const branch = connections.find((c) => c !== main.first && c !== main.second);
    if (!branch) {
      return null;
    }

    // Check if main run connections have opposite endPoints (one 'start', one 'end')
    // suggesting they are the same continuous duct
    const firstEndPoint = main.first.endPoint;
    const secondEndPoint = main.second.endPoint;
    const hasOppositeEndPoints = (firstEndPoint === 'start' && secondEndPoint === 'end') ||
                                  (firstEndPoint === 'end' && secondEndPoint === 'start');

    if (!hasOppositeEndPoints) {
      return null;
    }

    // Check if branch is perpendicular to main run (~90 degrees)
    const rawBranchAngle = Math.min(
      this.calculateAngleDifference(branch.angle, main.first.angle),
      this.calculateAngleDifference(branch.angle, main.second.angle)
    );
    const branchAngle = rawBranchAngle > 90 ? 180 - rawBranchAngle : rawBranchAngle;

    // Body tap: branch angle close to 90 degrees (perpendicular)
    const PERPENDICULAR_TOLERANCE = 20;
    if (Math.abs(branchAngle - 90) > PERPENDICULAR_TOLERANCE) {
      return null;
    }

    // Additional check: branch position should be on the trunk body, not at the junction.
    // For a body tap, the trunk endpoints are at different positions (trunk has length),
    // and the branch connects somewhere between them.
    // For a tee, all three connections are at the same junction point.
    const trunkStart = main.first.point;
    const trunkEnd = main.second.point;
    const branchPos = branch.point;

    // Check if trunk has meaningful length (endpoints at different positions)
    const trunkLength = Math.hypot(trunkEnd.x - trunkStart.x, trunkEnd.y - trunkStart.y);
    if (trunkLength < 1) {
      return null; // Trunk endpoints coincide - not a body tap
    }

    // Check if branch position is between trunk endpoints (on the body)
    // Project branch position onto trunk line and check if it's between endpoints
    const trunkDx = trunkEnd.x - trunkStart.x;
    const trunkDy = trunkEnd.y - trunkStart.y;
    const branchDx = branchPos.x - trunkStart.x;
    const branchDy = branchPos.y - trunkStart.y;

    // Dot product to find projection parameter t
    const trunkLenSq = trunkDx * trunkDx + trunkDy * trunkDy;
    const t = (branchDx * trunkDx + branchDy * trunkDy) / trunkLenSq;

    // t should be between 0 and 1 (on the trunk segment), and not at the endpoints
    // (t=0 is trunk start, t=1 is trunk end - those are junction points for tees)
    const ENDPOINT_TOLERANCE = 0.1;
    if (t > ENDPOINT_TOLERANCE && t < 1 - ENDPOINT_TOLERANCE) {
      return { branchAngle };
    }

    return null;
  }

  private static findMainRunPair(connections: ConnectionPoint[]): { first: ConnectionPoint; second: ConnectionPoint } | null {
    let best: { first: ConnectionPoint; second: ConnectionPoint; straightness: number } | null = null;

    for (let i = 0; i < connections.length; i += 1) {
      for (let j = i + 1; j < connections.length; j += 1) {
        const first = connections[i]!;
        const second = connections[j]!;
        const angle = this.calculateAngleDifference(first.angle, second.angle);
        const straightness = Math.min(angle, Math.abs(180 - angle));
        if (!best || straightness < best.straightness) {
          best = { first, second, straightness };
        }
      }
    }

    return best;
  }

  private static normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360;
  }

  private static findJunctionsForDuct(newDuct: Duct | DuctRun, entitiesById: Record<string, Entity>): JunctionAnalysis[] {
    const newEndpoints = this.getDuctEndpoints(newDuct);
    const otherDucts = Object.values(entitiesById).filter(
      (entity): entity is Duct | DuctRun =>
        (entity.type === 'duct' || entity.type === 'duct_run') && entity.id !== newDuct.id
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
      const previousTeeWyeType = this.findPriorTeeWyeType(
        branchPoints.map((point) => point.ductId),
        entitiesById
      );
      const analysis = this.analyzeMultiDuctJunction(branchPoints, previousTeeWyeType);
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

  private static getDuctEndpoints(duct: Duct | DuctRun): ConnectionPoint[] {
    if (duct.type === 'duct_run') {
      const design = getDuctCenterline(duct);
      const angle = this.normalizeAngle(
        (Math.atan2(design.end.y - design.start.y, design.end.x - design.start.x) * 180) / Math.PI
      );
      const profile = getDuctProfile(duct);
      return [
        {
          ductId: duct.id,
          endPoint: 'start',
          point: design.start,
          angle,
          profile,
          diameter: profile.diameter,
          width: profile.width,
          height: profile.height,
        },
        {
          ductId: duct.id,
          endPoint: 'end',
          point: design.end,
          angle,
          profile,
          diameter: profile.diameter,
          width: profile.width,
          height: profile.height,
        },
      ];
    }

    return getDuctConnectionEndpoints(duct).map((endpoint) => ({
      ductId: endpoint.ductId,
      endPoint: endpoint.endPoint,
      point: endpoint.point,
      angle: endpoint.angle,
      profile: endpoint.profile,
      diameter: endpoint.profile.diameter,
      width: endpoint.profile.width,
      height: endpoint.profile.height,
    }));
  }

  private static getConnectionProfile(duct: Partial<DuctProps> | ConnectionPoint): DuctProfile | null {
    if ('profile' in duct && duct.profile) {
      return duct.profile;
    }

    if ('shape' in duct && duct.shape) {
      const candidate = {
        id: 'profile-source',
        type: 'duct',
        transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        props: duct,
        calculated: {},
        createdAt: '',
        modifiedAt: '',
      } as Duct;
      return getDuctProfile(candidate);
    }

    return null;
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
    if (!firstDuct || (firstDuct.type !== 'duct' && firstDuct.type !== 'duct_run')) {
      return null;
    }

    const fittingProps = this.insertFittingAtJunction(
      junction,
      junction.location,
      firstDuct.type === 'duct' ? firstDuct.props : {}
    );
    const transitionData = this.buildTransitionDataFromBranches(junction.branches) ?? fittingProps.transitionData;
    const fittingType = fittingProps.fittingType ?? 'elbow_90';
    const placement = this.getFittingPlacement(junction, fittingType, fittingProps, transitionData, firstDuct);

    const fitting = createFitting(fittingType, {
      x: placement.origin.x,
      y: placement.origin.y,
      rotation: placement.rotation,
      angle: fittingProps.angle,
      inletDuctId,
      outletDuctId,
      autoGenerated: true,
      autoInserted: true,
      manualOverride: false,
      connectionPoints: fittingProps.connectionPoints,
      transitionData,
      serviceId: 'serviceId' in firstDuct.props ? firstDuct.props.serviceId : undefined,
    });
    fitting.transform.scaleY = placement.scaleY;
    return fitting;
  }

  private static buildTransitionDataFromBranches(
    branches: ConnectionPoint[] | undefined
  ): FittingProps['transitionData'] | undefined {
    const profiles = branches?.map((branch) => branch.profile).filter((profile): profile is DuctProfile => Boolean(profile)) ?? [];
    const inletProfile = profiles[0];
    if (!inletProfile) {
      return undefined;
    }

    const outletProfile = profiles[1] ?? inletProfile;
    return {
      fromShape: inletProfile.shape,
      fromDiameter: inletProfile.diameter,
      fromWidth: inletProfile.width,
      fromHeight: inletProfile.height,
      toShape: outletProfile.shape,
      toDiameter: outletProfile.diameter,
      toWidth: outletProfile.width,
      toHeight: outletProfile.height,
    };
  }

  private static getFittingRotation(junction: JunctionAnalysis, firstDuct: Duct | DuctRun): number {
    const branches = junction.branches ?? [];
    if ((junction.type === 'tee' || junction.type === 'wye') && branches.length >= 2) {
      const sorted = [...branches].sort((a, b) => a.ductId.localeCompare(b.ductId));
      return sorted[0]?.angle ?? firstDuct.transform.rotation ?? 0;
    }

    return branches[0]?.angle ?? firstDuct.transform.rotation ?? 0;
  }

  private static getFittingPlacement(
    junction: JunctionAnalysis,
    fittingType: FittingType,
    fittingProps: Partial<FittingProps>,
    transitionData: FittingProps['transitionData'] | undefined,
    firstDuct: Duct | DuctRun
  ): { origin: Point; rotation: number; scaleY: number } {
    const baseRotation = this.getFittingRotation(junction, firstDuct);
    const temp = createPlacementProbe(fittingType, {
      rotation: baseRotation,
      angle: fittingProps.angle,
      connectionPoints: fittingProps.connectionPoints,
      transitionData,
    });
    const assignments = this.getAssignedBranches(junction, fittingProps.connectionPoints);
    const inlet = assignments.find((assignment) => assignment.pointIndex === 0)?.branch;

    const localPorts = resolveLocalFittingPorts(temp);
    const inletPort = localPorts[0];
    let rotation = baseRotation;
    let scaleY = 1;

    if (inlet && inletPort) {
      const inletOutward = this.outwardDirectionForEndpoint(inlet);
      rotation = this.normalizeAngle(vectorAngle(inletOutward) - vectorAngle(inletPort.facingDirection));
    }

    if (this.scoreAssignedPortDirections(assignments, localPorts, rotation, -1) > this.scoreAssignedPortDirections(assignments, localPorts, rotation, 1)) {
      scaleY = -1;
    }

    temp.transform.rotation = rotation;
    temp.transform.scaleY = scaleY;
    const origin = junction.location
      ? computeFittingOriginForAnchorSnap(temp, junction.location, rotation, 1, scaleY)
      : { x: 0, y: 0 };
    return { origin, rotation, scaleY };
  }

  private static getAssignedBranches(
    junction: JunctionAnalysis,
    connectionPoints: Array<{ ductId: string; pointIndex?: number }> | undefined
  ): Array<{ branch: ConnectionPoint; pointIndex: number }> {
    const branches = junction.branches ?? [];
    return branches.map((branch, index) => ({
      branch,
      pointIndex: connectionPoints?.find((point) => point.ductId === branch.ductId)?.pointIndex ?? index,
    }));
  }

  private static scoreAssignedPortDirections(
    assignments: Array<{ branch: ConnectionPoint; pointIndex: number }>,
    localPorts: Array<{ facingDirection: Point }>,
    rotation: number,
    scaleY: number
  ): number {
    return assignments.reduce((score, assignment) => {
      const port = localPorts[assignment.pointIndex];
      if (!port) {
        return score;
      }
      const predicted = rotateVector(port.facingDirection, rotation, scaleY);
      return score + dot(predicted, this.outwardDirectionForEndpoint(assignment.branch));
    }, 0);
  }

  private static outwardDirectionForEndpoint(connection: ConnectionPoint): Point {
    const radians = (connection.angle * Math.PI) / 180;
    const along = { x: Math.cos(radians), y: Math.sin(radians) };
    return connection.endPoint === 'start' ? along : { x: -along.x, y: -along.y };
  }

  private static buildFittingConnectionPoints(
    junction: JunctionAnalysis,
    fittingType: FittingType
  ): Array<{ ductId: string; pointIndex?: number }> | undefined {
    const branches = junction.branches ?? [];
    if (branches.length === 0) {
      return undefined;
    }

    const inlet = branches.find((branch) => branch.endPoint === 'end') ?? branches[0];
    const assigned = new Map<string, number>();

    if (inlet) {
      assigned.set(inlet.ductId, 0);
    }

    if (fittingType === 'tee' || fittingType === 'wye') {
      const outgoing = branches.filter((branch) => branch.ductId !== inlet?.ductId);
      const straight = outgoing
        .filter((branch) => this.isStraightAngle(this.calculateAngleDifference(branch.angle, inlet?.angle ?? 0)))
        .sort((a, b) => a.ductId.localeCompare(b.ductId))[0];
      if (straight) {
        assigned.set(straight.ductId, 1);
      }

      const branch = outgoing
        .filter((candidate) => candidate.ductId !== straight?.ductId)
        .sort((a, b) => a.ductId.localeCompare(b.ductId))[0];
      if (branch) {
        assigned.set(branch.ductId, 2);
      }
    } else {
      const outlet = branches
        .filter((branch) => branch.ductId !== inlet?.ductId)
        .sort((a, b) => a.ductId.localeCompare(b.ductId))[0];
      if (outlet) {
        assigned.set(outlet.ductId, 1);
      }
    }

    return branches.map((branch, index) => ({
      ductId: branch.ductId,
      pointIndex: assigned.get(branch.ductId) ?? index,
    }));
  }

  private static isDuplicateFitting(candidate: Fitting, existing: Fitting[]): boolean {
    const candidateDucts = new Set(this.getFittingDuctIds(candidate));

    return existing.some((fitting) => {
      const fittingDucts = new Set(this.getFittingDuctIds(fitting));
      if (fittingDucts.size === candidateDucts.size) {
        let sameDucts = true;
        for (const ductId of candidateDucts) {
          if (!fittingDucts.has(ductId)) {
            sameDucts = false;
            break;
          }
        }
        if (sameDucts && fitting.props.manualOverride) {
          return true;
        }
      }

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
      .filter((entity): entity is Duct | DuctRun => entity.type === 'duct' || entity.type === 'duct_run')
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

  private static manualOverrideConflictsWithDesired(manualOverride: Fitting, desired: Fitting): boolean {
    if (manualOverride.props.fittingType !== desired.props.fittingType) {
      return true;
    }

    if (this.roundCoordinate(manualOverride.transform.rotation ?? 0) !== this.roundCoordinate(desired.transform.rotation ?? 0)) {
      return true;
    }

    if (
      typeof manualOverride.props.angle === 'number' &&
      manualOverride.props.angle !== (desired.props.angle ?? null)
    ) {
      return true;
    }

    const comparesTransitionData =
      manualOverride.props.fittingType === 'reducer' ||
      manualOverride.props.fittingType === 'reducer_tapered' ||
      manualOverride.props.fittingType === 'transition_square_to_round';
    return comparesTransitionData
      ? JSON.stringify(manualOverride.props.transitionData ?? null) !== JSON.stringify(desired.props.transitionData ?? null)
      : false;
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
      elevation: 0,
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

function vectorAngle(vector: Point): number {
  return (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
}

function rotateVector(vector: Point, rotationDeg: number, scaleY: number): Point {
  const radians = (rotationDeg * Math.PI) / 180;
  const x = vector.x;
  const y = vector.y * scaleY;
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  };
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function createPlacementProbe(
  fittingType: FittingType,
  overrides: Pick<Partial<FittingProps>, 'angle' | 'connectionPoints' | 'transitionData'> & { rotation: number }
): Fitting {
  return {
    id: 'placement-probe',
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: overrides.rotation, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      engineeringSystem: 'standard_duct',
      fittingType,
      angle: overrides.angle,
      connectionPoints: overrides.connectionPoints,
      transitionData: overrides.transitionData,
      autoGenerated: false,
      autoInserted: false,
      manualOverride: false,
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}
