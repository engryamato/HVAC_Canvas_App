import { feetToPixels } from '@/core/constants/coordinates';
import type { Duct, DuctRun, Entity, Equipment, Fitting, FittingPort, FittingType } from '@/core/schema';
import type { ConnectionPort } from '@/core/schema/equipment.schema';
import { getEquipmentPortWorldPosition } from '@/features/canvas/services/equipmentGeometry';
import { resolveFittingGeometry, applyDuctEndpointCutback, restoreDuctToDesign } from '@/features/canvas/services/connectionPoints';
import type { ResolvedConnectionPoint } from '@/features/canvas/services/connectionPoints';
import { isEnabled } from '@/core/flags/featureFlags';

type DuctLike = Duct | DuctRun;
type Point = { x: number; y: number };
type DuctEndpoint = {
  duct: DuctLike;
  end: 'start' | 'end';
  point: Point;
};
type EquipmentPortEndpoint = {
  equipment: Equipment;
  port: ConnectionPort;
  point: Point;
};

const SNAP_TOLERANCE_PX = feetToPixels(1);

export class ConnectionReconciliationService {
  static reconcile(entities: Record<string, Entity>): Record<string, Entity> {
    const next = cloneEntities(entities);
    const ducts = Object.values(next).filter((entity): entity is DuctLike => entity.type === 'duct' || entity.type === 'duct_run');
    const fittings = Object.values(next).filter((entity): entity is Fitting => entity.type === 'fitting');
    const equipment = Object.values(next).filter((entity): entity is Equipment => entity.type === 'equipment');

    for (const duct of ducts) {
      duct.props.connectedFrom = undefined;
      duct.props.connectedTo = undefined;
    }
    for (const fitting of fittings) {
      fitting.props.ports = undefined;
    }
    for (const item of equipment) {
      item.props.connectedDuctId = undefined;
      if (item.props.connectionPorts) {
        item.props.connectionPorts = item.props.connectionPorts.map((port) => ({
          ...port,
          connectedDuctId: undefined,
        }));
      }
    }

    const endpoints = ducts.flatMap((duct) => getDuctEndpoints(duct));

    reconcileEquipment(equipment, endpoints);
    reconcileDuctEndpoints(endpoints);
    reconcileFittings(fittings, endpoints);

    // WS6d: make fitting *detach* symmetric. A duct that was cut to a fitting
    // (rendered ≠ authored design centerline) but ended this pass with NO
    // connection — its fitting/equipment was removed — re-extends to its design
    // centerline instead of staying cut. Targeted at orphaned ducts only, so
    // split/merged/chained runs (which keep connectedFrom/To) are untouched.
    // No-op for plain ducts (no stored design centerline) and for ducts already
    // at their design centerline.
    if (isEnabled('WS6D_DESIGN_GEOMETRY')) {
      const connectedDuctIds = collectConnectedDuctIds(ducts, fittings, equipment);
      for (const duct of ducts) {
        if (!connectedDuctIds.has(duct.id)) {
          restoreDuctToDesign(duct);
        }
      }
    }

    return next;
  }
}

/** Duct IDs that ended the reconcile pass connected to another duct, a fitting, or equipment. */
function collectConnectedDuctIds(
  ducts: DuctLike[],
  fittings: Fitting[],
  equipment: Equipment[]
): Set<string> {
  const connected = new Set<string>();

  for (const duct of ducts) {
    if (duct.props.connectedFrom) {
      connected.add(duct.props.connectedFrom);
      connected.add(duct.id);
    }
    if (duct.props.connectedTo) {
      connected.add(duct.props.connectedTo);
      connected.add(duct.id);
    }
  }

  for (const fitting of fittings) {
    for (const point of fitting.props.connectionPoints ?? []) {
      if (point.ductId) {
        connected.add(point.ductId);
      }
    }
  }

  for (const item of equipment) {
    if (item.props.connectedDuctId) {
      connected.add(item.props.connectedDuctId);
    }
    for (const port of item.props.connectionPorts ?? []) {
      if (port.connectedDuctId) {
        connected.add(port.connectedDuctId);
      }
    }
  }

  return connected;
}

function cloneEntities(entities: Record<string, Entity>): Record<string, Entity> {
  return Object.fromEntries(
    Object.entries(entities).map(([id, entity]) => [
      id,
      {
        ...entity,
        props: {
          ...entity.props,
          ...(
            entity.type === 'equipment' && entity.props.connectionPorts
              ? { connectionPorts: entity.props.connectionPorts.map((port) => ({ ...port })) }
              : {}
          ),
        },
        ...('calculated' in entity ? { calculated: { ...entity.calculated } } : {}),
        ...('warnings' in entity && entity.warnings ? { warnings: { ...entity.warnings } } : {}),
      } as Entity,
    ])
  );
}

function reconcileEquipment(equipment: Equipment[], endpoints: DuctEndpoint[]): void {
  for (const item of equipment) {
    if (item.props.connectionPorts?.length) {
      reconcileEquipmentPorts(item, endpoints);
      continue;
    }

    const nearest = findNearestEndpoint({ x: item.transform.x, y: item.transform.y }, endpoints);
    if (!nearest) {
      continue;
    }

    item.props.connectedDuctId = nearest.duct.id;
    setDuctConnection(nearest, item.id);
  }
}

function reconcileEquipmentPorts(item: Equipment, endpoints: DuctEndpoint[]): void {
  const usedEndpointKeys = new Set<string>();
  const ports = getEquipmentPortEndpoints(item);

  for (const portEndpoint of ports) {
    const nearest = findNearestEndpoint(
      portEndpoint.point,
      endpoints.filter((endpoint) => !usedEndpointKeys.has(endpointKey(endpoint)))
    );
    if (!nearest) {
      continue;
    }

    portEndpoint.port.connectedDuctId = nearest.duct.id;
    item.props.connectedDuctId ??= nearest.duct.id;
    setDuctConnection(nearest, item.id);
    usedEndpointKeys.add(endpointKey(nearest));
  }
}

function reconcileDuctEndpoints(endpoints: DuctEndpoint[]): void {
  for (let i = 0; i < endpoints.length; i += 1) {
    for (let j = i + 1; j < endpoints.length; j += 1) {
      const first = endpoints[i]!;
      const second = endpoints[j]!;
      if (first.duct.id === second.duct.id || distance(first.point, second.point) > SNAP_TOLERANCE_PX) {
        continue;
      }

      if (first.end === 'end' && second.end === 'start') {
        first.duct.props.connectedTo = second.duct.id;
        second.duct.props.connectedFrom = first.duct.id;
      } else if (first.end === 'start' && second.end === 'end') {
        first.duct.props.connectedFrom = second.duct.id;
        second.duct.props.connectedTo = first.duct.id;
      }
    }
  }
}

function reconcileFittings(fittings: Fitting[], endpoints: DuctEndpoint[]): void {
  for (const fitting of fittings) {
    // PR-2 / PR-7: prefer matching duct endpoints to the fitting's resolved
    // connection points (the single source of truth for port geometry). This
    // records an explicit endpoint↔connectionPoint edge instead of treating the
    // fitting as one origin snap target.
    if (reconcileFittingByPorts(fitting, endpoints)) {
      continue;
    }

    // Legacy fallback: older topology where ducts meet at the fitting origin and
    // are not yet aligned to resolved ports. Kept so existing models keep
    // reconciling; new port-aligned connections take the path above.
    reconcileFittingByOrigin(fitting, endpoints);
  }
}

function reconcileFittingByPorts(fitting: Fitting, endpoints: DuctEndpoint[]): boolean {
  const ports = resolveFittingGeometry(fitting).connectionPoints;
  const used = new Set<DuctEndpoint>();
  const matches: { port: ResolvedConnectionPoint; portIndex: number; endpoint: DuctEndpoint }[] = [];

  ports.forEach((port, portIndex) => {
    let best: DuctEndpoint | null = null;
    let bestDistance = Infinity;
    for (const endpoint of endpoints) {
      if (used.has(endpoint)) {
        continue;
      }
      const candidate = distance(endpoint.point, port.worldPosition);
      if (candidate <= SNAP_TOLERANCE_PX && candidate < bestDistance) {
        best = endpoint;
        bestDistance = candidate;
      }
    }
    if (best) {
      used.add(best);
      matches.push({ port, portIndex, endpoint: best });
    }
  });

  if (matches.length === 0) {
    return false;
  }

  // Duct cutback (PR-8): pin each connected duct endpoint exactly onto its
  // resolved port opening so the run terminates at the fitting body instead of
  // running beneath it. Idempotent — endpoints already on the opening are left
  // untouched. Runs in the committed pipeline, so it covers draw-to-port,
  // drop-on-duct, and re-trim when a fitting or duct is moved.
  for (const { port, endpoint } of matches) {
    const changed = applyDuctEndpointCutback(endpoint.duct, endpoint.end, port.worldPosition);
    if (changed) {
      endpoint.point = { x: port.worldPosition.x, y: port.worldPosition.y };
    }
  }

  fitting.props.ports = matches.map(({ port, endpoint }) => buildFittingPort(fitting, port.role, endpoint));
  fitting.props.connectionPoints = matches.map(({ endpoint, portIndex }) => ({
    ductId: endpoint.duct.id,
    pointIndex: portIndex,
  }));

  applyDuctConnections(fitting, fitting.props.ports, matches.map((match) => match.endpoint));
  return true;
}

function reconcileFittingByOrigin(fitting: Fitting, endpoints: DuctEndpoint[]): void {
  const fittingPoint = { x: fitting.transform.x, y: fitting.transform.y };
  const connected = endpoints
    .filter((endpoint) => distance(endpoint.point, fittingPoint) <= SNAP_TOLERANCE_PX)
    .sort((a, b) => {
      const endSort = endPriority(a.end) - endPriority(b.end);
      return endSort !== 0 ? endSort : a.duct.id.localeCompare(b.duct.id);
    });

  if (connected.length === 0) {
    return;
  }

  const hasIndexedConnectionPoints = fitting.props.connectionPoints?.some(
    (point) => typeof point.pointIndex === 'number'
  );
  if (!hasIndexedConnectionPoints) {
    fitting.props.ports = connected.map((endpoint, index) =>
      buildFittingPort(fitting, roleForPort(fitting.props.fittingType, endpoint, index), endpoint)
    );
    applyDuctConnections(fitting, fitting.props.ports, connected);
    return;
  }

  const resolvedPorts = resolveFittingGeometry(fitting).connectionPoints;
  const assignments = assignOriginEndpointsToPorts(fitting, connected, resolvedPorts);

  for (const assignment of assignments) {
    if (!assignment.port) {
      continue;
    }

    const changed = applyDuctEndpointCutback(assignment.endpoint.duct, assignment.endpoint.end, assignment.port.worldPosition);
    if (changed) {
      assignment.endpoint.point = { x: assignment.port.worldPosition.x, y: assignment.port.worldPosition.y };
    }
  }

  fitting.props.ports = assignments.map((assignment, index) =>
    buildFittingPort(
      fitting,
      assignment.port?.role ?? roleForPort(fitting.props.fittingType, assignment.endpoint, index),
      assignment.endpoint
    )
  );
  fitting.props.connectionPoints = assignments
    .filter((assignment): assignment is OriginPortAssignment & { port: ResolvedConnectionPoint; portIndex: number } =>
      Boolean(assignment.port) && typeof assignment.portIndex === 'number'
    )
    .map((assignment) => ({
      ductId: assignment.endpoint.duct.id,
      pointIndex: assignment.portIndex,
    }));

  applyDuctConnections(fitting, fitting.props.ports, assignments.map((assignment) => assignment.endpoint));
}

type OriginPortAssignment = {
  endpoint: DuctEndpoint;
  port?: ResolvedConnectionPoint;
  portIndex?: number;
};

function assignOriginEndpointsToPorts(
  fitting: Fitting,
  connected: DuctEndpoint[],
  ports: ResolvedConnectionPoint[]
): OriginPortAssignment[] {
  if (ports.length === 0) {
    return connected.map((endpoint) => ({ endpoint }));
  }

  const usedPortIndexes = new Set<number>();

  return connected.map((endpoint, index) => {
    const persistedIndex = fitting.props.connectionPoints?.find((point) => point.ductId === endpoint.duct.id)?.pointIndex;
    if (
      typeof persistedIndex === 'number' &&
      ports[persistedIndex] &&
      !usedPortIndexes.has(persistedIndex)
    ) {
      usedPortIndexes.add(persistedIndex);
      return { endpoint, port: ports[persistedIndex], portIndex: persistedIndex };
    }

    const desiredRole = roleForPort(fitting.props.fittingType, endpoint, index);
    const roleMatchIndex = ports.findIndex(
      (port, portIndex) =>
        !usedPortIndexes.has(portIndex) && portMatchesRole(fitting.props.fittingType, port.role, desiredRole)
    );
    if (roleMatchIndex >= 0) {
      usedPortIndexes.add(roleMatchIndex);
      return { endpoint, port: ports[roleMatchIndex], portIndex: roleMatchIndex };
    }

    const fallbackIndex = ports.findIndex((_port, portIndex) => !usedPortIndexes.has(portIndex));
    if (fallbackIndex >= 0) {
      usedPortIndexes.add(fallbackIndex);
      return { endpoint, port: ports[fallbackIndex], portIndex: fallbackIndex };
    }

    return { endpoint };
  });
}

function portMatchesRole(fittingType: FittingType, portRole: string, fittingPortRole: FittingPort['role']): boolean {
  if (portRole === 'inlet') {
    return fittingPortRole === 'inlet';
  }
  if (portRole === 'branch' || portRole === 'branch_out') {
    return fittingPortRole === 'branch_out';
  }
  if (portRole === 'outlet' || portRole === 'straight_out') {
    return fittingPortRole === (fittingType === 'tee' ? 'straight_out' : 'outlet');
  }
  return portRole === fittingPortRole;
}

function buildFittingPort(fitting: Fitting, role: string, endpoint: DuctEndpoint): FittingPort {
  const normalized = normalizeFittingPortRole(fitting.props.fittingType, role, endpoint);
  return {
    id: `${fitting.id}-${endpoint.duct.id}-${endpoint.end}`,
    role: normalized,
    direction: normalized === 'inlet' ? 'in' : 'out',
    connectedDuctRunId: endpoint.duct.id,
    connectedEnd: endpoint.end,
  } satisfies FittingPort;
}

/** Map a resolved port role ('inlet'|'outlet'|'branch') to a FittingPort role. */
function normalizeFittingPortRole(
  fittingType: FittingType,
  role: string,
  endpoint: DuctEndpoint
): FittingPort['role'] {
  if (role === 'inlet') {
    return 'inlet';
  }
  if (role === 'branch' || role === 'branch_out') {
    return 'branch_out';
  }
  if (role === 'outlet' || role === 'straight_out') {
    return fittingType === 'tee' ? 'straight_out' : 'outlet';
  }
  // Already a FittingPort role (legacy callers pass roleForPort output through).
  return role as FittingPort['role'];
}

function applyDuctConnections(fitting: Fitting, ports: FittingPort[], endpoints: DuctEndpoint[]): void {
  for (const port of ports) {
    const duct = endpoints.find((endpoint) => endpoint.duct.id === port.connectedDuctRunId)?.duct;
    if (!duct) {
      continue;
    }
    if (port.direction === 'in') {
      duct.props.connectedTo = fitting.id;
    } else {
      duct.props.connectedFrom = fitting.id;
    }
  }
}

function endPriority(end: 'start' | 'end'): number {
  return end === 'end' ? 0 : 1;
}

function roleForPort(fittingType: FittingType, endpoint: DuctEndpoint, index: number): FittingPort['role'] {
  if (endpoint.end === 'end' || index === 0) {
    return 'inlet';
  }

  if (fittingType === 'tee') {
    return index === 1 ? 'straight_out' : 'branch_out';
  }

  if (fittingType === 'wye') {
    return 'branch_out';
  }

  return 'outlet';
}

function setDuctConnection(endpoint: DuctEndpoint, connectedEntityId: string): void {
  if (endpoint.end === 'start') {
    endpoint.duct.props.connectedFrom = connectedEntityId;
  } else {
    endpoint.duct.props.connectedTo = connectedEntityId;
  }
}

function getEquipmentPortEndpoints(equipment: Equipment): EquipmentPortEndpoint[] {
  return (equipment.props.connectionPorts ?? []).map((port) => ({
    equipment,
    port,
    point: getEquipmentPortWorldPosition(port, equipment),
  }));
}

function endpointKey(endpoint: DuctEndpoint): string {
  return `${endpoint.duct.id}:${endpoint.end}`;
}

function findNearestEndpoint(point: Point, endpoints: DuctEndpoint[]): DuctEndpoint | null {
  let nearest: DuctEndpoint | null = null;
  let nearestDistance = Infinity;

  for (const endpoint of endpoints) {
    const candidateDistance = distance(point, endpoint.point);
    if (candidateDistance <= SNAP_TOLERANCE_PX && candidateDistance < nearestDistance) {
      nearest = endpoint;
      nearestDistance = candidateDistance;
    }
  }

  return nearest;
}

function getDuctEndpoints(duct: DuctLike): DuctEndpoint[] {
  const start = getDuctStart(duct);
  const end = getDuctEnd(duct, start);

  return [
    { duct, end: 'start', point: start },
    { duct, end: 'end', point: end },
  ];
}

function getDuctStart(duct: DuctLike): Point {
  if (duct.type === 'duct_run' && duct.props.startPoint) {
    return duct.props.startPoint;
  }

  return { x: duct.transform.x, y: duct.transform.y };
}

function getDuctEnd(duct: DuctLike, start: Point): Point {
  if (duct.type === 'duct_run' && duct.props.endPoint) {
    return duct.props.endPoint;
  }

  const lengthFeet = duct.type === 'duct_run' ? duct.props.installLength : duct.props.length;
  const radians = ((duct.transform.rotation ?? 0) * Math.PI) / 180;
  const lengthPx = feetToPixels(lengthFeet);
  return {
    x: start.x + Math.cos(radians) * lengthPx,
    y: start.y + Math.sin(radians) * lengthPx,
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
