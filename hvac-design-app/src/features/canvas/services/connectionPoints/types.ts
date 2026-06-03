import type { Entity } from '@/core/schema';

export type ConnectableObjectType = 'fitting' | 'equipment';
export type ConnectionPointStatus = 'available' | 'occupied' | 'blocked';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * WS6e E1 — the formalized cross-section contract a resolver consumes and
 * produces for a single port/endpoint: shape + size (diameter / W×H / equivalent
 * diameter). Geometry resolvers (E2–E5) read this to build variant-aware
 * geometry; {@link resolveConnectionCompatibility} reads it to enforce §9D via
 * the WS10 shape-compatibility matrix.
 */
export interface ConnectionProfile {
  shape: 'round' | 'rectangular' | 'flat_oval' | 'flexible' | 'unknown';
  diameter?: number;
  width?: number;
  height?: number;
  /** Equivalent round diameter (in.) — used for round↔non-round size comparison. */
  equivalentDiameter?: number;
}

export interface EndpointRef {
  entityId: string;
  entityType: 'duct' | 'duct_run';
  endpoint: 'start' | 'end';
}

export interface ConnectionPointRef {
  objectId: string;
  connectionPointId: string;
}

export interface ConnectionEdge {
  endpoint: EndpointRef;
  connectionPoint: ConnectionPointRef;
}

export interface ResolvedDuctEndpoint extends EndpointRef {
  worldPosition: Point2D;
  facingDirection: Point2D;
  connectionProfile: ConnectionProfile;
}

export interface ResolvedConnectionPoint {
  id: string;
  objectId: string;
  objectType: ConnectableObjectType;
  role?: string;
  label?: string;
  localPosition: Point2D;
  worldPosition: Point2D;
  facingDirection: Point2D;
  connectionProfile: ConnectionProfile;
  status: ConnectionPointStatus;
  connectedTo?: EndpointRef[];
}

export interface ResolvedConnectableGeometry {
  objectId: string;
  objectType: ConnectableObjectType;
  sourceEntity: Entity;
  anchor?: {
    localPosition: Point2D;
    worldPosition: Point2D;
  };
  connectionPoints: ResolvedConnectionPoint[];
  occupiedBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
