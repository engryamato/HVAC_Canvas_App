import type { Fitting } from '@/core/schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import {
  resolveFittingGeometry,
  resolveLocalFittingPorts,
  type LocalPortDefinition,
} from './connectionPoints/fittingResolver';
import { buildFittingGeometry } from './connectionPoints/fittingGeometry';

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
  // WS10: a takeoff is topologically a body tap (through-flow + branch). These
  // offsets mirror the tee as a safe placeholder; real takeoff geometry is WS6.
  takeoff: [
    { role: 'inlet', localX: -32, localY: 0 },
    { role: 'outlet', localX: 52, localY: 0 },
    { role: 'branch', localX: 10, localY: -32 },
  ],
};

/**
 * Transform a fitting's local connection ports into world coordinates,
 * applying the fitting's position and rotation.
 */
export function getWorldConnectionPoints(fitting: Fitting): WorldConnectionPoint[] {
  const localPorts = resolveLocalFittingPorts(fitting);
  const resolvedGeometry = resolveFittingGeometry(fitting);

  return resolvedGeometry.connectionPoints.map((point, index) => ({
    role: normalizeConnectionRole(point.role),
    localX: localPorts[index]?.localPosition.x ?? point.localPosition.x,
    localY: localPorts[index]?.localPosition.y ?? point.localPosition.y,
    fittingId: fitting.id,
    worldX: point.worldPosition.x,
    worldY: point.worldPosition.y,
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
  const inletDef = getStaticLocalPorts(fittingType).find((d) => d.role === 'inlet') ?? getStaticLocalPorts(fittingType)[0];
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

export function computeFittingOriginForAnchorSnap(
  fitting: Fitting,
  snapPoint: { x: number; y: number },
  rotationDeg = fitting.transform.rotation ?? 0,
  scaleX = fitting.transform.scaleX ?? 1,
  scaleY = fitting.transform.scaleY ?? 1
): { x: number; y: number } {
  const anchor = buildFittingGeometry(fitting).anchor;
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = anchor.x * scaleX;
  const localY = anchor.y * scaleY;

  return {
    x: snapPoint.x - (localX * cos - localY * sin),
    y: snapPoint.y - (localX * sin + localY * cos),
  };
}

function getStaticLocalPorts(fittingType: FittingType): ConnectionPointDef[] {
  return (FITTING_CONNECTION_OFFSETS[fittingType] ?? []).map((point) => ({ ...point }));
}

function normalizeConnectionRole(role: string | undefined): ConnectionRole {
  if (role === 'branch' || role === 'branch_out') {
    return 'branch';
  }
  if (role === 'outlet' || role === 'straight_out') {
    return 'outlet';
  }
  return 'inlet';
}

function toConnectionPointDef(definition: LocalPortDefinition): ConnectionPointDef {
  return {
    role: normalizeConnectionRole(definition.role),
    localX: definition.localPosition.x,
    localY: definition.localPosition.y,
  };
}

function createStaticFitting(type: FittingType): Fitting {
  return {
    id: '550e8400-e29b-41d4-a716-446655449999',
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      engineeringSystem: 'standard_duct',
      fittingType: type,
      manualOverride: false,
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

for (const fittingType of Object.keys(FITTING_CONNECTION_OFFSETS) as FittingType[]) {
  FITTING_CONNECTION_OFFSETS[fittingType] = resolveLocalFittingPorts(createStaticFitting(fittingType)).map(toConnectionPointDef);
}
