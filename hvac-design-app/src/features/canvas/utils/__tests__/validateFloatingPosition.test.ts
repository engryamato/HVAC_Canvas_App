import { describe, it, expect } from 'vitest';

import { validateFloatingPosition } from '../validateFloatingPosition';

describe('validateFloatingPosition', () => {
  const panel = { width: 320, height: 600 };
  const viewport = { width: 1000, height: 800 };

  it('returns the same position when within bounds', () => {
    const position = { x: 100, y: 150 };
    expect(validateFloatingPosition(position, panel, viewport)).toEqual(position);
  });

  it('returns centered position when position is null', () => {
    expect(validateFloatingPosition(null, panel, viewport)).toEqual({ x: 340, y: 100 });
  });

  it('returns centered position for negative coordinates beyond margin', () => {
    expect(validateFloatingPosition({ x: -999, y: -999 }, panel, viewport)).toEqual({
      x: 340,
      y: 100,
    });
  });

  it('returns centered position when position is beyond viewport bounds', () => {
    expect(validateFloatingPosition({ x: 9999, y: 9999 }, panel, viewport)).toEqual({
      x: 340,
      y: 100,
    });
  });

  it('allows positions exactly at the visibility boundary', () => {
    const position = { x: -(panel.width - 50), y: viewport.height - 50 };
    expect(validateFloatingPosition(position, panel, viewport)).toEqual(position);
  });
});

