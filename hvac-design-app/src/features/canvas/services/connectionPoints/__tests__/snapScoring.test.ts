import { describe, expect, it } from 'vitest';
import type { ResolvedConnectionPoint } from '../types';
import { findBestConnectionPoint } from '../snapScoring';

function point(id: string, x: number, facingX = 1): ResolvedConnectionPoint {
  return {
    id,
    objectId: 'object',
    objectType: 'fitting',
    localPosition: { x, y: 0 },
    worldPosition: { x, y: 0 },
    facingDirection: { x: facingX, y: 0 },
    connectionProfile: { shape: 'round', diameter: 12 },
    status: 'available',
  };
}

describe('findBestConnectionPoint', () => {
  it('chooses the closest available connection point inside tolerance', () => {
    const best = findBestConnectionPoint({ x: 11, y: 0 }, [point('far', 20), point('near', 10)], {
      tolerance: 20,
    });

    expect(best?.connectionPoint.id).toBe('near');
  });

  it('uses direction alignment to break distance ties', () => {
    const best = findBestConnectionPoint(
      { x: 10, y: 0 },
      [point('away', 10, -1), point('aligned', 10, 1)],
      { tolerance: 20, desiredDirection: { x: 1, y: 0 } }
    );

    expect(best?.connectionPoint.id).toBe('aligned');
  });

  it('uses stable object and port ids as the final deterministic tie breaker', () => {
    const first = point('b-port', 10);
    first.objectId = 'b-object';
    const second = point('a-port', 10);
    second.objectId = 'a-object';

    const best = findBestConnectionPoint({ x: 10, y: 0 }, [first, second], { tolerance: 20 });

    expect(best?.connectionPoint.id).toBe('a-port');
  });

  it('ignores occupied ports by default', () => {
    const occupied = point('occupied', 10);
    occupied.status = 'occupied';

    const best = findBestConnectionPoint({ x: 10, y: 0 }, [occupied, point('available', 12)], {
      tolerance: 20,
    });

    expect(best?.connectionPoint.id).toBe('available');
  });
});
