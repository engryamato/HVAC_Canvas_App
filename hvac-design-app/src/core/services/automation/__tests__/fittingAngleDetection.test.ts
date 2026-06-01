import { describe, expect, it } from 'vitest';
import { FittingInsertionService } from '../fittingInsertionService';

// Minimal ConnectionPoint stubs: analyzeMultiDuctJunction only reads ductId,
// angle, and (for 2-port size detection) profile.
function cp(ductId: string, angle: number) {
  return {
    ductId,
    endPoint: 'end' as const,
    point: { x: 0, y: 0 },
    angle,
    profile: { shape: 'round' as const, equivalentDiameter: 12, diameter: 12, width: 12, height: 12 },
    diameter: 12,
    width: 12,
    height: 12,
  };
}

describe('fitting angle detection from centerlines', () => {
  it('stores the true elbow turn angle (not snapped to 45/90)', () => {
    const junction = FittingInsertionService.analyzeMultiDuctJunction([cp('a', 0), cp('b', 60)]);
    expect(junction.type).toBe('elbow');
    expect(junction.angle).toBeCloseTo(60, 6);
  });

  it('classifies a shallow branch as a wye and stores the branch angle', () => {
    // Main run is straight (0° and 180°); branch comes in at 50°.
    const junction = FittingInsertionService.analyzeMultiDuctJunction([cp('a', 0), cp('b', 180), cp('c', 50)]);
    expect(junction.type).toBe('wye');
    expect(junction.angle).toBeCloseTo(50, 6);
  });

  it('classifies a perpendicular branch as a tee and stores 90°', () => {
    const junction = FittingInsertionService.analyzeMultiDuctJunction([cp('a', 0), cp('b', 180), cp('c', 90)]);
    expect(junction.type).toBe('tee');
    expect(junction.angle).toBeCloseTo(90, 6);
  });
});
