import { describe, it, expect } from 'vitest';
import {
  distance,
  distanceSquared,
  clamp,
  snapToGrid,
  snapPointToGrid,
  degreesToRadians,
  radiansToDegrees,
  lerp,
  lerpPoint,
  normalizeAngle,
  angleBetweenPoints,
  rotatePoint,
  addPoints,
  subtractPoints,
  scalePoint,
  approximately,
} from '../math';

describe('distance', () => {
  it('should calculate distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    expect(distance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5);
  });
});

describe('distanceSquared', () => {
  it('should calculate squared distance', () => {
    expect(distanceSquared({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
  });
});

describe('clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('snapToGrid', () => {
  it('should snap value to nearest grid', () => {
    expect(snapToGrid(12, 10)).toBe(10);
    expect(snapToGrid(17, 10)).toBe(20);
    expect(snapToGrid(15, 10)).toBe(20);
    expect(snapToGrid(14, 10)).toBe(10);
  });

  it('should handle zero grid size', () => {
    expect(snapToGrid(12, 0)).toBe(12);
  });
});

describe('snapPointToGrid', () => {
  it('should snap point to grid', () => {
    const result = snapPointToGrid({ x: 12, y: 17 }, 10);
    expect(result).toEqual({ x: 10, y: 20 });
  });
});

describe('degreesToRadians', () => {
  it('should convert degrees to radians', () => {
    expect(degreesToRadians(0)).toBe(0);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    expect(degreesToRadians(360)).toBeCloseTo(Math.PI * 2);
  });
});

describe('radiansToDegrees', () => {
  it('should convert radians to degrees', () => {
    expect(radiansToDegrees(0)).toBe(0);
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
    expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
  });
});

describe('lerp', () => {
  it('should interpolate between values', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});

describe('lerpPoint', () => {
  it('should interpolate between points', () => {
    const result = lerpPoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5);
    expect(result).toEqual({ x: 5, y: 10 });
  });
});

describe('normalizeAngle', () => {
  it('should normalize angle to 0-360', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(-360)).toBe(0);
  });
});

describe('angleBetweenPoints', () => {
  it('should calculate angle between points', () => {
    expect(angleBetweenPoints({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0);
    expect(angleBetweenPoints({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe(90);
    expect(angleBetweenPoints({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe(180);
  });
});

describe('rotatePoint', () => {
  it('should rotate point around origin', () => {
    const result = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, 90);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
  });
});

describe('addPoints', () => {
  it('should add two points', () => {
    expect(addPoints({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });
});

describe('subtractPoints', () => {
  it('should subtract two points', () => {
    expect(subtractPoints({ x: 5, y: 7 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
  });
});

describe('scalePoint', () => {
  it('should scale a point', () => {
    expect(scalePoint({ x: 2, y: 3 }, 2)).toEqual({ x: 4, y: 6 });
  });
});

describe('approximately', () => {
  it('should check approximate equality', () => {
    expect(approximately(1.0, 1.00001)).toBe(true);
    expect(approximately(1.0, 1.001)).toBe(false);
    expect(approximately(1.0, 1.001, 0.01)).toBe(true);
  });
});

