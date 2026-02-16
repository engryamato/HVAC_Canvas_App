export interface GraphNode {
  id: string;
  type: 'duct' | 'fitting' | 'equipment' | 'accessory';
  entityId: string;
  connections: string[];
  metadata: {
    systemType?: string;
    pressureClass?: string;
    airflow?: number;
    velocity?: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'direct' | 'fitting' | 'branch';
  metadata: {
    angle?: number;
    length?: number;
    diameter?: number;
  };
}

export interface ConnectionGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  version: number;
  timestamp: number;
  signature: string;
}

export interface AffectedEntitiesResult {
  directlyAffected: string[];
  indirectlyAffected: string[];
  allAffected: string[];
  paths: Map<string, string[]>;
}
