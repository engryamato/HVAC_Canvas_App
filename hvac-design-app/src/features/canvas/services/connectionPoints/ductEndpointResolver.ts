import { feetToPixels } from '@/core/constants/coordinates';
import type { Duct, DuctRun } from '@/core/schema';
import type { ConnectionProfile, Point2D, ResolvedDuctEndpoint } from './types';

export type DuctEndpointEntity = Duct | DuctRun;

export function resolveDuctEndpoints(duct: DuctEndpointEntity): ResolvedDuctEndpoint[] {
  const { start, end } = getStartAndEnd(duct);
  const direction = normalize({ x: end.x - start.x, y: end.y - start.y });
  const profile = resolveDuctEndpointProfile(duct);

  return [
    {
      entityId: duct.id,
      entityType: duct.type,
      endpoint: 'start',
      worldPosition: start,
      facingDirection: { x: -direction.x, y: -direction.y },
      connectionProfile: profile,
    },
    {
      entityId: duct.id,
      entityType: duct.type,
      endpoint: 'end',
      worldPosition: end,
      facingDirection: direction,
      connectionProfile: profile,
    },
  ];
}

function getStartAndEnd(duct: DuctEndpointEntity): { start: Point2D; end: Point2D } {
  if (duct.type === 'duct_run') {
    const start = duct.props.startPoint ?? { x: duct.transform.x, y: duct.transform.y };
    const end = duct.props.endPoint ?? projectEnd(start, duct.transform.rotation, duct.props.installLength);
    return { start, end };
  }

  const start = { x: duct.transform.x, y: duct.transform.y };
  return {
    start,
    end: projectEnd(start, duct.transform.rotation, duct.props.length),
  };
}

function projectEnd(start: Point2D, rotation: number, lengthFeet: number): Point2D {
  const radians = (rotation * Math.PI) / 180;
  const lengthPixels = feetToPixels(lengthFeet);
  return {
    x: round(start.x + Math.cos(radians) * lengthPixels),
    y: round(start.y + Math.sin(radians) * lengthPixels),
  };
}

function resolveDuctEndpointProfile(duct: DuctEndpointEntity): ConnectionProfile {
  const props = duct.props;
  if (props.shape === 'round' || props.shape === 'flexible') {
    return { shape: props.shape, diameter: 'diameter' in props ? props.diameter : undefined };
  }

  if (props.shape === 'rectangular' || props.shape === 'flat_oval') {
    return {
      shape: props.shape,
      width: 'width' in props ? props.width : undefined,
      height: 'height' in props ? props.height : undefined,
    };
  }

  return { shape: 'unknown' };
}

function normalize(vector: Point2D): Point2D {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: round(vector.x / length),
    y: round(vector.y / length),
  };
}

function round(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
