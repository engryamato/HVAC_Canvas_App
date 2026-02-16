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
        type: entity.type as any,
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
      
      if (current.depth > hops) continue;
      if (visited.has(current.id)) continue;
      
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

      if (visited.has(current.id)) continue;
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
