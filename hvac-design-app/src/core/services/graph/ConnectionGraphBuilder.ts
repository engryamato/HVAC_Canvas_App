import type { Entity, Equipment, Fitting } from '@/core/schema';
import { ConnectionGraph, GraphNode, GraphEdge, AffectedEntitiesResult } from './types';
import { graphCache } from './GraphCache';

export class ConnectionGraphBuilder {
  private graph: ConnectionGraph;

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

    const addEdge = (source: string | undefined, target: string | undefined, type: GraphEdge['type'] = 'direct') => {
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
        metadata: {},
      });
    };

    for (const entity of entities) {
      if ((entity.type === 'duct' || entity.type === 'duct_run') && 'props' in entity) {
        addEdge(entity.props.connectedFrom, entity.id);
        addEdge(entity.id, entity.props.connectedTo);
      }

      if (entity.type === 'equipment') {
        const equipment = entity as Equipment;
        addEdge(equipment.id, equipment.props.connectedDuctId);
      }

      if (entity.type === 'fitting') {
        const fitting = entity as Fitting;
        for (const port of fitting.props.ports ?? []) {
          if (port.direction === 'in') {
            addEdge(port.connectedDuctRunId, fitting.id, 'fitting');
          } else {
            addEdge(fitting.id, port.connectedDuctRunId, 'fitting');
          }
        }
      }
    }

    return builder.build(entities.map((entity) => entity.id));
  }
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
