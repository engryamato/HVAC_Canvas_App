import type { ConnectionPort, PortRole } from '@/core/schema/equipment.schema';
import type { Equipment } from '@/core/schema';
import { isTerminalEquipment } from './equipmentClassification';

export interface EquipmentPortFlow {
  portId: string;
  role: PortRole;
  direction: 'in' | 'out' | 'both';
}

type PortFlowInput = Pick<ConnectionPort, 'id'> & {
  role?: PortRole;
};

export function resolveEquipmentPortFlow(port: PortFlowInput): EquipmentPortFlow {
  const role = port.role ?? inferPortRoleFromId(port.id);

  return {
    portId: port.id,
    role,
    direction: getPortDirection(role),
  };
}

export function resolveEquipmentEntityPortFlow(equipment: Equipment, port: PortFlowInput): EquipmentPortFlow {
  const flow = resolveEquipmentPortFlow(port);
  if (!isTerminalEquipment(equipment)) {
    return flow;
  }

  return {
    ...flow,
    direction: getTerminalPortDirection(flow.role),
  };
}

export function isEquipmentOutletPort(port: PortFlowInput): boolean {
  const direction = resolveEquipmentPortFlow(port).direction;
  return direction === 'out' || direction === 'both';
}

export function isEquipmentEntityOutletPort(equipment: Equipment, port: PortFlowInput): boolean {
  const direction = resolveEquipmentEntityPortFlow(equipment, port).direction;
  return direction === 'out' || direction === 'both';
}

function inferPortRoleFromId(portId: string): PortRole {
  const normalizedId = portId.toLowerCase().replace(/[\s-]+/g, '_');

  if (normalizedId.includes('return')) {
    return 'return';
  }
  if (normalizedId.includes('outdoor_air') || normalizedId.includes('outside_air') || normalizedId.includes('oa')) {
    return 'outdoor_air';
  }
  if (normalizedId.includes('exhaust')) {
    return 'exhaust';
  }
  if (normalizedId.includes('relief')) {
    return 'relief';
  }
  if (normalizedId.includes('inline')) {
    return 'inline';
  }

  return 'supply';
}

function getPortDirection(role: PortRole): EquipmentPortFlow['direction'] {
  switch (role) {
    case 'return':
    case 'outdoor_air':
      return 'in';
    case 'supply':
    case 'exhaust':
    case 'relief':
      return 'out';
    case 'inline':
      return 'both';
  }
}

function getTerminalPortDirection(role: PortRole): EquipmentPortFlow['direction'] {
  switch (role) {
    case 'supply':
    case 'outdoor_air':
      return 'in';
    case 'return':
    case 'exhaust':
    case 'relief':
      return 'out';
    case 'inline':
      return 'both';
  }
}
