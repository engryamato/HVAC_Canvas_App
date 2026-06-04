import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DuctProps } from '@/core/schema/duct.schema';
import type { SizableDuctProps } from '@/core/services/sizing/sizingProvenance';
import { deriveDuctConstruction } from '../ductConstructionService';
import {
  registerDuctConstructionProvider,
  resetDuctConstructionProvider,
} from '../ductConstructionProvider';
import { getGaugeWeight } from '../gaugeWeightTable';
import { deriveGauge } from '../gaugeService';

const duct = (props: Partial<DuctProps>): Partial<DuctProps> => props;

describe('WS6b/WS6a — deriveDuctConstruction (flag on)', () => {
  beforeEach(() => resetDuctConstructionProvider());
  afterEach(() => resetDuctConstructionProvider());

  it('computes gauge + computed provenance for a non-specified round duct at the default 2"', () => {
    const result = deriveDuctConstruction(duct({ shape: 'round', diameter: 12, length: 10 }));
    expect(result).not.toBeNull();
    expect(result!.gauge).toBe(deriveGauge(12, 'round', '2'));
    expect(result!.gaugeProvenance).toBe('computed');
    expect(result!.sealClass).toBe('C'); // SMACNA derived at 2"
    expect(result!.surfaceAreaSquareFeet).toBeCloseTo(Math.PI * 1 * 10, 9);
    expect(result!.weightPounds).toBeCloseTo(
      result!.surfaceAreaSquareFeet * getGaugeWeight(result!.gauge as 26).fabricatedLbPerSquareFoot,
      9
    );
  });

  it('preserves a user-specified gauge (no recompute, no provenance flip)', () => {
    const result = deriveDuctConstruction(
      duct({ shape: 'round', diameter: 12, length: 10, gauge: 22, provenance: { gauge: 'specified' } } as Partial<SizableDuctProps> as Partial<DuctProps>)
    );
    expect(result!.gauge).toBe(22);
    expect(result!.gaugeProvenance).toBeUndefined();
    expect(result!.weightPounds).toBeGreaterThan(0); // 22 is a table gauge
  });

  it('omits weight ("—") when the gauge is unresolvable (specified off-table)', () => {
    const result = deriveDuctConstruction(
      duct({ shape: 'round', diameter: 12, length: 10, gauge: 25, provenance: { gauge: 'specified' } } as Partial<SizableDuctProps> as Partial<DuctProps>)
    );
    expect(result!.gauge).toBe(25);
    expect(result!.weightPounds).toBeUndefined();
    expect(result!.surfaceAreaSquareFeet).toBeGreaterThan(0); // area still computes
  });

  it('derives seal class from pressure, but a per-run override wins', () => {
    expect(deriveDuctConstruction(duct({ shape: 'round', diameter: 12, length: 10, pressureClass: '4' }))!.sealClass).toBe('A');
    expect(deriveDuctConstruction(duct({ shape: 'round', diameter: 12, length: 10, pressureClass: '1' }))!.sealClass).toBe('unsealed');
    expect(
      deriveDuctConstruction(duct({ shape: 'round', diameter: 12, length: 10, pressureClass: '2', sealClass: 'A' }))!.sealClass
    ).toBe('A');
  });

  it('lets an explicit project default seal class win over derivation', () => {
    registerDuctConstructionProvider(() => ({ defaultSealClass: 'B' }));
    expect(deriveDuctConstruction(duct({ shape: 'round', diameter: 12, length: 10, pressureClass: '2' }))!.sealClass).toBe('B');
  });

  it('uses the project default pressure class for gauge when the run has none', () => {
    registerDuctConstructionProvider(() => ({ defaultPressureClass: '10' }));
    const result = deriveDuctConstruction(duct({ shape: 'round', diameter: 12, length: 10 }));
    expect(result!.gauge).toBe(deriveGauge(12, 'round', '10'));
  });

  it('computes rectangular surface area as 2(W+H)L with inch→foot conversion', () => {
    const result = deriveDuctConstruction(duct({ shape: 'rectangular', width: 24, height: 12, length: 40 }));
    expect(result!.surfaceAreaSquareFeet).toBeCloseTo(2 * (2 + 1) * 40, 9);
  });

  it('uses installLength for duct_run props (not just legacy length)', () => {
    const viaLength = deriveDuctConstruction(duct({ shape: 'round', diameter: 12, length: 10 }));
    const viaInstall = deriveDuctConstruction(
      duct({ shape: 'round', diameter: 12, installLength: 10 } as Partial<DuctProps>)
    );
    expect(viaInstall!.surfaceAreaSquareFeet).toBeCloseTo(viaLength!.surfaceAreaSquareFeet, 9);
    expect(viaInstall!.surfaceAreaSquareFeet).toBeCloseTo(Math.PI * 1 * 10, 9);
  });

  it('normalizes flat-oval major/minor regardless of width vs height order', () => {
    const wide = deriveDuctConstruction(duct({ shape: 'flat_oval', width: 24, height: 12, length: 10 } as unknown as Partial<DuctProps>));
    const tall = deriveDuctConstruction(duct({ shape: 'flat_oval', width: 12, height: 24, length: 10 } as unknown as Partial<DuctProps>));
    const expected = (Math.PI * 1 + 2 * (2 - 1)) * 10; // major=2ft, minor=1ft
    expect(wide!.surfaceAreaSquareFeet).toBeCloseTo(expected, 9);
    expect(tall!.surfaceAreaSquareFeet).toBeCloseTo(expected, 9);
  });

  it('preserves a gauge that has no provenance record (imported/migrated data)', () => {
    const result = deriveDuctConstruction(
      duct({ shape: 'round', diameter: 12, length: 10, gauge: 30 } as Partial<DuctProps>)
    );
    expect(result!.gauge).toBe(30); // not recomputed
    expect(result!.gaugeProvenance).toBeUndefined();
    expect(result!.weightPounds).toBeUndefined(); // 30 is off-table → "—"
  });
});

describe('WS6b/WS6a — deriveDuctConstruction (flag off)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/core/flags/featureFlags');
  });

  it('returns null so callers keep prior behavior', async () => {
    vi.resetModules();
    vi.doMock('@/core/flags/featureFlags', () => ({
      isEnabled: (flag: string) => flag !== 'WS6_CONSTRUCTION_DERIVATION',
    }));
    const { deriveDuctConstruction: derive } = await import('../ductConstructionService');
    expect(derive({ shape: 'round', diameter: 12, length: 10 })).toBeNull();
  });
});
