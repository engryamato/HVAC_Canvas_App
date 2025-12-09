/**
 * Bounds utilities for hit testing and selection
 */

import type { Point } from './math';

/**
 * Axis-aligned bounding box
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get center point of bounds
 */
export function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

/**
 * Check if point is inside bounds
 */
export function boundsContainsPoint(bounds: Bounds, point: Point): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * Check if two bounds intersect
 */
export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Check if bounds A fully contains bounds B
 */
export function boundsContainsBounds(outer: Bounds, inner: Bounds): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Merge multiple bounds into one containing all
 * Returns null if array is empty
 */
export function mergeBounds(boundsArray: Bounds[]): Bounds | null {
  if (boundsArray.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const bounds of boundsArray) {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Expand bounds by a padding amount
 */
export function expandBounds(bounds: Bounds, padding: number): Bounds {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

/**
 * Create bounds from two corner points
 */
export function boundsFromPoints(p1: Point, p2: Point): Bounds {
  const minX = Math.min(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxX = Math.max(p1.x, p2.x);
  const maxY = Math.max(p1.y, p2.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Get the four corner points of bounds
 */
export function getBoundsCorners(bounds: Bounds): [Point, Point, Point, Point] {
  return [
    { x: bounds.x, y: bounds.y }, // top-left
    { x: bounds.x + bounds.width, y: bounds.y }, // top-right
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // bottom-right
    { x: bounds.x, y: bounds.y + bounds.height }, // bottom-left
  ];
}

/**
 * Get the area of bounds
 */
export function getBoundsArea(bounds: Bounds): number {
  return bounds.width * bounds.height;
}

/**
 * Check if bounds has zero or negative dimensions
 */
export function isEmptyBounds(bounds: Bounds): boolean {
  return bounds.width <= 0 || bounds.height <= 0;
}

/**
 * Translate bounds by an offset
 */
export function translateBounds(bounds: Bounds, offset: Point): Bounds {
  return {
    x: bounds.x + offset.x,
    y: bounds.y + offset.y,
    width: bounds.width,
    height: bounds.height,
  };
}

/**
 * Scale bounds from center
 */
export function scaleBounds(bounds: Bounds, scale: number): Bounds {
  const center = getBoundsCenter(bounds);
  const newWidth = bounds.width * scale;
  const newHeight = bounds.height * scale;

  return {
    x: center.x - newWidth / 2,
    y: center.y - newHeight / 2,
    width: newWidth,
    height: newHeight,
  };
}

