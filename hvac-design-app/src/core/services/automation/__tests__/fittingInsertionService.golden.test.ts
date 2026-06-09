import { describe, expect, it } from 'vitest';
import type { ConnectionPoint } from '../fittingInsertionService';
import { fittingInsertionService } from '../fittingInsertionService';
import { fittingGolden } from '../../calculations/__tests__/goldenFixtures';

function connection(ductId: string, angle: number, endPoint: 'start' | 'end' = 'start', point = { x: 0, y: 0 }): ConnectionPoint {
  return {
    ductId,
    endPoint,
    point,
    angle,
    profile: { shape: 'round', equivalentDiameter: 12, diameter: 12 },
    diameter: 12,
  };
}

describe('WS9 golden fittingInsertionService', () => {
  it('classifies a 30 degree branch off a main run as a wye', () => {
    expect(fittingGolden.sourceNote).toContain('wye <= 60');

    const result = fittingInsertionService.analyzeMultiDuctJunction([
      connection('main-in', 0, 'end'),
      connection('main-out', 180),
      connection('branch-30', fittingGolden.wyeBranchAngleDegrees),
    ]);

    expect(result.type).toBe('wye');
    expect(result.angle).toBeCloseTo(30, 9);
  });

  it('classifies a 90 degree branch off a main run as a tee', () => {
    const result = fittingInsertionService.analyzeMultiDuctJunction([
      connection('main-in', 0, 'end'),
      connection('main-out', 180),
      connection('branch-90', fittingGolden.teeBranchAngleDegrees),
    ]);

    expect(result.type).toBe('tee');
    expect(result.angle).toBeCloseTo(90, 9);
  });

  // WS6c Part 1 — tee/wye hysteresis deadband (55°/65°).
  it('keeps a prior wye while a branch is dragged up into the 55-65 deadband', () => {
    const result = fittingInsertionService.analyzeMultiDuctJunction(
      [connection('main-in', 0, 'end'), connection('main-out', 180), connection('branch', 62)],
      'wye'
    );
    expect(result.type).toBe('wye');
  });

  it('keeps a prior tee while a branch is dragged down into the 55-65 deadband', () => {
    const result = fittingInsertionService.analyzeMultiDuctJunction(
      [connection('main-in', 0, 'end'), connection('main-out', 180), connection('branch', 58)],
      'tee'
    );
    expect(result.type).toBe('tee');
  });

  it('commits to wye below 55 and tee above 65 regardless of the prior classification', () => {
    const low = fittingInsertionService.analyzeMultiDuctJunction(
      [connection('main-in', 0, 'end'), connection('main-out', 180), connection('branch', 50)],
      'tee'
    );
    const high = fittingInsertionService.analyzeMultiDuctJunction(
      [connection('main-in', 0, 'end'), connection('main-out', 180), connection('branch', 70)],
      'wye'
    );
    expect(low.type).toBe('wye');
    expect(high.type).toBe('tee');
  });

  it('falls back to the ratified 60 cutoff inside the deadband with no prior', () => {
    const justUnder = fittingInsertionService.analyzeMultiDuctJunction([
      connection('main-in', 0, 'end'),
      connection('main-out', 180),
      connection('branch', 59),
    ]);
    const justOver = fittingInsertionService.analyzeMultiDuctJunction([
      connection('main-in', 0, 'end'),
      connection('main-out', 180),
      connection('branch', 61),
    ]);
    expect(justUnder.type).toBe('wye');
    expect(justOver.type).toBe('tee');
  });

  it('maps a straight round size change to a reducer fitting', () => {
    const junction = fittingInsertionService.analyzeMultiDuctJunction([
      {
        ...connection('large', 0, 'end'),
        profile: { shape: 'round', equivalentDiameter: 18, diameter: 18 },
        diameter: 18,
      },
      {
        ...connection('small', 0),
        profile: { shape: 'round', equivalentDiameter: 12, diameter: 12 },
        diameter: 12,
      },
    ]);
    const fitting = fittingInsertionService.insertFittingAtJunction(junction, { x: 0, y: 0 }, {});

    expect(junction.type).toBe('transition');
    expect(fitting.fittingType).toBe('reducer');
  });

  it('maps a straight round-to-rectangular profile change to a transition fitting', () => {
    const junction = fittingInsertionService.analyzeMultiDuctJunction([
      {
        ...connection('round', 0, 'end'),
        profile: { shape: 'round', equivalentDiameter: 18, diameter: 18 },
        diameter: 18,
      },
      {
        ...connection('rect', 0),
        profile: { shape: 'rectangular', equivalentDiameter: 18, width: 24, height: 12 },
        width: 24,
        height: 12,
      },
    ]);
    const fitting = fittingInsertionService.insertFittingAtJunction(junction, { x: 0, y: 0 }, {});

    expect(junction.type).toBe('transition');
    expect(fitting.fittingType).toBe('transition_square_to_round');
  });

  it('classifies a body takeoff as tap/takeoff instead of tee', () => {
    // WS9-AF-001: body takeoff (branch on trunk body) classified as 'tap' -> 'takeoff' fitting
    // Body tap: trunk continues straight (endpoints at different positions),
    // branch connects to trunk body at a different position than the trunk endpoints
    const result = fittingInsertionService.analyzeMultiDuctJunction([
      connection('trunk-left', 0, 'end', { x: 0, y: 0 }),
      connection('trunk-right', 180, 'start', { x: 100, y: 0 }),
      connection('body-branch', 90, 'start', { x: 50, y: 0 }),
    ]);

    expect(result.type).toBe('tap');
  });
});
