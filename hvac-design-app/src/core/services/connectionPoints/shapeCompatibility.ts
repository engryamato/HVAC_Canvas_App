import type { DuctRunShape } from '@/core/schema/duct-run.schema';

/**
 * WS10 — Shape compatibility matrix (policy half; D9).
 *
 * Pure, behavior-free lookup over DuctRunShape × DuctRunShape that tells the
 * caller WHAT FITTING CLASS a shape/size change requires. It never produces
 * geometry (that is WS6) and it NEVER blocks a change (D9): the worst case is an
 * auto-inserted transition.
 *
 * Rules:
 * - `flexible` is treated as `round` for gating purposes.
 * - same shape, same size      → `direct`     (no fitting needed)
 * - same shape, different size → `reducer`
 * - any cross-shape            → `transition` (regardless of size)
 *
 * Consumed by CAS shape-change (WS3) and the Axial menu (WS4).
 */
export type ShapeCompatibilityResult = 'direct' | 'reducer' | 'transition';

/** Collapse `flexible` onto `round` for compatibility gating. */
function gatingShape(shape: DuctRunShape): Exclude<DuctRunShape, 'flexible'> {
  return shape === 'flexible' ? 'round' : shape;
}

/**
 * Resolve the fitting class required to connect a run of shape `from` to a run
 * of shape `to`.
 *
 * @param from      source duct shape
 * @param to        target duct shape
 * @param sizeEqual whether the two runs have the same cross-section size
 */
export function shapeCompatibility(
  from: DuctRunShape,
  to: DuctRunShape,
  sizeEqual: boolean
): ShapeCompatibilityResult {
  const a = gatingShape(from);
  const b = gatingShape(to);

  if (a !== b) {
    return 'transition';
  }

  return sizeEqual ? 'direct' : 'reducer';
}
