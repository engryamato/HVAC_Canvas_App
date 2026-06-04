import type { ConnectionProfile, Point2D } from './types';
import {
  bodyBounds,
  roundPoint,
  type FittingBodyPart,
  type FittingGeometry,
  type FittingOpening,
  type FittingSegment,
} from './fittingGeometry';
import { resolveConnectionCompatibility } from './connectionCompatibility';

/**
 * WS6e E3 — per-shape-pair transition geometry (WS10's deferred geometry half).
 *
 * Builds the local-space geometry for a cross-shape adapter fitting between any
 * two {@link ConnectionProfile}s: rect↔round, rect↔flat_oval, round↔flat_oval
 * (and every reverse). `flexible` is normalized to `round` (per §9D / the WS10
 * matrix), so a flexible end resolves identically to a round one.
 *
 * Unlike the legacy `transition_square_to_round` path in
 * {@link buildTwoPortFittingGeometry} (a single FittingType for one direction),
 * this resolver is profile-driven: it produces **resolved ports for both
 * profiles** (INLET = `from`, OUTLET = `to`) so the §9D recompute pipeline (E6)
 * and developed-area readout (WS6a-A2) can consume the adapter for any pair.
 *
 * Coordinate frame matches the other resolvers: local inches, centered, main run
 * on y = 0, INLET facing −x and OUTLET facing +x.
 */

const DEFAULT_SIZE = 12;
const MIN_SIZE = 4;

/** How each end face is drawn in the run-axis top view. */
type FaceKind = 'flat' | 'round';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function bodyLength(primary: number): number {
  return clamp(primary * 4.2, 40, 140);
}

function size(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(MIN_SIZE, value);
}

/**
 * Normalize a port profile for transition resolution: `flexible` collapses onto
 * `round` (keeping its size), matching the WS10 gating rule. Other shapes pass
 * through unchanged. `unknown` falls back to a round default so the resolver
 * never throws (D9 — a transition never blocks a connection).
 */
export function normalizeTransitionProfile(profile: ConnectionProfile): ConnectionProfile {
  switch (profile.shape) {
    case 'flexible':
      return {
        shape: 'round',
        diameter: size(profile.diameter ?? profile.equivalentDiameter, DEFAULT_SIZE),
      };
    case 'unknown':
      return { shape: 'round', diameter: size(profile.diameter ?? profile.equivalentDiameter, DEFAULT_SIZE) };
    default:
      return profile;
  }
}

function faceKind(profile: ConnectionProfile): FaceKind {
  return profile.shape === 'round' ? 'round' : 'flat';
}

/** Perpendicular-to-flow half extent of a face (local y), in inches. */
function faceHalfHeight(profile: ConnectionProfile): number {
  if (profile.shape === 'round') {
    return size(profile.diameter ?? profile.equivalentDiameter, DEFAULT_SIZE) / 2;
  }
  // rectangular / flat_oval: minor axis (height) drives the perpendicular extent.
  return size(profile.height ?? profile.width, DEFAULT_SIZE) / 2;
}

/** Representative size used only to scale the body length. */
function faceMajor(profile: ConnectionProfile): number {
  if (profile.shape === 'round') {
    return size(profile.diameter ?? profile.equivalentDiameter, DEFAULT_SIZE);
  }
  return Math.max(size(profile.width, DEFAULT_SIZE), size(profile.height, DEFAULT_SIZE));
}

/**
 * Build local-space transition geometry between two cross-section profiles. The
 * body is a trapezoid blending the two faces; round faces add a circle (the
 * top-view footprint of a round duct), flat_oval faces add rounded end-cap
 * accents to distinguish them from a sharp rectangle.
 */
export function buildTransitionGeometry(
  fromProfile: ConnectionProfile,
  toProfile: ConnectionProfile
): FittingGeometry {
  const from = normalizeTransitionProfile(fromProfile);
  const to = normalizeTransitionProfile(toProfile);

  const fromHalf = faceHalfHeight(from);
  const toHalf = faceHalfHeight(to);
  const len = bodyLength(Math.max(faceMajor(from), faceMajor(to)));
  const half = len / 2;
  const xFrom = -half;
  const xTo = half;

  // Trapezoid body blending the two faces (centered on y = 0).
  const trapezoid: Point2D[] = [
    { x: xFrom, y: -fromHalf },
    { x: xTo, y: -toHalf },
    { x: xTo, y: toHalf },
    { x: xFrom, y: fromHalf },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [{ kind: 'polygon', points: trapezoid, fill: true }];
  const accents: FittingSegment[] = [];

  appendFaceDecoration(body, accents, from, faceKind(from), xFrom, fromHalf, 'from');
  appendFaceDecoration(body, accents, to, faceKind(to), xTo, toHalf, 'to');

  const centerlines: FittingSegment[] = [
    { from: roundPoint({ x: xFrom, y: 0 }), to: roundPoint({ x: xTo, y: 0 }) },
  ];

  const openings: FittingOpening[] = [
    {
      id: 'INLET',
      role: 'inlet',
      position: roundPoint({ x: xFrom, y: 0 }),
      direction: { x: -1, y: 0 },
      profile: from,
    },
    {
      id: 'OUTLET',
      role: 'outlet',
      position: roundPoint({ x: xTo, y: 0 }),
      direction: { x: 1, y: 0 },
      profile: to,
    },
  ];

  return {
    anchor: { x: 0, y: 0 },
    body,
    centerlines,
    accents,
    openings,
    maskBounds: bodyBounds(body),
  };
}

/**
 * Add the per-face decoration: a circle for a round footprint, rounded end-cap
 * curves for a flat_oval. A sharp rectangular face needs nothing — the trapezoid
 * edge already draws it.
 */
function appendFaceDecoration(
  body: FittingBodyPart[],
  accents: FittingSegment[],
  profile: ConnectionProfile,
  kind: FaceKind,
  xFace: number,
  halfHeight: number,
  side: 'from' | 'to'
): void {
  if (kind === 'round') {
    const r = halfHeight;
    // Inset the circle so its outer edge sits on the end face (matches the
    // legacy rect→round top-view convention).
    const cx = side === 'from' ? xFace + r : xFace - r;
    body.push({ kind: 'circle', center: roundPoint({ x: cx, y: 0 }), radius: r, fill: true });
    return;
  }

  if (profile.shape === 'flat_oval') {
    // Rounded corners at the flat-oval face — quad caps top & bottom that bulge
    // slightly along the run to read as an oval rather than a square edge.
    const bulge = Math.min(halfHeight * 0.6, 8) * (side === 'from' ? 1 : -1);
    accents.push({
      from: roundPoint({ x: xFace, y: -halfHeight }),
      to: roundPoint({ x: xFace + bulge, y: 0 }),
    });
    accents.push({
      from: roundPoint({ x: xFace + bulge, y: 0 }),
      to: roundPoint({ x: xFace, y: halfHeight }),
    });
  }
}

/**
 * §9D-gated entry point: build transition geometry only when the two profiles
 * actually require a cross-shape adapter. Returns `null` for `direct` (no
 * adapter) and `reducer` (same shape — handled by the reducer resolver) so
 * callers can fall through to the existing same-shape paths.
 *
 * This is the consumption hook for E6's recompute pipeline: when
 * {@link shapeCompatibility} resolves to `transition`, emit this geometry.
 */
export function buildTransitionIfNeeded(
  fromProfile: ConnectionProfile,
  toProfile: ConnectionProfile
): FittingGeometry | null {
  const { resolution } = resolveConnectionCompatibility(fromProfile, toProfile);
  if (resolution !== 'transition') {
    return null;
  }
  return buildTransitionGeometry(fromProfile, toProfile);
}
