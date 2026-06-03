import type { FittingType } from '@/core/schema/fitting.schema';
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
 * Two-port fitting family: reducers (concentric / tapered / eccentric),
 * rect-to-round transition, end cap (1 port), and the S-offset boot.
 *
 * All geometry is local, centered, with the main run on y = 0. Openings are the
 * single source of truth shared with the resolver and the renderer end lines.
 */
export function buildTwoPortFittingGeometry(type: FittingType, dims: FittingDimensions): FittingGeometry {
  switch (type) {
    case 'transition_square_to_round':
      return buildRectToRound(dims);
    case 'cap':
      return buildEndCap(dims);
    case 'end_boot':
      return buildOffset(dims);
    case 'reducer_eccentric':
    case 'reducer':
    case 'reducer_tapered':
    default:
      // WS6e E2: eccentricity (and which wall) now comes from dims.eccentricSide,
      // which folds in both the legacy reducer_eccentric type and variant.eccentricOffset.
      return buildReducer(dims);
  }
}

function bodyLength(primary: number): number {
  return clamp(primary * 4.2, 40, 140);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildReducer(dims: FittingDimensions): FittingGeometry {
  const inH = dims.inletSize;
  const outH = dims.outletSize;
  const len = bodyLength(Math.max(inH, outH));
  const half = len / 2;
  const neck = Math.min(dims.neckLength, half * 0.45);
  const xIn = -half;
  const xInNeck = -half + neck;
  const xOutNeck = half - neck;
  const xOut = half;

  // Concentric: openings centered on y=0. Eccentric: share one flat wall
  // (bottom or top per dims.eccentricSide); the smaller opening's center is
  // pulled toward that wall.
  const side = dims.eccentricSide;
  const inTop = side === 'bottom' ? inH / 2 - inH : side === 'top' ? -inH / 2 : -inH / 2;
  const inBot = side === 'bottom' ? inH / 2 : side === 'top' ? -inH / 2 + inH : inH / 2;
  const outTop = side === 'bottom' ? inH / 2 - outH : side === 'top' ? -inH / 2 : -outH / 2;
  const outBot = side === 'bottom' ? inH / 2 : side === 'top' ? -inH / 2 + outH : outH / 2;
  const inletCenterY = (inTop + inBot) / 2;
  const outletCenterY = (outTop + outBot) / 2;

  const outline: Point2D[] = [
    { x: xIn, y: inTop },
    { x: xInNeck, y: inTop },
    { x: xOutNeck, y: outTop },
    { x: xOut, y: outTop },
    { x: xOut, y: outBot },
    { x: xOutNeck, y: outBot },
    { x: xInNeck, y: inBot },
    { x: xIn, y: inBot },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [{ kind: 'polygon', points: outline, fill: true }];
  const centerlines: FittingSegment[] = [
    { from: { x: xIn, y: inletCenterY }, to: { x: xOut, y: outletCenterY } },
  ].map(roundSegment);

  const openings: FittingOpening[] = [
    {
      id: 'INLET',
      role: 'inlet',
      position: roundPoint({ x: xIn, y: inletCenterY }),
      direction: { x: -1, y: 0 },
      profile: roundProfile(dims.inletShape, inH),
    },
    {
      id: 'OUTLET',
      role: 'outlet',
      position: roundPoint({ x: xOut, y: outletCenterY }),
      direction: { x: 1, y: 0 },
      profile: roundProfile(dims.outletShape, outH),
    },
  ];

  return { anchor: midpoint(openings), body, centerlines, accents: [], openings, maskBounds: bodyBounds(body) };
}

function buildRectToRound(dims: FittingDimensions): FittingGeometry {
  const rectH = dims.rectHeight;
  const roundD = dims.outletSize;
  const len = bodyLength(Math.max(rectH, dims.rectWidth, roundD));
  const half = len / 2;
  const rectRight = -half + Math.max(len * 0.42, dims.rectWidth);
  const roundCx = half - roundD / 2;
  const r = roundD / 2;

  // WS6e E2: vertical alignment of the round end. `top`/`bottom` flush the round
  // wall to the matching rect wall; `centered` keeps it on the axis (default).
  const roundCy =
    dims.transitionAlignment === 'top'
      ? -rectH / 2 + r
      : dims.transitionAlignment === 'bottom'
        ? rectH / 2 - r
        : 0;

  const rect: Point2D[] = [
    { x: -half, y: -rectH / 2 },
    { x: rectRight, y: -rectH / 2 },
    { x: rectRight, y: rectH / 2 },
    { x: -half, y: rectH / 2 },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [
    { kind: 'polygon', points: rect, fill: true },
    { kind: 'circle', center: roundPoint({ x: roundCx, y: roundCy }), radius: r, fill: true },
    // Transition walls (open strokes) from rect corners to the round end.
    { kind: 'quad', from: roundPoint({ x: rectRight, y: -rectH / 2 }), control: roundPoint({ x: (rectRight + roundCx) / 2, y: -rectH / 2 }), to: roundPoint({ x: roundCx - r * 0.7, y: roundCy - r }) },
    { kind: 'quad', from: roundPoint({ x: rectRight, y: rectH / 2 }), control: roundPoint({ x: (rectRight + roundCx) / 2, y: rectH / 2 }), to: roundPoint({ x: roundCx - r * 0.7, y: roundCy + r }) },
  ];

  // WS6e E2: gored transition seams — straight gore lines from the rect corners
  // fanning to the round face. `straight` style leaves the body un-seamed.
  const accents: FittingSegment[] =
    dims.transitionStyle === 'gored'
      ? [
          { from: roundPoint({ x: rectRight, y: -rectH / 2 }), to: roundPoint({ x: roundCx, y: roundCy - r }) },
          { from: roundPoint({ x: rectRight, y: 0 }), to: roundPoint({ x: roundCx, y: roundCy }) },
          { from: roundPoint({ x: rectRight, y: rectH / 2 }), to: roundPoint({ x: roundCx, y: roundCy + r }) },
        ]
      : [];

  const centerlines: FittingSegment[] = [
    { from: { x: -half, y: 0 }, to: { x: half, y: roundCy } },
  ].map(roundSegment);

  const openings: FittingOpening[] = [
    {
      id: 'INLET',
      role: 'inlet',
      position: roundPoint({ x: -half, y: 0 }),
      direction: { x: -1, y: 0 },
      profile: { shape: 'rectangular', width: dims.rectWidth, height: rectH },
    },
    {
      id: 'OUTLET',
      role: 'outlet',
      position: roundPoint({ x: half, y: roundCy }),
      direction: { x: 1, y: 0 },
      profile: { shape: 'round', diameter: roundD },
    },
  ];

  return { anchor: midpoint(openings), body, centerlines, accents, openings, maskBounds: bodyBounds(body) };
}

function buildEndCap(dims: FittingDimensions): FittingGeometry {
  const h = dims.inletSize;
  const len = bodyLength(h) * 0.7;
  const xIn = -len / 2;
  const xCap = len / 2;

  const rect: Point2D[] = [
    { x: xIn, y: -h / 2 },
    { x: xCap, y: -h / 2 },
    { x: xCap, y: h / 2 },
    { x: xIn, y: h / 2 },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [{ kind: 'polygon', points: rect, fill: true }];
  // Thick cap plate at the closed end.
  const accents: FittingSegment[] = [
    { from: roundPoint({ x: xCap, y: -h / 2 - 2 }), to: roundPoint({ x: xCap, y: h / 2 + 2 }) },
  ];
  const centerlines: FittingSegment[] = [
    { from: roundPoint({ x: xIn, y: 0 }), to: roundPoint({ x: xCap, y: 0 }) },
  ];

  const openings: FittingOpening[] = [
    {
      id: 'INLET',
      role: 'inlet',
      position: roundPoint({ x: xIn, y: 0 }),
      direction: { x: -1, y: 0 },
      profile: roundProfile(dims.inletShape, h),
    },
  ];

  return { anchor: openings[0]?.position ?? { x: 0, y: 0 }, body, centerlines, accents, openings, maskBounds: bodyBounds(body) };
}

function buildOffset(dims: FittingDimensions): FittingGeometry {
  const h = dims.inletSize;
  const len = bodyLength(h) * 1.4;
  const half = len / 2;
  const offset = Math.max(h * 0.8, 10);
  const cy1 = offset / 2; // inlet side (lower)
  const cy2 = -offset / 2; // outlet side (upper)
  const mxL = -len * 0.12;
  const mxR = len * 0.12;

  const outline: Point2D[] = [
    { x: -half, y: cy1 - h / 2 },
    { x: mxL, y: cy1 - h / 2 },
    { x: mxR, y: cy2 - h / 2 },
    { x: half, y: cy2 - h / 2 },
    { x: half, y: cy2 + h / 2 },
    { x: mxR, y: cy2 + h / 2 },
    { x: mxL, y: cy1 + h / 2 },
    { x: -half, y: cy1 + h / 2 },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [{ kind: 'polygon', points: outline, fill: true }];
  const centerlines: FittingSegment[] = [
    { from: { x: -half, y: cy1 }, to: { x: mxL, y: cy1 } },
    { from: { x: mxL, y: cy1 }, to: { x: mxR, y: cy2 } },
    { from: { x: mxR, y: cy2 }, to: { x: half, y: cy2 } },
  ].map(roundSegment);

  const openings: FittingOpening[] = [
    {
      id: 'INLET',
      role: 'inlet',
      position: roundPoint({ x: -half, y: cy1 }),
      direction: { x: -1, y: 0 },
      profile: roundProfile(dims.inletShape, h),
    },
    {
      id: 'OUTLET',
      role: 'outlet',
      position: roundPoint({ x: half, y: cy2 }),
      direction: { x: 1, y: 0 },
      profile: roundProfile(dims.outletShape, h),
    },
  ];

  return { anchor: midpoint(openings), body, centerlines, accents: [], openings, maskBounds: bodyBounds(body) };
}

function roundSegment(segment: FittingSegment): FittingSegment {
  return { from: roundPoint(segment.from), to: roundPoint(segment.to) };
}

function midpoint(openings: FittingOpening[]): Point2D {
  if (openings.length < 2) {
    return openings[0]?.position ?? { x: 0, y: 0 };
  }
  return roundPoint({
    x: (openings[0]!.position.x + openings[1]!.position.x) / 2,
    y: (openings[0]!.position.y + openings[1]!.position.y) / 2,
  });
}
