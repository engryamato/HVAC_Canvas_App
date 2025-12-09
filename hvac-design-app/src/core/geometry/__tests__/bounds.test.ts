import { describe, it, expect } from 'vitest';
import {
  getBoundsCenter,
  boundsContainsPoint,
  boundsIntersect,
  boundsContainsBounds,
  mergeBounds,
  expandBounds,
  boundsFromPoints,
  getBoundsCorners,
  getBoundsArea,
  isEmptyBounds,
  translateBounds,
  scaleBounds,
} from '../bounds';

describe('getBoundsCenter', () => {
  it('should return center of bounds', () => {
    const center = getBoundsCenter({ x: 0, y: 0, width: 100, height: 50 });
    expect(center).toEqual({ x: 50, y: 25 });
  });

  it('should handle offset bounds', () => {
    const center = getBoundsCenter({ x: 10, y: 20, width: 100, height: 50 });
    expect(center).toEqual({ x: 60, y: 45 });
  });
});

describe('boundsContainsPoint', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 };

  it('should return true for point inside', () => {
    expect(boundsContainsPoint(bounds, { x: 50, y: 50 })).toBe(true);
  });

  it('should return true for point on edge', () => {
    expect(boundsContainsPoint(bounds, { x: 0, y: 0 })).toBe(true);
    expect(boundsContainsPoint(bounds, { x: 100, y: 100 })).toBe(true);
  });

  it('should return false for point outside', () => {
    expect(boundsContainsPoint(bounds, { x: -1, y: 50 })).toBe(false);
    expect(boundsContainsPoint(bounds, { x: 101, y: 50 })).toBe(false);
  });
});

describe('boundsIntersect', () => {
  it('should return true for overlapping bounds', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(boundsIntersect(a, b)).toBe(true);
  });

  it('should return true for touching bounds', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 100, y: 0, width: 100, height: 100 };
    expect(boundsIntersect(a, b)).toBe(true);
  });

  it('should return false for non-overlapping bounds', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 200, width: 100, height: 100 };
    expect(boundsIntersect(a, b)).toBe(false);
  });
});

describe('boundsContainsBounds', () => {
  it('should return true when outer contains inner', () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const inner = { x: 10, y: 10, width: 50, height: 50 };
    expect(boundsContainsBounds(outer, inner)).toBe(true);
  });

  it('should return false when inner extends outside', () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const inner = { x: 50, y: 50, width: 100, height: 100 };
    expect(boundsContainsBounds(outer, inner)).toBe(false);
  });
});

describe('mergeBounds', () => {
  it('should merge multiple bounds', () => {
    const bounds = [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 100, y: 100, width: 50, height: 50 },
    ];
    const merged = mergeBounds(bounds);
    expect(merged).toEqual({ x: 0, y: 0, width: 150, height: 150 });
  });

  it('should return null for empty array', () => {
    expect(mergeBounds([])).toBeNull();
  });
});

describe('expandBounds', () => {
  it('should expand bounds by padding', () => {
    const bounds = { x: 10, y: 10, width: 100, height: 100 };
    const expanded = expandBounds(bounds, 5);
    expect(expanded).toEqual({ x: 5, y: 5, width: 110, height: 110 });
  });
});

describe('boundsFromPoints', () => {
  it('should create bounds from two points', () => {
    const bounds = boundsFromPoints({ x: 10, y: 20 }, { x: 110, y: 70 });
    expect(bounds).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('should handle reversed points', () => {
    const bounds = boundsFromPoints({ x: 110, y: 70 }, { x: 10, y: 20 });
    expect(bounds).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });
});

describe('getBoundsCorners', () => {
  it('should return four corners', () => {
    const corners = getBoundsCorners({ x: 0, y: 0, width: 100, height: 50 });
    expect(corners).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ]);
  });
});

describe('getBoundsArea', () => {
  it('should calculate area', () => {
    expect(getBoundsArea({ x: 0, y: 0, width: 10, height: 5 })).toBe(50);
  });
});

describe('isEmptyBounds', () => {
  it('should return true for zero dimensions', () => {
    expect(isEmptyBounds({ x: 0, y: 0, width: 0, height: 100 })).toBe(true);
    expect(isEmptyBounds({ x: 0, y: 0, width: 100, height: 0 })).toBe(true);
  });

  it('should return false for positive dimensions', () => {
    expect(isEmptyBounds({ x: 0, y: 0, width: 100, height: 100 })).toBe(false);
  });
});

describe('translateBounds', () => {
  it('should translate bounds by offset', () => {
    const bounds = { x: 10, y: 20, width: 100, height: 50 };
    const translated = translateBounds(bounds, { x: 5, y: -10 });
    expect(translated).toEqual({ x: 15, y: 10, width: 100, height: 50 });
  });
});

describe('scaleBounds', () => {
  it('should scale bounds from center', () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };
    const scaled = scaleBounds(bounds, 2);
    expect(scaled).toEqual({ x: -50, y: -50, width: 200, height: 200 });
  });
});

