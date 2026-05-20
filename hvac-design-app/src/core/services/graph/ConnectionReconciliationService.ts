import { feetToPixels } from '@/core/constants/coordinates';
import type { Duct, DuctRun, Entity, Equipment, Fitting, FittingPort, FittingType } from '@/core/schema';

type DuctLike = Duct | DuctRun;
type Point = { x: number; y: number };
type DuctEndpoint = {
  duct: DuctLike;
  end: 'start' | 'end';
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
    }

    const endpoints = ducts.flatMap((duct) => getDuctEndpoints(duct));

    reconcileEquipment(equipment, endpoints);
    reconcileDuctEndpoints(endpoints);
    reconcileFittings(fittings, endpoints);

    return next;
  }
}

function cloneEntities(entities: Record<string, Entity>): Record<string, Entity> {
  return Object.fromEntries(
    Object.entries(entities).map(([id, entity]) => [
      id,
      {
        ...entity,
        props: { ...entity.props },
        ...('calculated' in entity ? { calculated: { ...entity.calculated } } : {}),
        ...('warnings' in entity && entity.warnings ? { warnings: { ...entity.warnings } } : {}),
      } as Entity,
    ])
  );
}

function reconcileEquipment(equipment: Equipment[], endpoints: DuctEndpoint[]): void {
  for (const item of equipment) {
    const nearest = findNearestEndpoint({ x: item.transform.x, y: item.transform.y }, endpoints);
    if (!nearest) {
      continue;
    }

    item.props.connectedDuctId = nearest.duct.id;
    setDuctConnection(nearest, item.id);
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
    const fittingPoint = { x: fitting.transform.x, y: fitting.transform.y };
    const connected = endpoints
      .filter((endpoint) => distance(endpoint.point, fittingPoint) <= SNAP_TOLERANCE_PX)
      .sort((a, b) => {
        const endSort = endPriority(a.end) - endPriority(b.end);
        return endSort !== 0 ? endSort : a.duct.id.localeCompare(b.duct.id);
      });

    if (connected.length === 0) {
      continue;
    }

    fitting.props.ports = connected.map((endpoint, index) => {
      const role = roleForPort(fitting.props.fittingType, endpoint, index);
      return {
        id: `${fitting.id}-${endpoint.duct.id}-${endpoint.end}`,
        role,
        direction: role === 'inlet' ? 'in' : 'out',
        connectedDuctRunId: endpoint.duct.id,
        connectedEnd: endpoint.end,
      } satisfies FittingPort;
    });

    for (const port of fitting.props.ports) {
      const duct = connected.find((endpoint) => endpoint.duct.id === port.connectedDuctRunId)?.duct;
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
