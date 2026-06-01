import type { Equipment } from '@/core/schema';
import type { ConnectionPort } from '@/core/schema/equipment.schema';
import { getEquipmentPlanBounds, getEquipmentPortWorldPosition } from '../equipmentGeometry';
import type { Point2D, ResolvedConnectableGeometry, ResolvedConnectionPoint } from './types';

export function resolveEquipmentGeometry(equipment: Equipment): ResolvedConnectableGeometry {
  return {
    objectId: equipment.id,
    objectType: 'equipment',
    sourceEntity: equipment,
    occupiedBounds: getEquipmentPlanBounds(equipment),
    connectionPoints: (equipment.props.connectionPorts ?? []).map((port) => resolveEquipmentPort(equipment, port)),
  };
}

function resolveEquipmentPort(equipment: Equipment, port: ConnectionPort): ResolvedConnectionPoint {
  const worldPosition = getEquipmentPortWorldPosition(port, equipment);
  const localPosition = {
    x: round(worldPosition.x - equipment.transform.x),
    y: round(worldPosition.y - equipment.transform.y),
  };

  return {
    id: port.id,
    objectId: equipment.id,
    objectType: 'equipment',
    role: port.role,
    label: port.label,
    localPosition,
    worldPosition: { x: round(worldPosition.x), y: round(worldPosition.y) },
    facingDirection: edgeFacingDirection(port.edge),
    connectionProfile: { shape: 'unknown' },
    status: port.connectedDuctId ? 'occupied' : 'available',
  };
}

function round(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function edgeFacingDirection(edge: ConnectionPort['edge']): Point2D {
  switch (edge) {
    case 'north':
      return { x: 0, y: -1 };
    case 'south':
      return { x: 0, y: 1 };
    case 'west':
      return { x: -1, y: 0 };
    case 'east':
      return { x: 1, y: 0 };
  }
}
