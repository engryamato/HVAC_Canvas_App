import type { Fitting } from '@/core/schema';
import type { FittingType } from '@/core/schema/fitting.schema';

export type ConnectionRole = 'inlet' | 'outlet' | 'branch';

/**
 * A single connection port definition in the fitting's local coordinate space.
 * Coordinates match the geometry drawn by FittingRenderer.ts (origin at fitting center).
 */
export interface ConnectionPointDef {
  role: ConnectionRole;
  /** X offset from fitting origin in local space (pixels = inches at PIXELS_PER_INCH=1) */
  localX: number;
  /** Y offset from fitting origin in local space */
  localY: number;
}

/**
 * A connection port resolved to world coordinates.
 */
export interface WorldConnectionPoint extends ConnectionPointDef {
  worldX: number;
  worldY: number;
  fittingId: string;
}

/**
 * Local-space connection port offsets for every fitting type.
 *
 * Derivation methodology: each offset was read directly from the draw calls in
 * FittingRenderer.ts / ProfessionalRenderingHelper.ts. The first entry for each
 * type is the inlet (air in), subsequent entries are outlet then branch.
 *
 * Coordinate convention: x → right, y ↓ down (canvas default).
 * Rotation is applied externally by CanvasContainer before the renderer draws.
 */
export const FITTING_CONNECTION_OFFSETS: Record<FittingType, ConnectionPointDef[]> = {
  // helper.drawReducer({ x: -28, y: 0 }, { x: 28, y: 0 }, ...)
  reducer: [
    { role: 'inlet', localX: -28, localY: 0 },
    { role: 'outlet', localX: 28, localY: 0 },
  ],
  // Same drawn geometry as reducer
  reducer_tapered: [
    { role: 'inlet', localX: -28, localY: 0 },
    { role: 'outlet', localX: 28, localY: 0 },
  ],
  reducer_eccentric: [
    { role: 'inlet', localX: -28, localY: 0 },
    { role: 'outlet', localX: 28, localY: 0 },
  ],
  // helper.drawTee({ x:0,y:0 }, mainSize, 'top') → main x=-32..52, branch up at x=10
  tee: [
    { role: 'inlet', localX: -32, localY: 0 },
    { role: 'outlet', localX: 52, localY: 0 },
    { role: 'branch', localX: 10, localY: -32 },
  ],
  // drawWye: main x=-32..52, branch exits toward (48, -26)
  wye: [
    { role: 'inlet', localX: -32, localY: 0 },
    { role: 'outlet', localX: 52, localY: 0 },
    { role: 'branch', localX: 48, localY: -26 },
  ],
  // helper.drawElbow({ x:0,y:0 }, size*1.4, 90, size) — arc from bottom to left
  elbow_90: [
    { role: 'inlet', localX: 0, localY: 20 },
    { role: 'outlet', localX: -20, localY: 0 },
  ],
  // helper.drawElbow({ x:0,y:0 }, size*1.6, 45, size) — arc from left to upper-right
  elbow_45: [
    { role: 'inlet', localX: -20, localY: 0 },
    { role: 'outlet', localX: 14, localY: -14 },
  ],
  // drawMiteredElbow: right-angle mitered L-shape left→up
  elbow_mitered: [
    { role: 'inlet', localX: -20, localY: 0 },
    { role: 'outlet', localX: 0, localY: -20 },
  ],
  // drawEndCap: ctx.rect(-32, -half, 44, size) — open end at x=-32, cap at x=12
  cap: [
    { role: 'inlet', localX: -32, localY: 0 },
  ],
  // drawOffset: offset fitting x=-42..42, vertical offset ±10
  end_boot: [
    { role: 'inlet', localX: -42, localY: 0 },
    { role: 'outlet', localX: 42, localY: 0 },
  ],
  // drawRectToRound: rect starts at x=-42, circle center at x=20
  transition_square_to_round: [
    { role: 'inlet', localX: -42, localY: 0 },
    { role: 'outlet', localX: 20, localY: 0 },
  ],
};

/**
 * Transform a fitting's local connection ports into world coordinates,
 * applying the fitting's position and rotation.
 */
export function getWorldConnectionPoints(fitting: Fitting): WorldConnectionPoint[] {
  const { x, y, rotation } = fitting.transform;
  const fittingType = fitting.props.fittingType;
  const defs = FITTING_CONNECTION_OFFSETS[fittingType] ?? [];
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return defs.map((def) => ({
    ...def,
    fittingId: fitting.id,
    worldX: x + def.localX * cos - def.localY * sin,
    worldY: y + def.localX * sin + def.localY * cos,
  }));
}

/**
 * Given a world position (e.g., mouse cursor), find the nearest fitting connection
 * port within the given tolerance radius.
 */
export function findNearestFittingConnection(
  x: number,
  y: number,
  fittings: Fitting[],
  tolerance: number
): { fitting: Fitting; connection: WorldConnectionPoint; distance: number } | null {
  let best: { fitting: Fitting; connection: WorldConnectionPoint; distance: number } | null = null;

  for (const fitting of fittings) {
    for (const pt of getWorldConnectionPoints(fitting)) {
      const dist = Math.hypot(pt.worldX - x, pt.worldY - y);
      if (dist <= tolerance && (!best || dist < best.distance)) {
        best = { fitting, connection: pt, distance: dist };
      }
    }
  }

  return best;
}

/**
 * Given a desired snap point and a rotation, compute where the fitting's origin
 * must be placed so that the inlet port lands exactly on the snap point.
 *
 * @param fittingType - type to look up the inlet offset
 * @param snapPoint   - desired world position for the inlet port
 * @param rotationDeg - fitting rotation in degrees
 * @returns world position for fitting transform.x / transform.y
 */
export function computeFittingOriginForPortSnap(
  fittingType: FittingType,
  snapPoint: { x: number; y: number },
  rotationDeg: number
): { x: number; y: number } {
  const defs = FITTING_CONNECTION_OFFSETS[fittingType];
  const inletDef = defs?.find((d) => d.role === 'inlet') ?? defs?.[0];
  if (!inletDef) {
    return snapPoint;
  }

  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: snapPoint.x - (inletDef.localX * cos - inletDef.localY * sin),
    y: snapPoint.y - (inletDef.localX * sin + inletDef.localY * cos),
  };
}
