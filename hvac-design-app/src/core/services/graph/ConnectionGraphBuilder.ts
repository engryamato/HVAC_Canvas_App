import type { Entity, Equipment, Fitting } from '@/core/schema';
import { ConnectionGraph, GraphNode, GraphEdge, AffectedEntitiesResult } from './types';
import { graphCache } from './GraphCache';
import { isEquipmentEntityOutletPort } from './equipmentPortFlow';

export class ConnectionGraphBuilder {
  private graph: ConnectionGraph;
  /**
   * Tracks the canonical (direction-insensitive) key for every edge already added so a
   * single physical link can never be recorded twice. Without this, contradictory
   * `connectedFrom`/`connectedTo` metadata (A→B on one entity, B→A on the other) yields two
   * directional edges for one connection, which `TopologyValidationService` then reads as a
   * false 2-cycle / inflated incoming-edge count.
   */
  private edgePairKeys = new Set<string>();

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      version: 1,
      timestamp: Date.now(),
      signature: '',
    };
  }

  addNode(node: GraphNode): void {
    this.graph.nodes.set(node.id, node);
  }

  addEdge(edge: GraphEdge): void {
    if (this.graph.edges.has(edge.id)) {
      return;
    }

    const pairKey = edgePairKey(edge);
    if (this.edgePairKeys.has(pairKey)) {
      return;
    }
    this.edgePairKeys.add(pairKey);

    this.graph.edges.set(edge.id, edge);
    
    const sourceNode = this.graph.nodes.get(edge.source);
    const targetNode = this.graph.nodes.get(edge.target);
    
    if (sourceNode && !sourceNode.connections.includes(edge.target)) {
      sourceNode.connections.push(edge.target);
    }
    if (targetNode && !targetNode.connections.includes(edge.source)) {
      targetNode.connections.push(edge.source);
    }
  }

  build(entityIds: string[]): ConnectionGraph {
    this.graph.signature = graphCache.generateSignature(entityIds);
    this.graph.timestamp = Date.now();
    graphCache.set(this.graph.signature, this.graph);
    return this.graph;
  }

  static fromEntities(entities: Array<{id: string; type: string; connectedFrom?: string; connectedTo?: string; systemType?: string}>): ConnectionGraph {
    const builder = new ConnectionGraphBuilder();
    
    for (const entity of entities) {
      builder.addNode({
        id: entity.id,
        type: toGraphNodeType(entity.type),
        entityId: entity.id,
        connections: [],
        metadata: {
          systemType: entity.systemType,
        },
      });
    }

    for (const entity of entities) {
      if (entity.connectedTo) {
        builder.addEdge({
          id: `${entity.id}-${entity.connectedTo}`,
          source: entity.id,
          target: entity.connectedTo,
          type: 'direct',
          metadata: {},
        });
      }
    }

    return builder.build(entities.map(e => e.id));
  }

  static buildFromPersistedMetadata(entitiesById: Record<string, Entity>): ConnectionGraph {
    const builder = new ConnectionGraphBuilder();
    const entities = Object.values(entitiesById);
    const equipmentPortConnectionKeys = collectEquipmentPortConnectionKeys(entities);

    for (const entity of entities) {
      if (entity.type === 'room' || entity.type === 'note' || entity.type === 'group') {
        continue;
      }

      builder.addNode({
        id: entity.id,
        type: entity.type as GraphNode['type'],
        entityId: entity.id,
        connections: [],
        metadata: {
          systemType: 'systemType' in entity.props ? entity.props.systemType : undefined,
          airflow: 'airflow' in entity.props ? entity.props.airflow : undefined,
          velocity:
            (entity.type === 'duct' || entity.type === 'duct_run') && 'calculated' in entity
              ? entity.calculated.velocity
              : undefined,
        },
      });
    }

    const addEdge = (
      source: string | undefined,
      target: string | undefined,
      type: GraphEdge['type'] = 'direct',
      metadata: GraphEdge['metadata'] = {}
    ) => {
      if (!source || !target || source === target) {
        return;
      }
      if (!builder.graph.nodes.has(source) || !builder.graph.nodes.has(target)) {
        return;
      }
      builder.addEdge({
        id: `${source}->${target}`,
        source,
        target,
        type,
        metadata,
      });
    };

    for (const entity of entities) {
      if ((entity.type === 'duct' || entity.type === 'duct_run') && 'props' in entity) {
        if (!isEquipmentPortConnection(equipmentPortConnectionKeys, entity.props.connectedFrom, entity.id)) {
          addEdge(entity.props.connectedFrom, entity.id, 'direct', {
            targetEndpoint: {
              objectId: entity.id,
              objectType: entity.type,
              connectionPointId: 'start',
            },
          });
        }
        if (!isEquipmentPortConnection(equipmentPortConnectionKeys, entity.props.connectedTo, entity.id)) {
          addEdge(entity.id, entity.props.connectedTo, 'direct', {
            sourceEndpoint: {
              objectId: entity.id,
              objectType: entity.type,
              connectionPointId: 'end',
            },
          });
        }
      }

      if (entity.type === 'equipment') {
        const equipment = entity as Equipment;
        let addedPortEdge = false;
        for (const port of equipment.props.connectionPorts ?? []) {
          if (!port.connectedDuctId) {
            continue;
          }

          addedPortEdge = true;
          const isOutletPort = isEquipmentEntityOutletPort(equipment, port);
          const edgeId = isOutletPort
            ? `${equipment.id}:${port.id}->${port.connectedDuctId}`
            : `${port.connectedDuctId}->${equipment.id}:${port.id}`;
          const source = isOutletPort ? equipment.id : port.connectedDuctId;
          const target = isOutletPort ? port.connectedDuctId : equipment.id;

          if (builder.graph.nodes.has(source) && builder.graph.nodes.has(target)) {
            const ductEndpoint = resolveDuctEndpointRef(entitiesById[port.connectedDuctId], equipment.id);
            builder.addEdge({
              id: edgeId,
              source,
              target,
              type: 'direct',
              metadata: {
                sourceEndpoint: isOutletPort
                  ? {
                      objectId: equipment.id,
                      objectType: 'equipment',
                      connectionPointId: port.id,
                    }
                  : ductEndpoint,
                targetEndpoint: isOutletPort
                  ? ductEndpoint
                  : {
                      objectId: equipment.id,
                      objectType: 'equipment',
                      connectionPointId: port.id,
                    },
              },
            });
          }
        }

        if (!addedPortEdge) {
          addEdge(equipment.id, equipment.props.connectedDuctId);
        }
      }

      if (entity.type === 'fitting') {
        const fitting = entity as Fitting;
        for (const port of fitting.props.ports ?? []) {
          if (port.direction === 'in') {
            addEdge(port.connectedDuctRunId, fitting.id, 'fitting', {
              sourceEndpoint: {
                objectId: port.connectedDuctRunId,
                objectType: 'duct_run',
                connectionPointId: port.connectedEnd,
              },
              targetEndpoint: {
                objectId: fitting.id,
                objectType: 'fitting',
                connectionPointId: fittingConnectionPointId(port.role),
              },
            });
          } else {
            addEdge(fitting.id, port.connectedDuctRunId, 'fitting', {
              sourceEndpoint: {
                objectId: fitting.id,
                objectType: 'fitting',
                connectionPointId: fittingConnectionPointId(port.role),
              },
              targetEndpoint: {
                objectId: port.connectedDuctRunId,
                objectType: 'duct_run',
                connectionPointId: port.connectedEnd,
              },
            });
          }
        }
      }
    }

    return builder.build(entities.map((entity) => entity.id));
  }
}

function fittingConnectionPointId(role: string): string {
  switch (role) {
    case 'inlet':
      return 'INLET';
    case 'straight_out':
    case 'outlet':
      return 'OUTLET';
    case 'branch_out':
      return 'BRANCH';
    default:
      return role.toUpperCase();
  }
}

function resolveDuctEndpointRef(entity: Entity | undefined, connectedEntityId: string): GraphEdge['metadata']['sourceEndpoint'] {
  if (!entity || (entity.type !== 'duct' && entity.type !== 'duct_run')) {
    return undefined;
  }

  if (entity.props.connectedFrom === connectedEntityId) {
    return {
      objectId: entity.id,
      objectType: entity.type,
      connectionPointId: 'start',
    };
  }

  if (entity.props.connectedTo === connectedEntityId) {
    return {
      objectId: entity.id,
      objectType: entity.type,
      connectionPointId: 'end',
    };
  }

  return undefined;
}

function collectEquipmentPortConnectionKeys(entities: Entity[]): Set<string> {
  const keys = new Set<string>();

  for (const entity of entities) {
    if (entity.type !== 'equipment') {
      continue;
    }

    const equipment = entity as Equipment;
    for (const port of equipment.props.connectionPorts ?? []) {
      if (port.connectedDuctId) {
        keys.add(physicalConnectionKey(equipment.id, port.connectedDuctId));
      }
    }
  }

  return keys;
}

function isEquipmentPortConnection(
  equipmentPortConnectionKeys: Set<string>,
  possibleEquipmentId: string | undefined,
  ductId: string
): boolean {
  if (!possibleEquipmentId) {
    return false;
  }

  return equipmentPortConnectionKeys.has(physicalConnectionKey(possibleEquipmentId, ductId));
}

function physicalConnectionKey(firstEntityId: string, secondEntityId: string): string {
  return [firstEntityId, secondEntityId].sort().join('<->');
}

/**
 * Canonical dedup key for an edge. For the default directional id (`${source}->${target}`)
 * we collapse A→B and B→A to a single physical link via the sorted node-pair key. Edges that
 * carry a custom id — equipment ports inject `:${portId}`, the legacy `fromEntities` builder
 * uses a `-` separator — keep their own id as the key so genuinely distinct parallel
 * connections (e.g. two equipment ports landing on the same duct) are preserved.
 */
function edgePairKey(edge: GraphEdge): string {
  if (edge.id !== `${edge.source}->${edge.target}`) {
    return edge.id;
  }
  return physicalConnectionKey(edge.source, edge.target);
}

function toGraphNodeType(type: string): GraphNode['type'] {
  if (type === 'duct' || type === 'duct_run' || type === 'fitting' || type === 'equipment' || type === 'accessory') {
    return type;
  }

  return 'accessory';
}

export class GraphTraversal {
  private graph: ConnectionGraph;

  constructor(graph: ConnectionGraph) {
    this.graph = graph;
  }

  getConnectedEntities(entityId: string, hops: number = 1): string[] {
    const visited = new Set<string>();
    const queue: Array<{id: string; depth: number}> = [{id: entityId, depth: 0}];
    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.depth > hops) {continue;}
      if (visited.has(current.id)) {continue;}
      
      visited.add(current.id);
      if (current.id !== entityId) {
        result.push(current.id);
      }

      const node = this.graph.nodes.get(current.id);
      if (node) {
        for (const connection of node.connections) {
          if (!visited.has(connection)) {
            queue.push({id: connection, depth: current.depth + 1});
          }
        }
      }
    }

    return result;
  }

  getAffectedEntities(changedEntityId: string): AffectedEntitiesResult {
    const directlyAffected = this.getConnectedEntities(changedEntityId, 1);
    const indirectlyAffected = this.getConnectedEntities(changedEntityId, 3)
      .filter(id => !directlyAffected.includes(id) && id !== changedEntityId);
    
    const allAffected = [...directlyAffected, ...indirectlyAffected];
    
    const paths = new Map<string, string[]>();
    for (const affectedId of allAffected) {
      const path = this.findPath(changedEntityId, affectedId);
      if (path) {
        paths.set(affectedId, path);
      }
    }

    return {
      directlyAffected,
      indirectlyAffected,
      allAffected,
      paths,
    };
  }

  findPath(startId: string, endId: string): string[] | null {
    const visited = new Set<string>();
    const queue: Array<{id: string; path: string[]}> = [{id: startId, path: [startId]}];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.id === endId) {
        return current.path;
      }

      if (visited.has(current.id)) {continue;}
      visited.add(current.id);

      const node = this.graph.nodes.get(current.id);
      if (node) {
        for (const connection of node.connections) {
          if (!visited.has(connection)) {
            queue.push({
              id: connection,
              path: [...current.path, connection],
            });
          }
        }
      }
    }

    return null;
  }
}
