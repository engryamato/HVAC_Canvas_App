import type { Duct } from '@/core/schema';
import { feetToPixels, inchesToPixels } from '@/core/constants/coordinates';
import type { Bounds } from '@/core/geometry/bounds';

type Point = {
  x: number;
  y: number;
};

export function getLegacyDuctCanvasBounds(duct: Duct): Bounds {
  const { x, y, rotation } = duct.transform;
  const lengthPx = feetToPixels(duct.props.length);
  const thicknessPx = resolveDuctThicknessPx(duct);
  const radians = ((rotation ?? 0) * Math.PI) / 180;

  const direction = {
    x: Math.cos(radians),
    y: Math.sin(radians),
  };

  const normal = {
    x: -direction.y,
    y: direction.x,
  };

  const start: Point = { x, y };
  const end: Point = {
    x: x + direction.x * lengthPx,
    y: y + direction.y * lengthPx,
  };

  const halfThickness = thicknessPx / 2;
  const corners = [
    offsetPoint(start, normal, halfThickness),
    offsetPoint(end, normal, halfThickness),
    offsetPoint(end, normal, -halfThickness),
    offsetPoint(start, normal, -halfThickness),
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const corner of corners) {
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function resolveDuctThicknessPx(duct: Duct): number {
  if (duct.props.shape === 'round' && typeof duct.props.diameter === 'number') {
    return inchesToPixels(duct.props.diameter);
  }

  if (typeof duct.props.width === 'number') {
    return inchesToPixels(duct.props.width);
  }

  if (typeof duct.props.height === 'number') {
    return inchesToPixels(duct.props.height);
  }

  return inchesToPixels(10);
}

function offsetPoint(point: Point, normal: Point, distance: number): Point {
  return {
    x: point.x + normal.x * distance,
    y: point.y + normal.y * distance,
  };
}
