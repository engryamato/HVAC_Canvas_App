import type { Point2D, ResolvedConnectionPoint } from './types';

export interface ConnectionPointSnapOptions {
  tolerance: number;
  desiredDirection?: Point2D;
  includeOccupied?: boolean;
}

export interface ConnectionPointSnapResult {
  connectionPoint: ResolvedConnectionPoint;
  distance: number;
  directionAlignment: number;
  score: number;
}

export function findBestConnectionPoint(
  cursor: Point2D,
  candidates: ResolvedConnectionPoint[],
  options: ConnectionPointSnapOptions
): ConnectionPointSnapResult | null {
  const scored = candidates
    .filter((candidate) => options.includeOccupied || candidate.status === 'available')
    .map((candidate) => scoreConnectionPoint(cursor, candidate, options))
    .filter((result): result is ConnectionPointSnapResult => result !== null)
    .sort(compareSnapResults);

  return scored[0] ?? null;
}

export function scoreConnectionPoint(
  cursor: Point2D,
  connectionPoint: ResolvedConnectionPoint,
  options: ConnectionPointSnapOptions
): ConnectionPointSnapResult | null {
  const distance = Math.hypot(
    cursor.x - connectionPoint.worldPosition.x,
    cursor.y - connectionPoint.worldPosition.y
  );

  if (distance > options.tolerance) {
    return null;
  }

  const directionAlignment = options.desiredDirection
    ? dot(normalize(options.desiredDirection), normalize(connectionPoint.facingDirection))
    : 0;

  return {
    connectionPoint,
    distance,
    directionAlignment,
    score: distance - directionAlignment * 0.001,
  };
}

function compareSnapResults(a: ConnectionPointSnapResult, b: ConnectionPointSnapResult): number {
  const distanceDelta = a.distance - b.distance;
  if (Math.abs(distanceDelta) > 0.0001) {
    return distanceDelta;
  }

  const alignmentDelta = b.directionAlignment - a.directionAlignment;
  if (Math.abs(alignmentDelta) > 0.0001) {
    return alignmentDelta;
  }

  return stableId(a.connectionPoint).localeCompare(stableId(b.connectionPoint));
}

function stableId(connectionPoint: ResolvedConnectionPoint): string {
  return `${connectionPoint.objectId}:${connectionPoint.id}`;
}

function normalize(vector: Point2D): Point2D {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}
