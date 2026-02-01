import { describe, expect, it } from 'vitest';
import { formatRulerLabel, pickRulerStepWorldPx } from '../rulers';

describe('rulers', () => {
  describe('formatRulerLabel', () => {
    it('formats imperial labels', () => {
      expect(formatRulerLabel(0, 'imperial')).toBe('0.0"');
      expect(formatRulerLabel(96, 'imperial')).toBe('1.0"');
      expect(formatRulerLabel(96 * 12, 'imperial')).toBe("1'");
    });

    it('formats metric labels', () => {
      expect(formatRulerLabel(0, 'metric')).toBe('0 mm');
      expect(formatRulerLabel(96, 'metric')).toBe('25 mm');
    });
  });

  describe('pickRulerStepWorldPx', () => {
    it('picks smaller steps when zoomed in', () => {
      const zoomedIn = pickRulerStepWorldPx(4, 'imperial');
      const zoomedOut = pickRulerStepWorldPx(0.25, 'imperial');
      expect(zoomedIn).toBeLessThanOrEqual(zoomedOut);
    });
  });
});

