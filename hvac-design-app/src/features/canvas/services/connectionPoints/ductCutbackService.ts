import { feetToPixels, pixelsToFeet } from '@/core/constants/coordinates';
import type { Duct, DuctRun } from '@/core/schema';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import type { Point2D } from './types';

export type DuctLikeEntity = Duct | DuctRun;
export type DuctEndpointName = 'start' | 'end';

const EPSILON_PX = 0.05;

/**
 * Model-level duct cutback (PR-8).
 *
 * Given a duct/run whose `movingEnd` is connected to a fitting (or equipment)
 * port opening, snap that endpoint EXACTLY onto the opening center and shorten /
 * reposition the run so it terminates at the opening — never running beneath the
 * fitting body. The opposite endpoint is held fixed. `installLength`,
 * `startPoint`/`endPoint`, the transform, and `segments` are all recomputed
 * through the existing `recomputeDuctRunSegments` path.
 *
 * Mutates the passed entity in place but only by assigning fresh objects to
 * `props.startPoint`/`endPoint`/`segments` and a fresh `transform`, so callers
 * working on cloned-props entities (e.g. the reconciliation pipeline) never
 * corrupt the original shared references.
 *
 * Returns true when the geometry changed (the endpoint was not already on the
 * opening), so callers can keep their endpoint bookkeeping in sync.
 */
export function applyDuctEndpointCutback(
  duct: DuctLikeEntity,
  movingEnd: DuctEndpointName,
  target: Point2D
): boolean {
  ensureDuctDesignCenterline(duct);
  const design = getDuctCenterline(duct);
  const alignedTarget =
    duct.type === 'duct_run' ? projectPointToLine(target, design.start, design.end) : target;
  const { start, end } = getDuctEndpoints(duct);
  const moving = movingEnd === 'start' ? start : end;
  if (distance(moving, alignedTarget) <= EPSILON_PX) {
    return false;
  }

  const fixed = movingEnd === 'start' ? end : start;
  const newStart = movingEnd === 'start' ? alignedTarget : fixed;
  const newEnd = movingEnd === 'start' ? fixed : alignedTarget;

  const dx = newEnd.x - newStart.x;
  const dy = newEnd.y - newStart.y;
  const lengthPx = Math.hypot(dx, dy);
  if (lengthPx < EPSILON_PX) {
    // Degenerate (target coincides with the fixed end) — leave geometry alone.
    return false;
  }
  const rotation = normalizeDegrees((Math.atan2(dy, dx) * 180) / Math.PI);
  const installLength = pixelsToFeet(lengthPx);

  if (duct.type === 'duct_run') {
    duct.props.startPoint = { x: newStart.x, y: newStart.y };
    duct.props.endPoint = { x: newEnd.x, y: newEnd.y };
    duct.props.installLength = installLength;
    duct.transform = { ...duct.transform, x: newStart.x, y: newStart.y, rotation };
    const sectionLength = getActiveSectionLength(duct);
    duct.props.segments = recomputeDuctRunSegments(installLength, sectionLength, {
      insulationType: duct.props.insulationType,
      insulationThickness: duct.props.insulationThickness,
      startEndType: duct.props.startEndType,
      endEndType: duct.props.endEndType,
    });
    return true;
  }

  // Plain duct: origin is the start point, length is props.length.
  duct.props.length = installLength;
  duct.transform = { ...duct.transform, x: newStart.x, y: newStart.y, rotation };
  return true;
}

/** Restore a duct/run to its authored centerline after a fitting detach/removal. */
export function restoreDuctToDesign(duct: DuctLikeEntity): boolean {
  const design = getDuctCenterline(duct);
  const current = getDuctEndpoints(duct);
  if (
    distance(current.start, design.start) <= EPSILON_PX &&
    distance(current.end, design.end) <= EPSILON_PX
  ) {
    return false;
  }

  return applyDuctAppliedCenterline(duct, design.start, design.end, design.length);
}

/** Resolve the authored, uncut centerline. Missing legacy fields adopt the current geometry. */
export function getDuctCenterline(duct: DuctLikeEntity): {
  start: Point2D;
  end: Point2D;
  length: number;
} {
  ensureDuctDesignCenterline(duct);

  if (duct.type === 'duct_run') {
    return {
      start: { ...duct.props.designStartPoint! },
      end: { ...duct.props.designEndPoint! },
      length: duct.props.designLength ?? duct.props.installLength,
    };
  }

  const endpoints = getDuctEndpoints(duct);
  return { ...endpoints, length: duct.props.length };
}

/** Resolve a duct/run's start and end world points. */
export function getDuctEndpoints(duct: DuctLikeEntity): { start: Point2D; end: Point2D } {
  if (duct.type === 'duct_run') {
    const start = duct.props.startPoint ?? { x: duct.transform.x, y: duct.transform.y };
    const end =
      duct.props.endPoint ??
      projectEnd(start, duct.transform.rotation ?? 0, duct.props.installLength);
    return { start, end };
  }

  const start = { x: duct.transform.x, y: duct.transform.y };
  return { start, end: projectEnd(start, duct.transform.rotation ?? 0, duct.props.length) };
}

function ensureDuctDesignCenterline(duct: DuctLikeEntity): void {
  if (duct.type !== 'duct_run') {
    return;
  }

  if (
    duct.props.designStartPoint &&
    duct.props.designEndPoint &&
    typeof duct.props.designLength === 'number'
  ) {
    return;
  }

  const endpoints = getDuctEndpoints(duct);
  duct.props.designStartPoint ??= { ...endpoints.start };
  duct.props.designEndPoint ??= { ...endpoints.end };
  duct.props.designLength ??= duct.props.installLength;
}

function applyDuctAppliedCenterline(
  duct: DuctLikeEntity,
  newStart: Point2D,
  newEnd: Point2D,
  preferredLength?: number
): boolean {
  const dx = newEnd.x - newStart.x;
  const dy = newEnd.y - newStart.y;
  const lengthPx = Math.hypot(dx, dy);
  if (lengthPx < EPSILON_PX) {
    return false;
  }

  const rotation = normalizeDegrees((Math.atan2(dy, dx) * 180) / Math.PI);
  const installLength = preferredLength ?? pixelsToFeet(lengthPx);

  if (duct.type === 'duct_run') {
    duct.props.startPoint = { x: newStart.x, y: newStart.y };
    duct.props.endPoint = { x: newEnd.x, y: newEnd.y };
    duct.props.installLength = installLength;
    duct.transform = { ...duct.transform, x: newStart.x, y: newStart.y, rotation };
    const sectionLength = getActiveSectionLength(duct);
    duct.props.segments = recomputeDuctRunSegments(installLength, sectionLength, {
      insulationType: duct.props.insulationType,
      insulationThickness: duct.props.insulationThickness,
      startEndType: duct.props.startEndType,
      endEndType: duct.props.endEndType,
    });
    return true;
  }

  duct.props.length = installLength;
  duct.transform = { ...duct.transform, x: newStart.x, y: newStart.y, rotation };
  return true;
}

function projectEnd(start: Point2D, rotationDeg: number, lengthFeet: number): Point2D {
  const radians = (rotationDeg * Math.PI) / 180;
  const lengthPx = feetToPixels(lengthFeet);
  return { x: start.x + Math.cos(radians) * lengthPx, y: start.y + Math.sin(radians) * lengthPx };
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function projectPointToLine(point: Point2D, lineStart: Point2D, lineEnd: Point2D): Point2D {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= EPSILON_PX * EPSILON_PX) {
    return point;
  }

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
  return {
    x: lineStart.x + dx * t,
    y: lineStart.y + dy * t,
  };
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}
