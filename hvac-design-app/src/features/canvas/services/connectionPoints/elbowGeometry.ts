import type { FittingType } from '@/core/schema/fitting.schema';
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
 * Elbow family: smooth-radius 90/45 degree donut-arc turns and the sharp
 * mitered elbow. Smooth elbows are anchored at the virtual centerline
 * intersection: the openings sit back along the connected duct centerlines and
 * the arc is tangent to those straight runs.
 *
 * Local frame: duct centerline intersection (or miter corner) at the origin.
 */
const MIN_ELBOW_TURN = 15;
const MAX_ELBOW_TURN = 165;

export function buildElbowGeometry(_type: FittingType, dims: FittingDimensions): FittingGeometry {
  // WS6e E2: `variant.elbowType` (resolved into dims.elbowKind) overrides the
  // granular fittingType, so an elbow_90 can render mitered and vice versa.
  if (dims.elbowKind === 'mitered') {
    return buildMiteredElbow(dims);
  }
  const turn = Math.min(MAX_ELBOW_TURN, Math.max(MIN_ELBOW_TURN, dims.angle || 90));
  return buildSmoothElbow(dims, turn);
}

/** Turning-vane count drawn inside the elbow throat by vane treatment. */
function vaneCount(vaneType: FittingDimensions['vaneType']): number {
  if (vaneType === 'single_wall') { return 2; }
  if (vaneType === 'double_wall') { return 4; }
  return 0;
}

/**
 * WS6e E2 — turning vanes: short chord strokes across the bend at evenly spaced
 * angles between the inner and outer radius. Drawn as accents; count grows with
 * the vane treatment. Pure decoration over the existing body (ports unchanged).
 */
function buildElbowVanes(
  arcCenter: Point2D,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  count: number
): FittingSegment[] {
  const vanes: FittingSegment[] = [];
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1);
    const a = startAngle + (endAngle - startAngle) * t;
    vanes.push({
      from: roundPoint({ x: arcCenter.x + innerR * Math.cos(a), y: arcCenter.y + innerR * Math.sin(a) }),
      to: roundPoint({ x: arcCenter.x + outerR * Math.cos(a), y: arcCenter.y + outerR * Math.sin(a) }),
    });
  }
  return vanes;
}

const DEG = Math.PI / 180;

function buildSmoothElbow(dims: FittingDimensions, turnDeg: number): FittingGeometry {
  const w = dims.inletSize;
  const radius = Math.max(dims.radiusRatio * w, w * 0.8);
  const innerR = Math.max(2, radius - w / 2);
  const outerR = radius + w / 2;

  // Inlet flow runs +x into the fitting; outlet flow turns clockwise toward +y.
  // The fitting transform's scaleY mirrors this local shape for the other side.
  const turn = turnDeg * DEG;
  const tangent = radius * Math.tan(turn / 2);
  const inletCenter = roundPoint({ x: -tangent, y: 0 });
  const outletDir = normalize({ x: Math.cos(turn), y: Math.sin(turn) });
  const outletCenter = roundPoint({ x: tangent * outletDir.x, y: tangent * outletDir.y });
  const inletDir = { x: -1, y: 0 };
  const arcCenter = roundPoint({ x: -tangent, y: radius });
  const startAngle = Math.atan2(inletCenter.y - arcCenter.y, inletCenter.x - arcCenter.x);
  const endAngle = Math.atan2(outletCenter.y - arcCenter.y, outletCenter.x - arcCenter.x);

  const body: FittingBodyPart[] = [
    { kind: 'arcBand', center: arcCenter, innerRadius: innerR, outerRadius: outerR, startAngle, endAngle },
  ];

  const centerlines = arcPolyline(arcCenter, radius, startAngle, endAngle, 6);

  const openings: FittingOpening[] = [
    { id: 'INLET', role: 'inlet', position: inletCenter, direction: inletDir, profile: roundProfile(dims.inletShape, w) },
    { id: 'OUTLET', role: 'outlet', position: outletCenter, direction: outletDir, profile: roundProfile(dims.outletShape, w) },
  ];

  const accents = buildElbowVanes(arcCenter, innerR, outerR, startAngle, endAngle, vaneCount(dims.vaneType));

  const maskBounds = bodyBounds(body);
  return { anchor: { x: 0, y: 0 }, body, centerlines, accents, openings, maskBounds };
}

function buildMiteredElbow(dims: FittingDimensions): FittingGeometry {
  const w = dims.inletSize;
  const half = w / 2;
  const arm = Math.max(dims.radiusRatio * w, w * 1.5);

  // L-shape: horizontal inlet arm (-x) meeting a vertical outlet arm (-y, up).
  const outline: Point2D[] = [
    { x: -arm, y: -half },
    { x: -half, y: -half },
    { x: -half, y: -arm },
    { x: half, y: -arm },
    { x: half, y: half },
    { x: -arm, y: half },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [{ kind: 'polygon', points: outline, fill: true }];
  const accents: FittingSegment[] = [
    { from: roundPoint({ x: -half, y: -half }), to: roundPoint({ x: half, y: half }) },
  ];
  // WS6e E2: turning vanes — chords parallel to the miter cut, offset toward the
  // inner corner. Count grows with the vane treatment.
  const vanes = vaneCount(dims.vaneType);
  const diag = normalize({ x: 1, y: 1 });
  const inwardPerp = normalize({ x: 1, y: -1 });
  for (let i = 1; i <= vanes; i += 1) {
    const offset = (i / (vanes + 1)) * half;
    const cx = inwardPerp.x * offset;
    const cy = inwardPerp.y * offset;
    const span = half * 0.6;
    accents.push({
      from: roundPoint({ x: cx - diag.x * span, y: cy - diag.y * span }),
      to: roundPoint({ x: cx + diag.x * span, y: cy + diag.y * span }),
    });
  }
  const centerlines: FittingSegment[] = [
    { from: { x: -arm, y: 0 }, to: { x: 0, y: 0 } },
    { from: { x: 0, y: 0 }, to: { x: 0, y: -arm } },
  ].map((s) => ({ from: roundPoint(s.from), to: roundPoint(s.to) }));

  const openings: FittingOpening[] = [
    { id: 'INLET', role: 'inlet', position: roundPoint({ x: -arm, y: 0 }), direction: { x: -1, y: 0 }, profile: roundProfile(dims.inletShape, w) },
    { id: 'OUTLET', role: 'outlet', position: roundPoint({ x: 0, y: -arm }), direction: { x: 0, y: -1 }, profile: roundProfile(dims.outletShape, w) },
  ];

  return { anchor: { x: 0, y: 0 }, body, centerlines, accents, openings, maskBounds: bodyBounds(body) };
}

function arcPolyline(center: Point2D, radius: number, a0: number, a1: number, steps: number): FittingSegment[] {
  const segments: FittingSegment[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t0 = a0 + ((a1 - a0) * i) / steps;
    const t1 = a0 + ((a1 - a0) * (i + 1)) / steps;
    segments.push({
      from: roundPoint({ x: center.x + radius * Math.cos(t0), y: center.y + radius * Math.sin(t0) }),
      to: roundPoint({ x: center.x + radius * Math.cos(t1), y: center.y + radius * Math.sin(t1) }),
    });
  }
  return segments;
}
