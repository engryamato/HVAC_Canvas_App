import type { Point2D } from './types';
import {
  bodyBounds,
  roundPoint,
  roundProfile,
  type FittingBodyPart,
  type FittingDimensions,
  type FittingGeometry,
  type FittingOpening,
  type FittingSegment,
} from './fittingGeometry';

/**
 * WS6e E5 — terminal boot / register collar geometry (the geometry half).
 *
 * A boot is the terminal transition from a duct to a register / diffuser /
 * grille face — distinct from the S-offset jog (which stays the `end_boot`
 * resolver, {@link buildOffset}) and from a dead-end {@link buildEndCap}. The
 * boot expands the duct profile out to a rectangular register face and adds a
 * flange plate at the open terminal end.
 *
 * Coordinate frame matches the other resolvers: local inches, centered, main run
 * on y = 0, INLET (the duct side) facing −x and OUTLET (the register face)
 * facing +x.
 *
 * This resolver is the boot primitive; the boot-vs-cap *decision* at a terminal
 * open end (a register/equipment is present → boot; otherwise → cap) is
 * insertion-pipeline logic consolidated into the E6 §9D recompute pipeline. It
 * mirrors how E1's compatibility bridge and E3's `buildTransitionIfNeeded` ship
 * the resolver in their phase and get wired into the pipeline in E6.
 */

const MIN_SIZE = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function bodyLength(primary: number): number {
  return clamp(primary * 4.2, 40, 140);
}

export function buildBootGeometry(dims: FittingDimensions): FittingGeometry {
  const inH = dims.inletSize;
  const roundInlet = dims.inletShape === 'round';

  // Register face: at least 1.5× the duct so the boot visibly flares to the
  // grille neck. Honor explicit rect dims when the project carries them.
  const faceH = Math.max(inH * 1.5, dims.rectHeight, MIN_SIZE);
  const faceW = Math.max(inH * 1.5, dims.rectWidth, MIN_SIZE);

  const len = bodyLength(Math.max(inH, faceH));
  const half = len / 2;
  const xIn = -half;
  const xFace = half;
  const inHalf = inH / 2;
  const faceHalf = faceH / 2;

  // Trapezoid flaring from the duct profile (left) to the register face (right).
  const outline: Point2D[] = [
    { x: xIn, y: -inHalf },
    { x: xFace, y: -faceHalf },
    { x: xFace, y: faceHalf },
    { x: xIn, y: inHalf },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [{ kind: 'polygon', points: outline, fill: true }];

  if (roundInlet) {
    // Top-view round footprint of the duct end (matches the rect→round convention).
    const r = inHalf;
    body.push({ kind: 'circle', center: roundPoint({ x: xIn + r, y: 0 }), radius: r, fill: true });
  }

  // Flange plate at the open register face (the mounting frame at the terminal).
  const accents: FittingSegment[] = [
    { from: roundPoint({ x: xFace, y: -faceHalf - 2 }), to: roundPoint({ x: xFace, y: faceHalf + 2 }) },
  ];

  const centerlines: FittingSegment[] = [
    { from: roundPoint({ x: xIn, y: 0 }), to: roundPoint({ x: xFace, y: 0 }) },
  ];

  const openings: FittingOpening[] = [
    {
      id: 'INLET',
      role: 'inlet',
      position: roundPoint({ x: xIn, y: 0 }),
      direction: { x: -1, y: 0 },
      profile:
        dims.inletShape === 'rectangular'
          ? { shape: 'rectangular', width: dims.rectWidth, height: dims.rectHeight }
          : roundProfile('round', inH),
    },
    {
      id: 'OUTLET',
      role: 'outlet',
      position: roundPoint({ x: xFace, y: 0 }),
      direction: { x: 1, y: 0 },
      profile: { shape: 'rectangular', width: faceW, height: faceH },
    },
  ];

  return {
    anchor: roundPoint({ x: 0, y: 0 }),
    body,
    centerlines,
    accents,
    openings,
    maskBounds: bodyBounds(body),
  };
}
