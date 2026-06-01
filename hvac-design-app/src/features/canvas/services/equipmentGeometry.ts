import type { Equipment } from '@/core/schema';
import type { ConnectionPort, PortRole } from '@/core/schema/equipment.schema';
import { resolveEquipmentPortFlow } from '@/core/services/graph/equipmentPortFlow';

export interface EquipmentPlanBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EquipmentPortWorldPosition {
  x: number;
  y: number;
  portId: string;
  role: ConnectionPort['role'];
  edge: ConnectionPort['edge'];
}

export interface PortFlow {
  portId: string;
  role: PortRole;
  direction: 'in' | 'out' | 'both';
}

export function getEquipmentPlanBounds(equipment: Equipment): EquipmentPlanBounds {
  return {
    x: equipment.transform.x,
    y: equipment.transform.y,
    width: equipment.props.width * equipment.transform.scaleX,
    height: equipment.props.depth * equipment.transform.scaleY,
  };
}

export function getPortWorldPosition(
  port: ConnectionPort,
  bounds: EquipmentPlanBounds
): EquipmentPortWorldPosition {
  switch (port.edge) {
    case 'north':
      return {
        x: bounds.x + bounds.width * port.offsetRatio,
        y: bounds.y,
        portId: port.id,
        role: port.role,
        edge: port.edge,
      };
    case 'south':
      return {
        x: bounds.x + bounds.width * port.offsetRatio,
        y: bounds.y + bounds.height,
        portId: port.id,
        role: port.role,
        edge: port.edge,
      };
    case 'west':
      return {
        x: bounds.x,
        y: bounds.y + bounds.height * port.offsetRatio,
        portId: port.id,
        role: port.role,
        edge: port.edge,
      };
    case 'east':
      return {
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height * port.offsetRatio,
        portId: port.id,
        role: port.role,
        edge: port.edge,
      };
  }
}

export function getEquipmentPortWorldPosition(
  port: ConnectionPort,
  equipment: Equipment
): EquipmentPortWorldPosition {
  return getPortWorldPosition(port, getEquipmentPlanBounds(equipment));
}

export function getEquipmentPortWorldPositions(equipment: Equipment): EquipmentPortWorldPosition[] {
  return (equipment.props.connectionPorts ?? []).map((port) => getEquipmentPortWorldPosition(port, equipment));
}

export function resolvePortFlow(port: ConnectionPort): PortFlow {
  return resolveEquipmentPortFlow(port);
}
