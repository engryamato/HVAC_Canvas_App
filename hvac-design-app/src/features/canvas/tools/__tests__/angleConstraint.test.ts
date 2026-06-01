import { describe, expect, it } from 'vitest';
import { constrainAngleToStep, getAngleDegrees } from '../angleConstraint';

function pointAt(angleDeg: number, length = 100): { x: number; y: number } {
  const radians = angleDeg * (Math.PI / 180);
  return {
    x: length * Math.cos(radians),
    y: length * Math.sin(radians),
  };
}

describe('constrainAngleToStep', () => {
  it('snaps 47 degrees to 45 degrees at a 15 degree step', () => {
    const end = constrainAngleToStep({ x: 0, y: 0 }, pointAt(47), 15);

    expect(getAngleDegrees({ x: 0, y: 0 }, end)).toBeCloseTo(45, 6);
  });

  it('snaps 47 degrees to 47 degrees at a 1 degree step', () => {
    const end = constrainAngleToStep({ x: 0, y: 0 }, pointAt(47), 1);

    expect(getAngleDegrees({ x: 0, y: 0 }, end)).toBeCloseTo(47, 6);
  });

  it('preserves cursor distance', () => {
    const cursor = { x: 28, y: 96 };
    const end = constrainAngleToStep({ x: 0, y: 0 }, cursor, 15);

    expect(Math.hypot(end.x, end.y)).toBeCloseTo(Math.hypot(cursor.x, cursor.y), 6);
  });

  it.each([
    [44, 45],
    [136, 135],
    [224, 225],
    [316, 315],
  ])('snaps quadrant angle %d degrees to %d degrees', (inputAngle, expectedAngle) => {
    const end = constrainAngleToStep({ x: 0, y: 0 }, pointAt(inputAngle), 15);

    expect(getAngleDegrees({ x: 0, y: 0 }, end)).toBeCloseTo(expectedAngle, 6);
  });

  it('returns the start point for zero-length input', () => {
    const start = { x: 12, y: 34 };

    expect(constrainAngleToStep(start, start, 15)).toEqual(start);
  });

  it('wraps 352 degrees to 0 degrees', () => {
    const end = constrainAngleToStep({ x: 0, y: 0 }, pointAt(352), 15);

    expect(getAngleDegrees({ x: 0, y: 0 }, end)).toBeCloseTo(0, 6);
  });
});
