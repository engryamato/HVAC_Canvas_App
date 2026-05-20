import type { Entity, Equipment, Fitting } from '@/core/schema';
import type { ConnectionGraph, DuctTopologyRole, TopologyFailureReason, TopologyValidationResult } from './types';

const SOURCE_EQUIPMENT_TYPES = new Set(['air_handler', 'rtu', 'fan', 'furnace']);

export class TopologyValidationService {
  static validate(graph: ConnectionGraph, entities: Record<string, Entity>): TopologyValidationResult[] {
    return getComponents(graph).map((componentIds, index) => {
      const componentId = `component-${index + 1}`;
      const affectedEntityIds = Array.from(componentIds);
      const brokenReason = findBrokenReference(componentIds, entities);
      if (brokenReason) {
        return invalid(componentId, affectedEntityIds, brokenReason);
      }

      const malformedPorts = affectedEntityIds.some((id) => hasMalformedPorts(entities[id], entities));
      if (malformedPorts) {
        return invalid(componentId, affectedEntityIds, 'MALFORMED_FITTING_PORTS');
      }

      const sources = affectedEntityIds.filter((id) => isSourceEquipment(entities[id]));
      if (sources.length === 0) {
        return invalid(componentId, affectedEntityIds, 'NO_SOURCE');
      }
      if (sources.length > 1) {
        return invalid(componentId, affectedEntityIds, 'MULTIPLE_SOURCES');
      }

      const incomingCounts = getIncomingCounts(graph, componentIds);
      const hasMultipleParents = affectedEntityIds.some((id) => (incomingCounts.get(id) ?? 0) > 1);
      if (hasMultipleParents) {
        return invalid(componentId, affectedEntityIds, 'MULTIPLE_UPSTREAM_PATHS');
      }

      if (hasCycle(graph, componentIds)) {
        return invalid(componentId, affectedEntityIds, 'CYCLE_DETECTED');
      }

      return {
        componentId,
        isValid: true,
        sourceEquipmentId: sources[0],
        affectedEntityIds,
        ductRoles: classifyDuctRoles(graph, componentIds, sources[0]!),
      };
    });
  }
}

function invalid(componentId: string, affectedEntityIds: string[], reason: TopologyFailureReason): TopologyValidationResult {
  return {
    componentId,
    isValid: false,
    affectedEntityIds,
    reason,
  };
}

function getComponents(graph: ConnectionGraph): Set<string>[] {
  const components: Set<string>[] = [];
  const visited = new Set<string>();

  for (const nodeId of graph.nodes.keys()) {
    if (visited.has(nodeId)) {
      continue;
    }

    const component = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      component.add(current);

      for (const neighbor of graph.nodes.get(current)?.connections ?? []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

function getOutgoing(graph: ConnectionGraph, nodeId: string): string[] {
  return Array.from(graph.edges.values())
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);
}

function getIncomingCounts(graph: ConnectionGraph, componentIds: Set<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of componentIds) {
    counts.set(id, 0);
  }

  for (const edge of graph.edges.values()) {
    if (!componentIds.has(edge.source) || !componentIds.has(edge.target)) {
      continue;
    }
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
  }

  return counts;
}

function hasCycle(graph: ConnectionGraph, componentIds: Set<string>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);
    for (const target of getOutgoing(graph, nodeId)) {
      if (componentIds.has(target) && visit(target)) {
        return true;
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  return Array.from(componentIds).some((id) => visit(id));
}

function classifyDuctRoles(
  graph: ConnectionGraph,
  componentIds: Set<string>,
  sourceEquipmentId: string
): Record<string, DuctTopologyRole> {
  const roles: Record<string, DuctTopologyRole> = {};
  const queue: Array<{ id: string; role: DuctTopologyRole }> = [{ id: sourceEquipmentId, role: 'main' }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) {
      continue;
    }
    visited.add(current.id);

    const node = graph.nodes.get(current.id);
    if (node?.type === 'duct_run') {
      roles[current.id] = current.role;
    }

    const children = getOutgoing(graph, current.id).filter((id) => componentIds.has(id));
    const nextRole = current.role === 'branch' || children.length > 1 ? 'branch' : 'main';
    for (const child of children) {
      queue.push({ id: child, role: nextRole });
    }
  }

  return roles;
}

function isSourceEquipment(entity: Entity | undefined): boolean {
  if (entity?.type !== 'equipment') {
    return false;
  }
  return SOURCE_EQUIPMENT_TYPES.has((entity as Equipment).props.equipmentType);
}

function hasMalformedPorts(entity: Entity | undefined, entities: Record<string, Entity>): boolean {
  if (entity?.type !== 'fitting') {
    return false;
  }

  const ports = (entity as Fitting).props.ports;
  if (!ports) {
    return false;
  }

  const seenIds = new Set<string>();
  for (const port of ports) {
    const connected = entities[port.connectedDuctRunId];
    if (!connected || connected.type !== 'duct_run' || seenIds.has(port.id)) {
      return true;
    }
    seenIds.add(port.id);
  }

  const inletCount = ports.filter((port) => port.direction === 'in').length;
  return ports.length > 0 && inletCount !== 1;
}

function findBrokenReference(componentIds: Set<string>, entities: Record<string, Entity>): TopologyFailureReason | null {
  for (const id of componentIds) {
    const entity = entities[id];
    if (!entity) {
      return 'BROKEN_REFERENCE';
    }

    if ((entity.type === 'duct' || entity.type === 'duct_run')) {
      const refs = [entity.props.connectedFrom, entity.props.connectedTo].filter(Boolean);
      if (refs.some((ref) => !entities[ref!])) {
        return 'BROKEN_REFERENCE';
      }
    }

    if (entity.type === 'equipment' && entity.props.connectedDuctId && !entities[entity.props.connectedDuctId]) {
      return 'BROKEN_REFERENCE';
    }
  }

  return null;
}
