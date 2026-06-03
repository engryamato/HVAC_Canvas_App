import {
  shapeCompatibility,
  type ShapeCompatibilityResult,
} from '@/core/services/connectionPoints/shapeCompatibility';
import type { DuctRunShape } from '@/core/schema/duct-run.schema';
import type { ConnectionProfile } from './types';

/**
 * WS6e E1 — §9D compatibility enforcement bridge.
 *
 * Given two {@link ConnectionProfile}s (the formalized resolver cross-section
 * contract), report WHAT FITTING CLASS is needed to connect them, by delegating
 * to the WS10 {@link shapeCompatibility} matrix. Per D9 this NEVER blocks a
 * connection — the worst case is an auto-inserted transition. Downstream phases
 * (E3 transitions, E2 reducers) consume `resolution` to decide which geometry to
 * emit; E6 wraps the result in the §9D recompute pipeline.
 */
export interface ConnectionCompatibility {
  /** `direct` (no adapter), `reducer` (same shape, different size), or `transition` (cross-shape). */
  resolution: ShapeCompatibilityResult;
  /** True unless the two profiles can connect directly (i.e. an adapter fitting is required). */
  requiresAdapter: boolean;
}

const SIZE_TOLERANCE_IN = 0.05;

function toDuctShape(shape: ConnectionProfile['shape']): DuctRunShape | null {
  return shape === 'unknown' ? null : shape;
}

function isRoundLike(shape: ConnectionProfile['shape']): boolean {
  return shape === 'round' || shape === 'flexible';
}

function close(a: number | undefined, b: number | undefined): boolean {
  return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= SIZE_TOLERANCE_IN;
}

/**
 * Whether two same-gating-shape profiles share a cross-section size. Round/flexible
 * compare by diameter (falling back to equivalent diameter); rectangular/flat_oval
 * compare by both width and height. Unknown/missing sizes are treated as unequal so
 * the caller falls back to a `reducer` rather than asserting `direct`.
 */
function profilesSameSize(a: ConnectionProfile, b: ConnectionProfile): boolean {
  if (isRoundLike(a.shape) && isRoundLike(b.shape)) {
    return close(a.diameter ?? a.equivalentDiameter, b.diameter ?? b.equivalentDiameter);
  }
  return close(a.width, b.width) && close(a.height, b.height);
}

/**
 * Resolve the §9D fitting class required to connect profile `a` to profile `b`.
 * Returns `transition` (never blocks, per D9) when either shape is `unknown`.
 */
export function resolveConnectionCompatibility(
  a: ConnectionProfile,
  b: ConnectionProfile
): ConnectionCompatibility {
  const shapeA = toDuctShape(a.shape);
  const shapeB = toDuctShape(b.shape);

  if (!shapeA || !shapeB) {
    return { resolution: 'transition', requiresAdapter: true };
  }

  const resolution = shapeCompatibility(shapeA, shapeB, profilesSameSize(a, b));
  return { resolution, requiresAdapter: resolution !== 'direct' };
}

/** Convenience predicate: true when the two profiles connect with no adapter fitting. */
export function isDirectlyConnectable(a: ConnectionProfile, b: ConnectionProfile): boolean {
  return resolveConnectionCompatibility(a, b).resolution === 'direct';
}
