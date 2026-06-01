import type { Fitting } from '@/core/schema';
import type { ConnectionProfile, Point2D, ResolvedConnectableGeometry, ResolvedConnectionPoint } from './types';
import { buildFittingGeometry, resolveFittingDimensions } from './fittingGeometry';

export interface LocalPortDefinition {
  id: string;
  role: string;
  label?: string;
  localPosition: Point2D;
  facingDirection: Point2D;
  profile?: ConnectionProfile;
}

const DEFAULT_PROFILE: ConnectionProfile = { shape: 'round', diameter: 12 };

export function resolveFittingGeometry(fitting: Fitting): ResolvedConnectableGeometry {
  const geometry = buildFittingGeometry(fitting);
  const localPorts = geometry.openings.map((opening) =>
    port(opening.id, opening.role, opening.position, opening.direction, opening.profile)
  );
  const connectionPoints = localPorts.map((definition) => toResolvedConnectionPoint(fitting, definition));

  return {
    objectId: fitting.id,
    objectType: 'fitting',
    sourceEntity: fitting,
    anchor: {
      localPosition: scaledPoint(geometry.anchor, fitting),
      worldPosition: transformPoint(fitting, scaledPoint(geometry.anchor, fitting)),
    },
    connectionPoints,
    occupiedBounds: localBoundsToWorld(fitting, geometry.maskBounds),
  };
}

/**
 * Local-space connection ports for a fitting, derived from the single shared
 * geometry builder so ports always sit exactly on the drawn body openings.
 */
export function resolveLocalFittingPorts(fitting: Fitting): LocalPortDefinition[] {
  const geometry = buildFittingGeometry(fitting);
  return geometry.openings.map((opening) =>
    port(opening.id, opening.role, opening.position, opening.direction, opening.profile)
  );
}

export interface WyeDiameters {
  commonDiameter: number;
  straightDiameter: number;
  branchDiameter: number;
}

/**
 * Resolve a wye's common/straight/branch diameters. Retained for callers that
 * need the raw diameters; delegates to the shared dimension resolver.
 */
export function resolveWyeDiameters(fitting: Fitting): WyeDiameters {
  const dims = resolveFittingDimensions(fitting);
  return {
    commonDiameter: dims.inletSize,
    straightDiameter: dims.outletSize,
    branchDiameter: dims.branchSize,
  };
}

/** Transform a local AABB into a world AABB (rotation-aware via corner spread). */
function localBoundsToWorld(
  fitting: Fitting,
  bounds: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const corners: Point2D[] = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ].map((corner) => transformPoint(fitting, { x: corner.x * fitting.transform.scaleX, y: corner.y * fitting.transform.scaleY }));

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
  }
  return { x: round(minX), y: round(minY), width: round(maxX - minX), height: round(maxY - minY) };
}

function toResolvedConnectionPoint(fitting: Fitting, definition: LocalPortDefinition): ResolvedConnectionPoint {
  const localPosition = scaledPoint(definition.localPosition, fitting);
  const localDirection = normalize(scaledPoint(definition.facingDirection, fitting));

  return {
    id: definition.id,
    objectId: fitting.id,
    objectType: 'fitting',
    role: definition.role,
    label: definition.label,
    localPosition,
    worldPosition: transformPoint(fitting, localPosition),
    facingDirection: rotateVector(localDirection, fitting.transform.rotation),
    connectionProfile: definition.profile ?? DEFAULT_PROFILE,
    status: 'available',
  };
}

function scaledPoint(point: Point2D, fitting: Fitting): Point2D {
  return {
    x: point.x * fitting.transform.scaleX,
    y: point.y * fitting.transform.scaleY,
  };
}

function port(
  id: string,
  role: string,
  localPosition: Point2D,
  facingDirection: Point2D,
  profile = DEFAULT_PROFILE
): LocalPortDefinition {
  return {
    id,
    role,
    localPosition,
    facingDirection: normalize(facingDirection),
    profile,
  };
}

function transformPoint(fitting: Fitting, point: Point2D): Point2D {
  const rotated = rotateVector(point, fitting.transform.rotation);
  return {
    x: round(fitting.transform.x + rotated.x),
    y: round(fitting.transform.y + rotated.y),
  };
}

function rotateVector(vector: Point2D, rotationDeg: number): Point2D {
  const radians = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: round(vector.x * cos - vector.y * sin),
    y: round(vector.x * sin + vector.y * cos),
  };
}

function normalize(vector: Point2D): Point2D {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: round(vector.x / length),
    y: round(vector.y / length),
  };
}

function round(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
