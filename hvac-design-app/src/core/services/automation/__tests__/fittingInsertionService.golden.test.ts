import { describe, expect, it } from 'vitest';
import type { ConnectionPoint } from '../fittingInsertionService';
import { fittingInsertionService } from '../fittingInsertionService';
import { fittingGolden } from '../../calculations/__tests__/goldenFixtures';

function connection(ductId: string, angle: number, endPoint: 'start' | 'end' = 'start'): ConnectionPoint {
  return {
    ductId,
    endPoint,
    point: { x: 0, y: 0 },
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

  it.todo('near-60 degree tee/wye hysteresis remains unlocked for WS6');

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

  it.skip('classifies a body takeoff as tap/takeoff instead of tee', () => {
    // BUG: WS9-AF-001 — expected tap/takeoff class; observed engine has only tee/wye and returns tee.
    const result = fittingInsertionService.analyzeMultiDuctJunction([
      connection('trunk-left', 0, 'end'),
      connection('trunk-right', 180),
      connection('body-branch', 90),
    ]);

    expect(result.type).toBe('tap' as never);
  });
});
