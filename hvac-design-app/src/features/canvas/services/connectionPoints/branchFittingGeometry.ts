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
import { buildWyeGeometry } from './wyeGeometry';

/**
 * Three-port branch family: tee (perpendicular branch) and wye (angled branch).
 * Wye delegates to the parametric `buildWyeGeometry` (SD5-2 conical wye) and
 * adapts it to the shared contract, so the wye remains the canonical template.
 */
export function buildBranchFittingGeometry(type: FittingType, dims: FittingDimensions): FittingGeometry {
  if (type === 'wye') {
    return adaptWye(dims);
  }
  return buildTee(dims);
}

function adaptWye(dims: FittingDimensions): FittingGeometry {
  const wye = buildWyeGeometry(dims.inletSize, dims.outletSize, dims.branchSize, dims.angle);

  const body: FittingBodyPart[] = [
    { kind: 'polygon', points: wye.outline, fill: true },
    { kind: 'polygon', points: wye.cone, fill: true },
  ];

  const openings: FittingOpening[] = wye.ports.map((port) => ({
    id: port.id,
    role: port.role,
    position: roundPoint(port.position),
    direction: normalize(port.direction),
    profile: roundProfile('round', port.diameter),
  }));

  return {
    anchor: resolveWyeAnchor(wye),
    body,
    centerlines: wye.centerlines,
    accents: [],
    openings,
    maskBounds: bodyBounds(body),
  };
}

function bodyLength(primary: number): number {
  return Math.max(40, Math.min(140, primary * 4.2));
}

const DEFAULT_TEE_BRANCH_ANGLE = 90;
const MIN_TEE_BRANCH_ANGLE = 45;
const MAX_TEE_BRANCH_ANGLE = 90;

function buildTee(dims: FittingDimensions): FittingGeometry {
  const mainH = dims.inletSize;
  const branchH = dims.branchSize;
  const half = bodyLength(mainH) / 2;
  const bx = 0; // branch root centered on the main run
  const branchLen = mainH / 2 + bodyLength(branchH) * 0.45;

  // Branch leans toward the outlet by `theta` from the main run. 90° = the
  // classic perpendicular tee, which reproduces the original geometry exactly.
  const theta =
    (Math.min(MAX_TEE_BRANCH_ANGLE, Math.max(MIN_TEE_BRANCH_ANGLE, dims.angle || DEFAULT_TEE_BRANCH_ANGLE)) *
      Math.PI) /
    180;
  const d: Point2D = { x: Math.cos(theta), y: -Math.sin(theta) }; // branch axis (outward)
  const p: Point2D = { x: -d.y, y: d.x }; // branch cross-section axis
  const tip: Point2D = { x: bx + branchLen * d.x, y: branchLen * d.y };

  const mainRect: Point2D[] = [
    { x: -half, y: -mainH / 2 },
    { x: half, y: -mainH / 2 },
    { x: half, y: mainH / 2 },
    { x: -half, y: mainH / 2 },
  ].map(roundPoint);

  const branchRect: Point2D[] = [
    { x: tip.x - (branchH / 2) * p.x, y: tip.y - (branchH / 2) * p.y },
    { x: tip.x + (branchH / 2) * p.x, y: tip.y + (branchH / 2) * p.y },
    { x: bx + (branchH / 2) * p.x, y: (branchH / 2) * p.y },
    { x: bx - (branchH / 2) * p.x, y: -(branchH / 2) * p.y },
  ].map(roundPoint);

  const body: FittingBodyPart[] = [
    { kind: 'polygon', points: mainRect, fill: true },
    { kind: 'polygon', points: branchRect, fill: true },
  ];

  const centerlines: FittingSegment[] = [
    { from: { x: -half, y: 0 }, to: { x: half, y: 0 } },
    { from: { x: bx, y: 0 }, to: tip },
  ].map((s) => ({ from: roundPoint(s.from), to: roundPoint(s.to) }));

  const openings: FittingOpening[] = [
    { id: 'INLET', role: 'inlet', position: roundPoint({ x: -half, y: 0 }), direction: { x: -1, y: 0 }, profile: roundProfile(dims.inletShape, mainH) },
    { id: 'OUTLET', role: 'outlet', position: roundPoint({ x: half, y: 0 }), direction: { x: 1, y: 0 }, profile: roundProfile(dims.outletShape, mainH) },
    { id: 'BRANCH', role: 'branch', position: roundPoint(tip), direction: normalize(d), profile: roundProfile('round', branchH) },
  ];

  return { anchor: { x: 0, y: 0 }, body, centerlines, accents: [], openings, maskBounds: bodyBounds(body) };
}

function resolveWyeAnchor(wye: ReturnType<typeof buildWyeGeometry>): Point2D {
  const branch = wye.ports.find((port) => port.role === 'branch');
  if (!branch || Math.abs(branch.direction.y) < 0.000001) {
    return { x: 0, y: 0 };
  }

  const t = -branch.position.y / branch.direction.y;
  return roundPoint({
    x: branch.position.x + branch.direction.x * t,
    y: branch.position.y + branch.direction.y * t,
  });
}
