export interface GraphNode {
  id: string;
  type: 'duct' | 'duct_run' | 'fitting' | 'equipment' | 'accessory';
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

export interface PressureResult {
  cumulativePressureDrop: number;
  availableStaticPressure: number;
  pressureLoss: number;
}

export type TopologyFailureReason =
  | 'MULTIPLE_SOURCES'
  | 'NO_SOURCE'
  | 'CYCLE_DETECTED'
  | 'MULTIPLE_UPSTREAM_PATHS'
  | 'MALFORMED_FITTING_PORTS'
  | 'BROKEN_REFERENCE';

export type DuctTopologyRole = 'main' | 'branch';

export interface TopologyValidationResult {
  componentId: string;
  isValid: boolean;
  sourceEquipmentId?: string;
  affectedEntityIds: string[];
  reason?: TopologyFailureReason;
  ductRoles?: Record<string, DuctTopologyRole>;
}

export interface OverlayStatus {
  color: string | null;
  label: string;
  valueText: string;
  neutral: boolean;
}
