/**
 * Auto-Fitting Strategy Architecture — Shared Types
 *
 * Defines the core interfaces for the topology-aware fitting resolver:
 * - TopologyContext: input to all strategy engines
 * - FittingPreview: resolver preview output (for UI ghost rendering)
 * - FittingRequest: strategy engine output (strategies return FittingRequest[])
 * - ITopoStrategy: interface all strategy engines must implement
 */
import { ConnectionPoint } from '@/core/services/connectionDetection';
import { FittingType, DuctMaterial, IndustrialMaterial, IndustrialConstraints, Service } from '@/core/schema';

/**
 * Input context passed to all topology strategy engines.
 * Describes the connection topology at a single junction point.
 */
export interface TopologyContext {
  /** All connection points involved in this topology junction */
  connections: ConnectionPoint[];
  /** Classified topology type at this junction */
  topologyType: 'turn' | 'transition' | 'junction' | 'termination' | 'straight';
  /** Active service and industrial constraints (null if not applicable) */
  constraints: {
    service: Service | null;
    industrial: IndustrialConstraints | null;
  };
  /** Angle between ducts in degrees (for turn/elbow topologies) */
  angleDeg?: number;
  /** Index of the primary run connection in the connections array */
  primaryRunIndex?: number;
  /** Indices of branch connections in the connections array (for junctions) */
  branchIndices?: number[];
  /** Encoded shape signature for transition topologies (e.g. 'round->rect') */
  shapeSignature?: string;
}

/**
 * Preview output from the fitting resolver.
 * Used by the UI to render ghost fittings before insertion.
 */
export interface FittingPreview {
  /** Ordered list of fittings to insert at this junction */
  fittings: Array<{
    fittingType: FittingType;
    sequenceIndex: number;
  }>;
  /** Whether the proposed fitting sequence is valid */
  isValid: boolean;
  /** Reason category for validation failure (if isValid is false) */
  validationFailureType?: 'geometry_impossible' | 'service_violation';
  /** Human-readable explanation of why the preview is invalid */
  invalidReason?: string;
  /** Tooltip text shown on hover in the canvas */
  tooltipText: string;
  /** Ghost overlay color: green for valid, red for invalid */
  ghostColor: 'green' | 'red';
}

/**
 * A single fitting insertion request produced by a strategy engine.
 * Strategies return an array of FittingRequest[] for multi-fitting sequences.
 */
export interface FittingRequest {
  /** The fitting type to insert */
  fittingType: FittingType;
  /** Material for this fitting */
  material: DuctMaterial | IndustrialMaterial;
  /** Length of the fitting in inches (optional, for transition pieces) */
  length?: number;
  /** Eccentric reducer alignment (optional) */
  alignment?: 'center_line' | 'flat_top' | 'flat_bottom';
  /** Angle in degrees (for elbows) */
  angle?: number;
  /** Service ID to associate with this fitting */
  serviceId?: string;
  /** Position in the insertion sequence (0-based) */
  sequenceIndex: number;
  /** Always true — fittings produced by strategies are auto-inserted */
  autoInserted: true;
}

/**
 * Interface that all topology strategy engines must implement.
 * Each strategy is responsible for a specific topology type
 * (e.g. TurnStrategy, TransitionStrategy, JunctionStrategy).
 */
export interface ITopoStrategy {
  /**
   * Calculate the fitting sequence for the given topology context.
   * Returns an empty array if the strategy cannot handle the context.
   */
  calculate(ctx: TopologyContext): FittingRequest[];
}
