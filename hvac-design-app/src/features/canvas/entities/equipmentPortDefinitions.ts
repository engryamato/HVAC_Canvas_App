/**
 * PORT_DEFINITIONS — typed connection port layouts for all 16 equipment types.
 *
 * Each entry defines which ports exist on a piece of equipment, their roles,
 * which edge they sit on, and their position along that edge (offsetRatio: 0–1).
 *
 * offsetRatio convention:
 *   north/south edges: 0.0 = left end, 0.5 = center, 1.0 = right end
 *   east/west  edges:  0.0 = top end,  0.5 = center,  1.0 = bottom end
 *
 * cfmSign: +1 = air leaving the equipment into the duct (supply)
 *          -1 = air entering the equipment from the duct (return/exhaust)
 */

import type { ConnectionPort, EquipmentType } from '@/core/schema/equipment.schema';

/** Port template — same as ConnectionPort but without connectedDuctId (assigned at placement) */
export type PortDefinition = Omit<ConnectionPort, 'connectedDuctId'>;

export const PORT_DEFINITIONS: Record<EquipmentType, PortDefinition[]> = {
  // ─── Air Handling ────────────────────────────────────────────────────────

  air_handler: [
    { id: 'supply-1',      role: 'supply',      edge: 'east',  offsetRatio: 0.3, label: 'Supply' },
    { id: 'return-1',      role: 'return',       edge: 'west',  offsetRatio: 0.3, label: 'Return' },
    { id: 'outdoor-air-1', role: 'outdoor_air',  edge: 'north', offsetRatio: 0.5, label: 'OA' },
    { id: 'relief-1',      role: 'relief',       edge: 'south', offsetRatio: 0.5, label: 'Relief' },
  ],

  rtu: [
    { id: 'supply-1',      role: 'supply',      edge: 'south', offsetRatio: 0.35, label: 'Supply' },
    { id: 'return-1',      role: 'return',       edge: 'south', offsetRatio: 0.65, label: 'Return' },
    { id: 'outdoor-air-1', role: 'outdoor_air',  edge: 'north', offsetRatio: 0.5,  label: 'OA' },
    { id: 'exhaust-1',     role: 'exhaust',      edge: 'north', offsetRatio: 0.25, label: 'Exhaust' },
  ],

  mau: [
    { id: 'supply-1',      role: 'supply',      edge: 'east',  offsetRatio: 0.5, label: 'Supply' },
    { id: 'outdoor-air-1', role: 'outdoor_air',  edge: 'west',  offsetRatio: 0.5, label: 'OA Intake' },
  ],

  fcu: [
    { id: 'supply-1', role: 'supply', edge: 'south', offsetRatio: 0.5, label: 'Supply' },
    { id: 'return-1', role: 'return', edge: 'north', offsetRatio: 0.5, label: 'Return' },
  ],

  erv: [
    { id: 'supply-1',      role: 'supply',      edge: 'east',  offsetRatio: 0.25, label: 'Supply Out' },
    { id: 'exhaust-1',     role: 'exhaust',      edge: 'east',  offsetRatio: 0.75, label: 'Exhaust Out' },
    { id: 'outdoor-air-1', role: 'outdoor_air',  edge: 'west',  offsetRatio: 0.25, label: 'OA In' },
    { id: 'return-1',      role: 'return',       edge: 'west',  offsetRatio: 0.75, label: 'Return In' },
  ],

  // ─── Terminal Units ───────────────────────────────────────────────────────

  vav_box: [
    { id: 'supply-in-1',  role: 'return',  edge: 'west',  offsetRatio: 0.5, label: 'Inlet' },
    { id: 'supply-out-1', role: 'supply',  edge: 'east',  offsetRatio: 0.5, label: 'Outlet' },
  ],

  // ─── Fans ─────────────────────────────────────────────────────────────────

  fan: [
    { id: 'inlet-1',  role: 'return',  edge: 'west',  offsetRatio: 0.5, label: 'Inlet' },
    { id: 'outlet-1', role: 'supply',  edge: 'east',  offsetRatio: 0.5, label: 'Outlet' },
  ],

  exhaust_fan: [
    { id: 'inlet-1',   role: 'return',  edge: 'south', offsetRatio: 0.5, label: 'Inlet' },
    { id: 'exhaust-1', role: 'exhaust', edge: 'north', offsetRatio: 0.5, label: 'Exhaust' },
  ],

  // ─── Air Devices ──────────────────────────────────────────────────────────

  diffuser: [
    { id: 'supply-1', role: 'supply', edge: 'north', offsetRatio: 0.5, label: 'Supply' },
  ],

  grille: [
    { id: 'return-1', role: 'return', edge: 'north', offsetRatio: 0.5, label: 'Return' },
  ],

  hood: [
    { id: 'exhaust-1', role: 'exhaust', edge: 'north', offsetRatio: 0.5, label: 'Exhaust' },
  ],

  // ─── Dampers ──────────────────────────────────────────────────────────────

  damper: [
    { id: 'inline-west-1', role: 'inline', edge: 'west', offsetRatio: 0.5, label: 'In' },
    { id: 'inline-east-1', role: 'inline', edge: 'east', offsetRatio: 0.5, label: 'Out' },
  ],

  fire_damper: [
    { id: 'inline-west-1', role: 'inline', edge: 'west', offsetRatio: 0.5, label: 'In' },
    { id: 'inline-east-1', role: 'inline', edge: 'east', offsetRatio: 0.5, label: 'Out' },
  ],

  smoke_damper: [
    { id: 'inline-west-1', role: 'inline', edge: 'west', offsetRatio: 0.5, label: 'In' },
    { id: 'inline-east-1', role: 'inline', edge: 'east', offsetRatio: 0.5, label: 'Out' },
  ],

  // ─── Heating ──────────────────────────────────────────────────────────────

  furnace: [
    { id: 'supply-1', role: 'supply', edge: 'north', offsetRatio: 0.5, label: 'Supply' },
    { id: 'return-1', role: 'return', edge: 'south', offsetRatio: 0.5, label: 'Return' },
  ],

  unit_heater: [
    { id: 'supply-1', role: 'supply', edge: 'south', offsetRatio: 0.5, label: 'Discharge' },
  ],
};

// ─── World-position calculator ────────────────────────────────────────────────

interface BoundingBox {
  x: number;      // left edge in canvas pixels
  y: number;      // top edge in canvas pixels
  width: number;  // canvas pixels
  height: number; // canvas pixels
}

export interface PortWorldPosition {
  x: number;
  y: number;
  portId: string;
  role: PortDefinition['role'];
  edge: PortDefinition['edge'];
}

/**
 * Compute the canvas-space (x, y) coordinate of a port given the equipment bounding box.
 *
 * @param port      - The port definition (from PORT_DEFINITIONS)
 * @param bbox      - Equipment bounding box in canvas pixels
 * @returns         World-space coordinate of the port centre
 */
export function getPortWorldPosition(port: PortDefinition, bbox: BoundingBox): PortWorldPosition {
  let x: number;
  let y: number;

  switch (port.edge) {
    case 'north':
      x = bbox.x + bbox.width * port.offsetRatio;
      y = bbox.y;
      break;
    case 'south':
      x = bbox.x + bbox.width * port.offsetRatio;
      y = bbox.y + bbox.height;
      break;
    case 'west':
      x = bbox.x;
      y = bbox.y + bbox.height * port.offsetRatio;
      break;
    case 'east':
      x = bbox.x + bbox.width;
      y = bbox.y + bbox.height * port.offsetRatio;
      break;
  }

  return { x, y, portId: port.id, role: port.role, edge: port.edge };
}

/**
 * Return world positions of ALL ports for a piece of equipment.
 */
export function getAllPortWorldPositions(
  equipmentType: EquipmentType,
  bbox: BoundingBox
): PortWorldPosition[] {
  return (PORT_DEFINITIONS[equipmentType] ?? []).map((port) => getPortWorldPosition(port, bbox));
}

/**
 * Find the nearest port on a piece of equipment to a canvas point (px, py),
 * within the given tolerance (canvas pixels).
 * Returns null if no port is within tolerance.
 */
export function findNearestPort(
  equipmentType: EquipmentType,
  bbox: BoundingBox,
  px: number,
  py: number,
  tolerance: number
): (PortWorldPosition & { distance: number }) | null {
  const positions = getAllPortWorldPositions(equipmentType, bbox);
  let nearest: (PortWorldPosition & { distance: number }) | null = null;

  for (const pos of positions) {
    const dx = pos.x - px;
    const dy = pos.y - py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= tolerance && (!nearest || distance < nearest.distance)) {
      nearest = { ...pos, distance };
    }
  }

  return nearest;
}
