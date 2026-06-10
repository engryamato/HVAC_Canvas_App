import type { Fitting } from '@/core/schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import type { ConnectionProfile, Point2D } from './types';
import { buildTwoPortFittingGeometry } from './twoPortFittingGeometry';
import { buildElbowGeometry } from './elbowGeometry';
import { buildBranchFittingGeometry } from './branchFittingGeometry';
import { buildTakeoffGeometry } from './takeoffGeometry';

/**
 * Shared parametric fitting geometry (PR-8).
 *
 * `buildFittingGeometry` is the single source of truth for a fitting's drawn
 * body AND its magnetic connection points. The resolver derives snap ports from
 * `openings`, and the renderer draws `body` / `centerlines` / `accents` plus the
 * end-line + magnetic marker at every `opening`. Because both consume the same
 * builder output (a pure function of `fitting.props`), the drawn openings always
 * line up exactly with the resolved ports — ducts connect where the body opens.
 *
 * Coordinate frame: local, inches (= pixels at PIXELS_PER_INCH = 1), origin at
 * the fitting symbol center, main run on the y = 0 axis. World transforms
 * (position / rotation / scale) are applied by the resolver, never here.
 */

export type FittingPortRole = 'inlet' | 'outlet' | 'branch';

export interface FittingOpening {
  /** Stable id used as the connection-point id (INLET / OUTLET / BRANCH). */
  id: string;
  role: FittingPortRole;
  /** Opening center in local space — sits on the drawn end line. */
  position: Point2D;
  /** Outward unit facing direction in local space. */
  direction: Point2D;
  /** Opening cross-section (shape + size), drives the end-line length. */
  profile: ConnectionProfile;
}

export type FittingBodyPart =
  | { kind: 'polygon'; points: Point2D[]; fill?: boolean }
  | {
      kind: 'arcBand';
      center: Point2D;
      innerRadius: number;
      outerRadius: number;
      startAngle: number;
      endAngle: number;
    }
  | { kind: 'circle'; center: Point2D; radius: number; fill?: boolean }
  | { kind: 'quad'; from: Point2D; control: Point2D; to: Point2D };

export interface FittingSegment {
  from: Point2D;
  to: Point2D;
}

export interface FittingGeometry {
  /** Local point that must land on the authored duct centerline junction. */
  anchor: Point2D;
  /** Filled / stroked body parts (drawn first, under decorations). */
  body: FittingBodyPart[];
  /** Dashed blue centerlines. */
  centerlines: FittingSegment[];
  /** Extra solid strokes that are not openings (miter cut, cap plate, saddle). */
  accents: FittingSegment[];
  /** Single source of truth for ports + end lines + magnetic markers + cutback. */
  openings: FittingOpening[];
  /** Local AABB of the body — legacy overlap-mask fallback / occupied bounds. */
  maskBounds: { x: number; y: number; width: number; height: number };
}

const DEFAULT_SIZE = 12;
const MIN_SIZE = 4;
const DEFAULT_RADIUS_RATIO = 1.5;

export interface FittingDimensions {
  /** Inlet / main / common primary size (inches). */
  inletSize: number;
  /** Outlet / straight primary size (inches). */
  outletSize: number;
  /** Branch size for 3-port fittings (inches). */
  branchSize: number;
  branchWidth: number;
  branchHeight: number;
  inletShape: 'round' | 'rectangular';
  outletShape: 'round' | 'rectangular';
  /** Rect width/height for rect-to-round and rectangular ends. */
  rectWidth: number;
  rectHeight: number;
  /** Elbow centerline radius ratio (R/W). */
  radiusRatio: number;
  /** Straight neck length at openings (inches). */
  neckLength: number;
  /** Bend / branch angle (degrees). */
  angle: number;
  /** Eccentric reducer (one flat wall) vs concentric. */
  eccentric: boolean;
  /** Alignment for eccentric / rect-to-round transitions. */
  alignment: 'center_line' | 'flat_top' | 'flat_bottom';
  // WS6e E2 — variant-derived geometry detail (defaults reproduce pre-variant
  // geometry exactly, so old fittings with `variant === undefined` are unchanged).
  /** Smooth-radius vs sharp mitered elbow (overrides the elbow `fittingType`). */
  elbowKind: 'radius' | 'mitered';
  /** Turning-vane treatment drawn inside the elbow. */
  vaneType: 'none' | 'single_wall' | 'double_wall';
  /** Flat wall an eccentric reducer shares (`null` = concentric). */
  eccentricSide: 'top' | 'bottom' | null;
  /** Vertical alignment of a rect→round transition's round end. */
  transitionAlignment: 'centered' | 'top' | 'bottom';
  /** Transition seam style — `gored` adds gore seams. */
  transitionStyle: 'straight' | 'gored';
  /** Which side a 3-port branch leans toward (mirrors the branch in y). */
  branchSide: 'left' | 'right';
  // WS6e E4 — body-junction takeoff detail (defaults reproduce a plain straight
  // perpendicular tap; only the `takeoff` type reads these).
  /** Takeoff class drawn at a duct-body junction. */
  takeoffType: 'straight_tap' | 'conical_tap' | 'bellmouth' | 'spin_in' | 'saddle';
  /** Takeoff branch entry angle from the trunk run, degrees (90 = perpendicular). */
  entryAngle: number;
  /** Whether a balancing-damper blade is drawn in the takeoff branch. */
  hasDamper: boolean;
}

function clampSize(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(MIN_SIZE, value);
}

/**
 * Resolve a fitting's opening dimensions from its own props only (transition
 * data, angle, and the parametric schema fields) with documented fallbacks.
 *
 * Pure function of `fitting.props` — so the resolver (which only receives a
 * fitting) and the renderer build identical geometry. Connected-duct sizes are
 * persisted into `transitionData` at connection time, so this still reflects the
 * real connected sizes without needing the entity map here.
 */
const RADIUS_RATIO_BY_CLASS: Record<'R1.0' | 'R1.5' | 'R2.0', number> = {
  'R1.0': 1.0,
  'R1.5': 1.5,
  'R2.0': 2.0,
};

/** Resolve the eccentric reducer's shared flat wall (null = concentric). */
function resolveEccentricSide(
  type: FittingType,
  offset: 'top' | 'bottom' | 'left' | 'right' | undefined
): 'top' | 'bottom' | null {
  if (offset) {
    // The reducer body offsets perpendicular to flow (local y); lateral
    // left/right offsets are not modeled in E2 and fold onto the bottom wall.
    return offset === 'top' ? 'top' : 'bottom';
  }
  return type === 'reducer_eccentric' ? 'bottom' : null;
}

/** Map the variant transition alignment (and legacy transitionData) to the vertical axis. */
function resolveTransitionAlignment(
  variantAlignment: 'centered' | 'top' | 'bottom' | 'left' | 'right' | undefined,
  legacy: 'center_line' | 'flat_top' | 'flat_bottom' | undefined
): 'centered' | 'top' | 'bottom' {
  if (variantAlignment) {
    if (variantAlignment === 'top') { return 'top'; }
    if (variantAlignment === 'bottom') { return 'bottom'; }
    return 'centered'; // centered / left / right (lateral not modeled in E2)
  }
  if (legacy === 'flat_top') { return 'top'; }
  if (legacy === 'flat_bottom') { return 'bottom'; }
  return 'centered';
}

export function resolveFittingDimensions(fitting: Fitting): FittingDimensions {
  const props = fitting.props;
  const transition = props.transitionData;
  const variant = props.variant;

  const inletShape = transition?.fromShape ?? 'round';
  const outletShape = transition?.toShape ?? 'round';

  const inletSize = clampSize(
    transition?.fromDiameter ?? transition?.fromWidth,
    DEFAULT_SIZE
  );
  const outletSize = clampSize(
    transition?.toDiameter ?? transition?.toWidth,
    Math.max(MIN_SIZE, inletSize * 0.8)
  );
  const branchSize = clampSize(
    transition?.toDiameter,
    Math.max(MIN_SIZE, inletSize * 0.5)
  );

  const rectWidth = clampSize(transition?.fromWidth ?? transition?.toWidth, inletSize);
  const rectHeight = clampSize(transition?.fromHeight ?? transition?.toHeight, Math.max(MIN_SIZE, inletSize * 0.7));

  // WS6e E2: variant.radiusClass overrides the raw radiusRatio when present.
  const radiusFromClass = variant?.radiusClass ? RADIUS_RATIO_BY_CLASS[variant.radiusClass] : undefined;
  const rawRadiusRatio = radiusFromClass ?? props.radiusRatio;
  const radiusRatio =
    rawRadiusRatio !== undefined && Number.isFinite(rawRadiusRatio)
      ? Math.max(0.5, Math.min(3, rawRadiusRatio))
      : DEFAULT_RADIUS_RATIO;

  const neckLength = props.neckLength !== undefined && props.neckLength >= 0 ? props.neckLength : 0;

  // WS6e E2: variant.branchAngleDeg (3-port branch angle) overrides the legacy
  // props.angle; only branch fittings carry it, so this is safe for elbows.
  const angle = variant?.branchAngleDeg ?? props.angle ?? defaultAngleFor(props.fittingType);

  const eccentricSide = resolveEccentricSide(props.fittingType, variant?.eccentricOffset);

  return {
    inletSize,
    outletSize,
    branchSize,
    branchWidth: clampSize(transition?.toWidth, branchSize),
    branchHeight: clampSize(transition?.toHeight, branchSize),
    inletShape,
    outletShape,
    rectWidth,
    rectHeight,
    radiusRatio,
    neckLength,
    angle,
    eccentric: eccentricSide !== null,
    alignment: transition?.alignment ?? (eccentricSide === 'top' ? 'flat_top' : eccentricSide === 'bottom' ? 'flat_bottom' : 'center_line'),
    elbowKind: variant?.elbowType ?? (props.fittingType === 'elbow_mitered' ? 'mitered' : 'radius'),
    vaneType: variant?.vaneType ?? 'none',
    eccentricSide,
    transitionAlignment: resolveTransitionAlignment(variant?.transitionAlignment, transition?.alignment),
    transitionStyle: variant?.transitionStyle ?? 'straight',
    branchSide: variant?.branchSide ?? 'right',
    takeoffType: variant?.takeoffType ?? 'straight_tap',
    entryAngle:
      variant?.entryAngleDeg !== undefined && Number.isFinite(variant.entryAngleDeg)
        ? variant.entryAngleDeg
        : 90,
    hasDamper: variant?.hasDamper ?? false,
  };
}

function defaultAngleFor(type: FittingType): number {
  switch (type) {
    case 'elbow_45':
      return 45;
    case 'wye':
      return 45;
    case 'elbow_90':
    case 'elbow_mitered':
    case 'tee':
    default:
      return 90;
  }
}

/**
 * Build the local-space geometry for any fitting type. Dispatches to the
 * per-family builder; every branch returns the same `FittingGeometry` contract.
 */
export function buildFittingGeometry(fitting: Fitting): FittingGeometry {
  const dims = resolveFittingDimensions(fitting);
  const type = fitting.props.fittingType;

  switch (type) {
    case 'elbow_90':
    case 'elbow_45':
    case 'elbow_mitered':
      return buildElbowGeometry(type, dims);
    case 'tee':
    case 'wye':
      return buildBranchFittingGeometry(type, dims);
    case 'takeoff':
      return buildTakeoffGeometry(dims);
    default:
      return buildTwoPortFittingGeometry(type, dims);
  }
}

// ---------------------------------------------------------------------------
// Shared geometry helpers (exported for the family builders).
// ---------------------------------------------------------------------------

export function round(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function roundPoint(point: Point2D): Point2D {
  return { x: round(point.x), y: round(point.y) };
}

export function normalize(vector: Point2D): Point2D {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: round(vector.x / length), y: round(vector.y / length) };
}

export function roundProfile(shape: 'round' | 'rectangular', size: number, height?: number): ConnectionProfile {
  if (shape === 'rectangular') {
    return { shape: 'rectangular', width: size, height: height ?? size };
  }
  return { shape: 'round', diameter: size };
}

/** Axis-aligned bounding box over a set of local points. */
export function boundsOf(points: Point2D[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    x: round(minX),
    y: round(minY),
    width: round(maxX - minX),
    height: round(maxY - minY),
  };
}

/** Collect all polygon/circle vertices from body parts for mask bounds. */
export function bodyBounds(parts: FittingBodyPart[]): { x: number; y: number; width: number; height: number } {
  const points: Point2D[] = [];
  for (const part of parts) {
    if (part.kind === 'polygon') {
      points.push(...part.points);
    } else if (part.kind === 'circle') {
      points.push(
        { x: part.center.x - part.radius, y: part.center.y - part.radius },
        { x: part.center.x + part.radius, y: part.center.y + part.radius }
      );
    } else if (part.kind === 'arcBand') {
      points.push(
        { x: part.center.x - part.outerRadius, y: part.center.y - part.outerRadius },
        { x: part.center.x + part.outerRadius, y: part.center.y + part.outerRadius }
      );
    } else if (part.kind === 'quad') {
      points.push(part.from, part.control, part.to);
    }
  }
  return boundsOf(points);
}
