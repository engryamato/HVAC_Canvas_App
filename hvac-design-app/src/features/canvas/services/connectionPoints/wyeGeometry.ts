import type { Point2D } from './types';

/**
 * Shared parametric geometry for the SD5-2 conical wye (diverging, branch
 * tapered into the body).
 *
 * This is the single source of truth (PR-7) for the wye's body outline AND its
 * three connection points: the resolver derives snap ports from it and the
 * renderer draws the body + straight end lines from it, so ports always sit
 * exactly on the drawn openings.
 *
 * Coordinate frame: inches (= pixels at PIXELS_PER_INCH = 1), main run on the
 * y = 0 axis, centered horizontally on the main run so the fitting origin stays
 * on the main centerline like every other fitting symbol.
 *
 * Formula mirrors the SD5-2 reference preview
 * (sizewise_round_wye_magnetic_preview.html). Only `Db ≤ Dc` style sanity is
 * assumed; the math is purely parametric in the three diameters.
 */

export type WyePortRole = 'inlet' | 'outlet' | 'branch';

export interface WyePortGeometry {
  id: string;
  role: WyePortRole;
  /** Local position (centered frame), on the drawn opening center. */
  position: Point2D;
  /** Outward unit facing direction in local space. */
  direction: Point2D;
  /** Opening diameter (inches). */
  diameter: number;
}

export interface WyeGeometry {
  /** Main-run body polygon (common → reducer → straight), 8 points. */
  outline: Point2D[];
  /** Branch cone polygon [Tb1, W1, W2, Tb2]. */
  cone: Point2D[];
  /** Dashed centerlines (main run + branch). */
  centerlines: { from: Point2D; to: Point2D }[];
  /** Resolved connection points (inlet, outlet, branch). */
  ports: WyePortGeometry[];
}

const BRANCH_TAPER_ANGLE = (13 * Math.PI) / 180;
const DEFAULT_WYE_BRANCH_ANGLE = 45;
const MIN_WYE_BRANCH_ANGLE = 15;
const MAX_WYE_BRANCH_ANGLE = 75;

/**
 * @param branchAngleDeg Angle of the branch relative to the main run (degrees),
 *   detected from the duct centerlines. Defaults to 45° (the SD5-2 reference),
 *   which reproduces the original geometry exactly. Clamped to a fabricable band.
 */
export function buildWyeGeometry(
  commonDiameter: number,
  straightDiameter: number,
  branchDiameter: number,
  branchAngleDeg: number = DEFAULT_WYE_BRANCH_ANGLE
): WyeGeometry {
  const Dc = commonDiameter;
  const Ds = straightDiameter;
  const Db = branchDiameter;

  const theta =
    (Math.min(MAX_WYE_BRANCH_ANGLE, Math.max(MIN_WYE_BRANCH_ANGLE, branchAngleDeg)) * Math.PI) / 180;

  // Longitudinal stations along the main run (origin at common inlet).
  const xR0 = 2.2 * Dc; // straight common length before the reducer
  const xR1 = xR0 + 0.9 * Dc; // reducer end
  const xEnd = xR1 + 1.8 * Ds; // straight outlet end

  // Branch geometry (leans toward the outlet by `theta`), tapering into the top wall.
  const d: Point2D = { x: Math.cos(theta), y: -Math.sin(theta) }; // branch axis (outward)
  const p: Point2D = { x: -d.y, y: d.x }; // branch cross-section axis (d rotated +90°)
  const topWallY = -Dc / 2;
  const xJw = 1.25 * Dc;
  const Lb = 1.95 * Db;
  const Jw: Point2D = { x: xJw, y: topWallY };
  const Tc: Point2D = { x: Jw.x + Lb * d.x, y: Jw.y + Lb * d.y };
  const Tb1: Point2D = { x: Tc.x + (Db / 2) * p.x, y: Tc.y + (Db / 2) * p.y };
  const Tb2: Point2D = { x: Tc.x - (Db / 2) * p.x, y: Tc.y - (Db / 2) * p.y };
  const Lap = Db / 2 / Math.tan(BRANCH_TAPER_ANGLE);
  const A: Point2D = { x: Tc.x + Lap * d.x, y: Tc.y + Lap * d.y };
  const W1 = intersectAtY(A, Tb1, topWallY);
  const W2 = intersectAtY(A, Tb2, topWallY);

  // Center the main run horizontally; keep the main axis on y = 0.
  const cx = xEnd / 2;
  const shift = (point: Point2D): Point2D => ({ x: round(point.x - cx), y: round(point.y) });

  const outline = [
    { x: 0, y: -Dc / 2 },
    { x: xR0, y: -Dc / 2 },
    { x: xR1, y: -Ds / 2 },
    { x: xEnd, y: -Ds / 2 },
    { x: xEnd, y: Ds / 2 },
    { x: xR1, y: Ds / 2 },
    { x: xR0, y: Dc / 2 },
    { x: 0, y: Dc / 2 },
  ].map(shift);

  const cone = [Tb1, W1, W2, Tb2].map(shift);

  const centerlines = [
    { from: shift({ x: 0, y: 0 }), to: shift({ x: xEnd, y: 0 }) },
    { from: shift(Jw), to: shift({ x: Tc.x + 0.4 * Db * d.x, y: Tc.y + 0.4 * Db * d.y }) },
  ];

  const ports: WyePortGeometry[] = [
    { id: 'INLET', role: 'inlet', position: shift({ x: 0, y: 0 }), direction: { x: -1, y: 0 }, diameter: Dc },
    { id: 'OUTLET', role: 'outlet', position: shift({ x: xEnd, y: 0 }), direction: { x: 1, y: 0 }, diameter: Ds },
    { id: 'BRANCH', role: 'branch', position: shift(Tc), direction: { x: d.x, y: d.y }, diameter: Db },
  ];

  return { outline, cone, centerlines, ports };
}

/** Intersect the segment P0→P1 with the horizontal line y = yTarget. */
function intersectAtY(p0: Point2D, p1: Point2D, yTarget: number): Point2D {
  const denom = p1.y - p0.y;
  const t = denom === 0 ? 0 : (yTarget - p0.y) / denom;
  return { x: p0.x + t * (p1.x - p0.x), y: yTarget };
}

function round(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
