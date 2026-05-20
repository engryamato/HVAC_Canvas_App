# Phase 2.1: Connection Graph System with Caching


## Overview

Implement connection graph builder that constructs graph data structures from entity connections, with caching for performance.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 6)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 2: Parametric Design)

## Scope

**In Scope**:
- ConnectionGraphBuilder class with graph construction logic
- Graph caching based on entity snapshot signature
- Graph traversal utilities (getAffectedEntities, findPath, detectCycles)
- Support for different connection types (duct-to-fitting, fitting-to-duct)
- Performance optimization with signature-based cache invalidation

**Out of Scope**:
- Using the graph for parametric updates (handled in Phase 2.2)
- UI visualization of graph (not in scope)
- Incremental graph updates (future optimization)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/services/graph/ConnectionGraphBuilder.ts`
- `file:hvac-design-app/src/core/services/graph/GraphTraversal.ts`
- `file:hvac-design-app/src/core/services/graph/types.ts` - Graph types

## Acceptance Criteria

- [ ] ConnectionGraphBuilder builds graph from entity connections
- [ ] Graph includes nodes (entities) and edges (connections)
- [ ] Caching works: same signature → cached graph returned
- [ ] Cache invalidates when entities change
- [ ] getAffectedEntities returns entities within N hops of target
- [ ] Graph handles disconnected components (multiple subgraphs)
- [ ] Graph handles cycles (duct A → fitting → duct B → fitting → duct A)
- [ ] Performance: Build graph for 1000 entities in < 100ms
- [ ] Unit tests for graph building and traversal

## Dependencies

- **Requires**: Phase 1.2 (enhanced entity schemas with connections)

## Technical Notes

**Graph Structure**:
```typescript
interface ConnectionGraph {
  nodes: Map<string, GraphNode="">;
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  type: EntityType;
  entity: Entity;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'duct-connection' | 'fitting-connection';
}
```

**Caching Strategy**:
- Signature = hash of entity IDs + connection properties
- Cache stores single graph (latest)
- Invalidate on any entity add/remove/update
</string,>