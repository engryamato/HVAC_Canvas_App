import { describe, expect, it } from 'vitest';

import { formatAirflow, formatLength, formatPressure } from '../unitFormatting';

describe('unit formatting', () => {
  it('formats imperial values', () => {
    expect(formatLength(12, 'imperial')).toBe('12 ft');
    expect(formatAirflow(500, 'imperial')).toBe('500 CFM');
    expect(formatPressure(0.42, 'imperial')).toBe('0.42 in. w.g.');
  });

  it('formats metric values', () => {
    expect(formatLength(10, 'metric')).toBe('3 m');
    expect(formatAirflow(500, 'metric')).toBe('236 L/s');
    expect(formatPressure(0.4, 'metric')).toBe('100 Pa');
  });

  it('uses dash for unavailable values', () => {
    expect(formatAirflow(null, 'imperial')).toBe('-');
    expect(formatPressure(null, 'metric')).toBe('-');
  });
});
