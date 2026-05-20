import type { Duct, DuctRun } from '@/core/schema';
import { getDuctStartAndEnd, type DuctLike } from '@/features/canvas/services/ductGeometryHelpers';

export type DuctConnectionEntity = Duct | DuctRun;

export type DuctProfile = {
  shape: 'round' | 'rectangular';
  equivalentDiameter: number;
  diameter?: number;
  width?: number;
  height?: number;
};

export type DuctConnectionEndpoint = {
  ductId: string;
  point: { x: number; y: number };
  endPoint: 'start' | 'end';
  angle: number;
  profile: DuctProfile;
};

const DEFAULT_SIZE = 12;

export function getDuctProfile(duct: DuctLike): DuctProfile {
  if (duct.type === 'duct') {
    if (duct.props.shape === 'round') {
      const diameter = duct.props.diameter ?? DEFAULT_SIZE;
      return { shape: 'round', equivalentDiameter: diameter, diameter };
    }

    return createRectangularProfile(duct.props.width ?? DEFAULT_SIZE, duct.props.height ?? 8);
  }

  if (duct.props.shape === 'round' || duct.props.shape === 'flexible') {
    const diameter = 'diameter' in duct.props ? (duct.props.diameter ?? DEFAULT_SIZE) : DEFAULT_SIZE;
    return { shape: 'round', equivalentDiameter: diameter, diameter };
  }

  const width = 'width' in duct.props ? (duct.props.width ?? DEFAULT_SIZE) : DEFAULT_SIZE;
  const height = 'height' in duct.props ? (duct.props.height ?? 8) : 8;
  return createRectangularProfile(width, height);
}

export function getDuctConnectionEndpoints(duct: DuctConnectionEntity): DuctConnectionEndpoint[] {
  const { start, end } = getDuctStartAndEnd(duct);
  const profile = getDuctProfile(duct);

  return [
    {
      ductId: duct.id,
      endPoint: 'start',
      point: start,
      angle: normalizeAngle(duct.transform.rotation ?? 0),
      profile,
    },
    {
      ductId: duct.id,
      endPoint: 'end',
      point: end,
      angle: normalizeAngle(duct.transform.rotation ?? 0),
      profile,
    },
  ];
}

export function calculateAngleDifference(a: number, b: number): number {
  let diff = Math.abs(normalizeAngle(a) - normalizeAngle(b)) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

export function isStraightConnectionAngle(angle: number, tolerance = 15): boolean {
  return angle <= tolerance || angle >= 180 - tolerance;
}

export function detectDuctProfileChange(from: DuctProfile, to: DuctProfile): boolean {
  return (
    from.shape !== to.shape ||
    Math.abs(from.equivalentDiameter - to.equivalentDiameter) > 1 ||
    Math.abs((from.width ?? 0) - (to.width ?? 0)) > 1 ||
    Math.abs((from.height ?? 0) - (to.height ?? 0)) > 1
  );
}

export function areConnectionPointsWithinTolerance(
  first: { point: { x: number; y: number } },
  second: { point: { x: number; y: number } },
  tolerance: number
): boolean {
  return Math.hypot(first.point.x - second.point.x, first.point.y - second.point.y) <= tolerance;
}

function createRectangularProfile(width: number, height: number): DuctProfile {
  const equivalentDiameter = hydraulicEquivalentDiameter(width, height);
  return { shape: 'rectangular', equivalentDiameter, width, height };
}

function hydraulicEquivalentDiameter(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return DEFAULT_SIZE;
  }

  const numerator = Math.pow(width * height, 0.625);
  const denominator = Math.pow(width + height, 0.25);
  return 1.30 * (numerator / denominator);
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}
