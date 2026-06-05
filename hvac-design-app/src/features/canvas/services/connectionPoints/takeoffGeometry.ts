import type { Point2D } from './types';
import {
  bodyBounds,
  normalize,
  roundPoint,
  roundProfile,
  type FittingBodyPart,
  type FittingDimensions,
  type FittingGeometry,
  type FittingOpening,
  type FittingSegment,
} from './fittingGeometry';

/**
 * WS6e E4 — body-junction takeoff geometry (the geometry half).
 *
 * A takeoff branches off a duct **body** (mid-span), not an endpoint. Unlike the
 * three-port tee/wye (which own the main run), a takeoff owns only the branch
 * stub and its footprint on the trunk it mounts to. The trunk is represented by
 * the local y = 0 axis; the single connectable opening is the BRANCH outlet
 * where the downstream branch duct lands. The tap face sits at the anchor on the
 * trunk centerline.
 *
 * Coordinate frame matches the other resolvers: local inches, origin at the tap
 * root on y = 0, branch rising toward −y (leaning toward +x as the entry angle
 * drops below 90°, mirroring the tee branch convention).
 *
 * Drives the five WS10 `variant.takeoffType` classes:
 *  - `straight_tap`  — flush square/round stub (90° entry).
 *  - `conical_tap`   — stub flaring out at the base.
 *  - `bellmouth`     — radiused flared throat into the trunk.
 *  - `spin_in`       — round spin-in collar on the trunk.
 *  - `saddle`        — saddle that wraps the trunk (curved on a round main).
 *
 * `entryAngle` leans the branch; `hasDamper` draws a balancing-blade accent.
 * The trunk footprint is shape-aware (round main → curved saddle wrap;
 * rectangular / flat-oval main → straight flange).
 */

const DEFAULT_ENTRY_ANGLE = 90;
const MIN_ENTRY_ANGLE = 30;
const MAX_ENTRY_ANGLE = 90;

const MAIN_AXIS: Point2D = { x: 1, y: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function bodyLength(primary: number): number {
  return clamp(primary * 4.2, 40, 140);
}

/** Half-width of the collar where the stub meets the trunk. */
function collarHalf(type: FittingDimensions['takeoffType'], branchH: number): number {
  switch (type) {
    case 'conical_tap':
      return branchH * 0.8;
    case 'bellmouth':
      return branchH * 0.95;
    default:
      // straight_tap, spin_in, saddle keep a flush stub base.
      return branchH / 2;
  }
}

export function buildTakeoffGeometry(dims: FittingDimensions): FittingGeometry {
  const mainH = dims.inletSize;
  const branchH = dims.branchSize;
  const type = dims.takeoffType;
  const roundMain = dims.inletShape === 'round';

  // Entry angle from the trunk: 90° = perpendicular stub; smaller leans toward
  // the +x outlet side. Reuses the tee branch parameterization.
  const theta = (clamp(dims.entryAngle || DEFAULT_ENTRY_ANGLE, MIN_ENTRY_ANGLE, MAX_ENTRY_ANGLE) * Math.PI) / 180;
  const d: Point2D = { x: Math.cos(theta), y: -Math.sin(theta) }; // branch axis (outward)
  const p: Point2D = { x: -d.y, y: d.x }; // branch cross-section axis

  const root: Point2D = { x: 0, y: 0 }; // tap center on the trunk body
  const stubLen = mainH / 2 + bodyLength(branchH) * 0.5;
  const tip: Point2D = { x: root.x + stubLen * d.x, y: root.y + stubLen * d.y };

  const baseHalf = collarHalf(type, branchH);
  const tipHalf = branchH / 2;

  // Stub: trapezoid from the collar base (2 * baseHalf) up to the branch face
  // (2 * tipHalf). For straight_tap base == face, so it reads as a plain stub.
  const stub: Point2D[] = [
    { x: root.x - baseHalf * p.x, y: root.y - baseHalf * p.y },
    { x: tip.x - tipHalf * p.x, y: tip.y - tipHalf * p.y },
    { x: tip.x + tipHalf * p.x, y: tip.y + tipHalf * p.y },
    { x: root.x + baseHalf * p.x, y: root.y + baseHalf * p.y },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [{ kind: 'polygon', points: stub, fill: true }];
  const accents: FittingSegment[] = [];

  if (type === 'spin_in') {
    // Round spin-in collar seated on the trunk.
    body.push({ kind: 'circle', center: roundPoint(root), radius: Math.max(baseHalf, branchH * 0.6), fill: true });
  }

  if (type === 'bellmouth') {
    // Radiused throat: quad flares sweeping from the stub base out onto the trunk.
    const flare = baseHalf * 1.4;
    body.push({
      kind: 'quad',
      from: roundPoint({ x: root.x - baseHalf * p.x, y: root.y - baseHalf * p.y }),
      control: roundPoint({ x: -flare, y: 0 }),
      to: roundPoint({ x: -flare, y: 0 }),
    });
    body.push({
      kind: 'quad',
      from: roundPoint({ x: root.x + baseHalf * p.x, y: root.y + baseHalf * p.y }),
      control: roundPoint({ x: flare, y: 0 }),
      to: roundPoint({ x: flare, y: 0 }),
    });
  }

  // Trunk footprint — shape-aware. A round main gets a curved saddle wrap; a
  // rectangular / flat-oval main gets a straight flange cut.
  if (type === 'saddle') {
    const fh = Math.max(baseHalf, branchH * 0.7);
    if (roundMain) {
      const dip = Math.min(mainH * 0.18, 6);
      accents.push({ from: roundPoint({ x: -fh * MAIN_AXIS.x, y: 0 }), to: roundPoint({ x: 0, y: dip }) });
      accents.push({ from: roundPoint({ x: 0, y: dip }), to: roundPoint({ x: fh * MAIN_AXIS.x, y: 0 }) });
    } else {
      accents.push({ from: roundPoint({ x: -fh, y: 0 }), to: roundPoint({ x: fh, y: 0 }) });
    }
  }

  if (dims.hasDamper) {
    // Balancing blade across the stub at mid-length.
    const mid: Point2D = { x: root.x + stubLen * 0.5 * d.x, y: root.y + stubLen * 0.5 * d.y };
    accents.push({
      from: roundPoint({ x: mid.x - tipHalf * p.x, y: mid.y - tipHalf * p.y }),
      to: roundPoint({ x: mid.x + tipHalf * p.x, y: mid.y + tipHalf * p.y }),
    });
  }

  const centerlines: FittingSegment[] = [
    { from: roundPoint(root), to: roundPoint(tip) },
  ];

  const openings: FittingOpening[] = [
    {
      id: 'BRANCH',
      role: 'branch',
      position: roundPoint(tip),
      direction: normalize(d),
      profile:
        dims.outletShape === 'rectangular'
          ? { shape: 'rectangular', width: dims.branchWidth, height: dims.branchHeight }
          : roundProfile('round', branchH),
    },
  ];

  return { anchor: roundPoint(root), body, centerlines, accents, openings, maskBounds: bodyBounds(body) };
}
