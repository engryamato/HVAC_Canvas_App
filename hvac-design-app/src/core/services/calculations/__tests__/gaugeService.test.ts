import { describe, expect, it } from 'vitest';
import type { SizableDuctProps } from '@/core/services/sizing/sizingProvenance';
import {
  DEFAULT_PRESSURE_CLASS,
  DEFAULT_SEAL_CLASS,
  type PressureClass,
} from '@/core/schema/duct.schema';
import { GAUGE_WEIGHT_TABLE } from '../gaugeWeightTable';
import {
  deriveGauge,
  deriveSealClass,
  largestDimensionOf,
  resolveComputedGauge,
  resolveEffectivePressureClass,
  resolveEffectiveSealClass,
  type DerivableGauge,
} from '../gaugeService';

const VALID_GAUGES = GAUGE_WEIGHT_TABLE.map((r) => r.gauge);
const ALL_CLASSES: PressureClass[] = ['0.5', '1', '2', '3', '4', '6', '10'];

describe('WS6b — deriveGauge (SMACNA selection schedule)', () => {
  it('uses the lightest gauge for a small low-pressure duct', () => {
    expect(deriveGauge(10, 'rectangular', '0.5')).toBe(26);
    expect(deriveGauge(10, 'rectangular', '2')).toBe(26);
  });

  it('uses 16 ga for a large high-pressure duct and 18 ga for large low-pressure', () => {
    expect(deriveGauge(200, 'rectangular', '10')).toBe(16);
    expect(deriveGauge(200, 'rectangular', '4')).toBe(16);
    expect(deriveGauge(200, 'rectangular', '2')).toBe(18);
  });

  it('shares one schedule across the low-pressure tier (0.5/1/2)', () => {
    for (const dim of [10, 24, 40, 70, 120]) {
      expect(deriveGauge(dim, 'rectangular', '0.5')).toBe(deriveGauge(dim, 'rectangular', '2'));
      expect(deriveGauge(dim, 'rectangular', '1')).toBe(deriveGauge(dim, 'rectangular', '2'));
    }
  });

  it('shares one schedule across the high-pressure tier (3/4/6/10)', () => {
    for (const dim of [10, 24, 40, 70, 120]) {
      expect(deriveGauge(dim, 'rectangular', '3')).toBe(deriveGauge(dim, 'rectangular', '10'));
      expect(deriveGauge(dim, 'rectangular', '6')).toBe(deriveGauge(dim, 'rectangular', '10'));
    }
  });

  it('only ever returns a gauge present in the ratified weight table', () => {
    for (const pc of ALL_CLASSES) {
      for (const dim of [6, 12, 24, 40, 70, 120]) {
        expect(VALID_GAUGES).toContain(deriveGauge(dim, 'rectangular', pc));
      }
    }
  });

  it('gets heavier (or equal) as the duct grows within a pressure class', () => {
    const dims = [10, 20, 40, 70, 120];
    const gauges = dims.map((d) => deriveGauge(d, 'rectangular', '2'));
    for (let i = 1; i < gauges.length; i += 1) {
      // Heavier gauge = numerically smaller.
      expect(gauges[i]!).toBeLessThanOrEqual(gauges[i - 1]!);
    }
  });

  it('gets heavier (or equal) as the pressure class rises at a fixed size', () => {
    const gauges = ALL_CLASSES.map((pc) => deriveGauge(40, 'rectangular', pc));
    for (let i = 1; i < gauges.length; i += 1) {
      expect(gauges[i]!).toBeLessThanOrEqual(gauges[i - 1]!);
    }
  });

  it('defaults the pressure class to the project default (2") when omitted', () => {
    expect(deriveGauge(40, 'rectangular')).toBe(deriveGauge(40, 'rectangular', DEFAULT_PRESSURE_CLASS));
  });

  it('treats round/flexible by their largest dimension (never lighter than rectangular)', () => {
    const round: DerivableGauge = deriveGauge(60, 'round', '2');
    expect(round).toBe(deriveGauge(60, 'rectangular', '2'));
  });
});

describe('WS6b — effective class resolution (project default + per-run override)', () => {
  it('falls back to the locked defaults when nothing is set', () => {
    expect(resolveEffectivePressureClass(undefined, undefined)).toBe('2');
    expect(resolveEffectiveSealClass(undefined, undefined)).toBe('A');
    expect(DEFAULT_PRESSURE_CLASS).toBe('2');
    expect(DEFAULT_SEAL_CLASS).toBe('A');
  });

  it('inherits the project default when the run has no value', () => {
    expect(resolveEffectivePressureClass(undefined, '4')).toBe('4');
    expect(resolveEffectiveSealClass(undefined, 'C')).toBe('C');
  });

  it('lets the per-run value win over the project default', () => {
    expect(resolveEffectivePressureClass('6', '4')).toBe('6');
    expect(resolveEffectiveSealClass('B', 'C')).toBe('B');
  });
});

describe('WS6b — deriveSealClass (SMACNA pressure → seal chain)', () => {
  it('maps pressure class to the SMACNA seal class', () => {
    expect(deriveSealClass('0.5')).toBe('C');
    expect(deriveSealClass('1')).toBe('C');
    expect(deriveSealClass('2')).toBe('C');
    expect(deriveSealClass('3')).toBe('B');
    expect(deriveSealClass('4')).toBe('A');
    expect(deriveSealClass('6')).toBe('A');
    expect(deriveSealClass('10')).toBe('A');
  });

  it('gets stricter (C→B→A) as pressure rises', () => {
    const order = { C: 0, B: 1, A: 2 };
    const classes = ['0.5', '1', '2', '3', '4', '6', '10'] as const;
    const seals = classes.map((pc) => order[deriveSealClass(pc)]);
    for (let i = 1; i < seals.length; i += 1) {
      expect(seals[i]!).toBeGreaterThanOrEqual(seals[i - 1]!);
    }
  });
});

describe('WS6b — largestDimensionOf', () => {
  it('picks the largest finite positive size field', () => {
    expect(largestDimensionOf({ width: 24, height: 12 } as Partial<SizableDuctProps>)).toBe(24);
    expect(largestDimensionOf({ diameter: 18 } as Partial<SizableDuctProps>)).toBe(18);
    expect(largestDimensionOf({} as Partial<SizableDuctProps>)).toBe(0);
  });
});

describe('WS6b — resolveComputedGauge (WS5 provenance guard)', () => {
  it('derives a computed gauge for a duct with no specified gauge', () => {
    const result = resolveComputedGauge(
      { width: 10, height: 8 } as Partial<SizableDuctProps>,
      'rectangular',
      '2'
    );
    expect(result).toEqual({ gauge: 26, provenance: 'computed' });
  });

  it('never overwrites a user-specified gauge (returns null)', () => {
    const result = resolveComputedGauge(
      { width: 10, height: 8, provenance: { gauge: 'specified' } } as Partial<SizableDuctProps>,
      'rectangular',
      '2'
    );
    expect(result).toBeNull();
  });

  it('derives from the largest dimension for a round run', () => {
    const result = resolveComputedGauge(
      { diameter: 60 } as Partial<SizableDuctProps>,
      'round',
      '2'
    );
    expect(result?.gauge).toBe(deriveGauge(60, 'round', '2'));
  });
});
