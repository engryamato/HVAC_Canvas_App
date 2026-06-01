import type { Duct, DuctRun, Entity } from '@/core/schema';
import { resolveDuctEndpoints, type DuctEndpointEntity } from './ductEndpointResolver';
import { resolveConnectableGeometry } from './resolveConnectableGeometry';
import type {
  ConnectionEdge,
  ConnectionProfile,
  EndpointRef,
  Point2D,
  ResolvedConnectionPoint,
  ResolvedDuctEndpoint,
} from './types';

/**
 * Connection-drift validation layer (PRD §8).
 *
 * Pure functions over the current model graph. They evaluate existing state and
 * never mutate it — geometry resolution stays the single source of truth, so a
 * drift here means a real divergence between a persisted connection and the
 * resolved port it points at.
 */

export type ConnectionIssueCode =
  | 'drift'
  | 'profile_mismatch'
  | 'port_overuse'
  | 'orphaned_connection'
  | 'missing_port';

export interface ConnectionValidationIssue {
  code: ConnectionIssueCode;
  severity: 'error' | 'warning';
  message: string;
  objectId?: string;
  connectionPointId?: string;
  endpoint?: EndpointRef;
  /** Endpoint→port distance in pixels, when relevant. */
  distance?: number;
}

export interface ConnectionValidationOptions {
  /** Max endpoint→port distance still considered coincident (pixels). */
  coincidenceTolerance?: number;
  /** Relative tolerance for matching round diameters / rect dimensions. */
  sizeTolerance?: number;
  /** Allowed connections per port (default 1). */
  portCapacity?: number;
}

const DEFAULT_OPTIONS: Required<ConnectionValidationOptions> = {
  coincidenceTolerance: 1,
  sizeTolerance: 0.05,
  portCapacity: 1,
};

function isDuctEntity(entity: Entity): entity is Duct | DuctRun {
  return entity.type === 'duct' || entity.type === 'duct_run';
}

/**
 * Extract persisted endpoint↔port edges from the model graph.
 *
 * This is the one place that reads object-type-specific persistence fields. The
 * validator core below stays object-type-agnostic and works purely on the
 * resulting edges + resolved geometry.
 */
export function buildConnectionEdges(entities: Record<string, Entity>): ConnectionEdge[] {
  const edges: ConnectionEdge[] = [];

  for (const entity of Object.values(entities)) {
    if (entity.type === 'fitting') {
      const resolved = resolveConnectableGeometry(entity);
      const ports = resolved?.connectionPoints ?? [];
      const connections = entity.props.connectionPoints ?? [];
      connections.forEach((connection, index) => {
        const port = ports[connection.pointIndex ?? index];
        edges.push(
          makeEdge(entities, entity.id, port?.id ?? `#${connection.pointIndex ?? index}`, connection.ductId, port)
        );
      });
    } else if (entity.type === 'equipment') {
      const resolved = resolveConnectableGeometry(entity);
      const ports = resolved?.connectionPoints ?? [];
      for (const port of entity.props.connectionPorts ?? []) {
        if (!port.connectedDuctId) {
          continue;
        }
        const resolvedPort = ports.find((candidate) => candidate.id === port.id);
        edges.push(makeEdge(entities, entity.id, port.id, port.connectedDuctId, resolvedPort));
      }
    }
  }

  return edges;
}

function makeEdge(
  entities: Record<string, Entity>,
  objectId: string,
  connectionPointId: string,
  ductId: string,
  port: ResolvedConnectionPoint | undefined
): ConnectionEdge {
  const duct = entities[ductId];
  const endpoint = duct && isDuctEntity(duct) && port ? nearestDuctEndpoint(duct, port.worldPosition) : undefined;

  return {
    endpoint: {
      entityId: ductId,
      entityType: endpoint?.entityType ?? 'duct',
      endpoint: endpoint?.endpoint ?? 'end',
    },
    connectionPoint: { objectId, connectionPointId },
  };
}

function nearestDuctEndpoint(duct: DuctEndpointEntity, target: Point2D): ResolvedDuctEndpoint {
  const [start, end] = resolveDuctEndpoints(duct);
  return distance(start.worldPosition, target) <= distance(end.worldPosition, target) ? start : end;
}

/**
 * Validate every persisted connection in the model graph (PRD §8).
 */
export function validateConnections(
  entities: Record<string, Entity>,
  options: ConnectionValidationOptions = {},
  edges: ConnectionEdge[] = buildConnectionEdges(entities)
): ConnectionValidationIssue[] {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const issues: ConnectionValidationIssue[] = [];
  const portResolutionCache = new Map<string, ResolvedConnectionPoint[]>();
  const usageByPort = new Map<string, number>();

  const resolvePorts = (objectId: string): ResolvedConnectionPoint[] => {
    if (!portResolutionCache.has(objectId)) {
      const object = entities[objectId];
      portResolutionCache.set(objectId, object ? resolveConnectableGeometry(object)?.connectionPoints ?? [] : []);
    }
    return portResolutionCache.get(objectId)!;
  };

  for (const edge of edges) {
    const { objectId, connectionPointId } = edge.connectionPoint;
    const object = entities[objectId];
    const duct = entities[edge.endpoint.entityId];

    // Orphaned: connected object or duct no longer exists.
    if (!object || !duct || !isDuctEntity(duct)) {
      issues.push({
        code: 'orphaned_connection',
        severity: 'error',
        message: !object
          ? `Connection references missing object ${objectId}.`
          : `Connection references missing or non-duct entity ${edge.endpoint.entityId}.`,
        objectId,
        connectionPointId,
        endpoint: edge.endpoint,
      });
      continue;
    }

    const port = resolvePorts(objectId).find((candidate) => candidate.id === connectionPointId);

    // Missing port: the connection id no longer resolves to a real port.
    if (!port) {
      issues.push({
        code: 'missing_port',
        severity: 'error',
        message: `Object ${objectId} has no connection point "${connectionPointId}".`,
        objectId,
        connectionPointId,
        endpoint: edge.endpoint,
      });
      continue;
    }

    // Track port usage for overuse detection.
    const usageKey = `${objectId}:${connectionPointId}`;
    usageByPort.set(usageKey, (usageByPort.get(usageKey) ?? 0) + 1);

    // Drift: endpoint must be coincident with the resolved port center.
    const endpoint = resolveDuctEndpoints(duct).find((candidate) => candidate.endpoint === edge.endpoint.endpoint);
    if (endpoint) {
      const drift = distance(endpoint.worldPosition, port.worldPosition);
      if (drift > config.coincidenceTolerance) {
        issues.push({
          code: 'drift',
          severity: 'error',
          message:
            `Duct ${duct.id} (${edge.endpoint.endpoint}) is ${drift.toFixed(2)}px from port ` +
            `"${connectionPointId}" (tolerance ${config.coincidenceTolerance}px).`,
          objectId,
          connectionPointId,
          endpoint: edge.endpoint,
          distance: drift,
        });
      }

      // Profile incompatibility: shape/size mismatch between endpoint and port.
      if (!isProfileCompatible(endpoint.connectionProfile, port.connectionProfile, config.sizeTolerance)) {
        issues.push({
          code: 'profile_mismatch',
          severity: 'warning',
          message:
            `Duct ${duct.id} profile (${describeProfile(endpoint.connectionProfile)}) is incompatible with ` +
            `port "${connectionPointId}" (${describeProfile(port.connectionProfile)}).`,
          objectId,
          connectionPointId,
          endpoint: edge.endpoint,
        });
      }
    }
  }

  // Overuse: more connections on a port than its capacity allows.
  for (const [usageKey, count] of usageByPort) {
    if (count > config.portCapacity) {
      const [objectId, connectionPointId] = usageKey.split(/:(.*)/s);
      issues.push({
        code: 'port_overuse',
        severity: 'error',
        message: `Port "${connectionPointId}" on ${objectId} has ${count} connections (max ${config.portCapacity}).`,
        objectId,
        connectionPointId,
      });
    }
  }

  return issues;
}

/**
 * Shape/size compatibility check between a duct endpoint and a port profile.
 * Unknown profiles are treated as compatible (cannot prove a mismatch).
 */
export function isProfileCompatible(a: ConnectionProfile, b: ConnectionProfile, sizeTolerance = 0.05): boolean {
  if (a.shape === 'unknown' || b.shape === 'unknown') {
    return true;
  }

  const roundLike = (shape: ConnectionProfile['shape']) => shape === 'round' || shape === 'flexible';
  if (roundLike(a.shape) && roundLike(b.shape)) {
    return withinRelative(a.diameter, b.diameter, sizeTolerance);
  }

  if (a.shape !== b.shape) {
    return false;
  }

  return withinRelative(a.width, b.width, sizeTolerance) && withinRelative(a.height, b.height, sizeTolerance);
}

function withinRelative(a: number | undefined, b: number | undefined, tolerance: number): boolean {
  if (a === undefined || b === undefined) {
    return true;
  }
  const larger = Math.max(Math.abs(a), Math.abs(b));
  if (larger === 0) {
    return true;
  }
  return Math.abs(a - b) / larger <= tolerance;
}

function describeProfile(profile: ConnectionProfile): string {
  if (profile.shape === 'round' || profile.shape === 'flexible') {
    return `${profile.shape} ø${profile.diameter ?? '?'}`;
  }
  if (profile.shape === 'rectangular' || profile.shape === 'flat_oval') {
    return `${profile.shape} ${profile.width ?? '?'}×${profile.height ?? '?'}`;
  }
  return profile.shape;
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
