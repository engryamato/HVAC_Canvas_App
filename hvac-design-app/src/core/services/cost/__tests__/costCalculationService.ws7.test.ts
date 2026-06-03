import { describe, expect, it } from 'vitest';
import type { BOMItem } from '@/core/services/bom/bomGenerationService';
import { costCalculationService } from '../costCalculationService';
import type { CalculationSettings } from '@/core/schema/calculation-settings.schema';
import type { PricingData } from '@/core/schema/component-library.schema';

const settings: CalculationSettings = {
  laborRates: { baseRate: 50, regionalMultiplier: 1, currency: 'USD' },
  markupSettings: {
    materialMarkup: 0,
    laborMarkup: 0,
    overhead: 0,
    includeTaxInEstimate: false,
  },
  wasteFactors: {
    default: 0.1,
    ducts: 0.1,
    fittings: 0.05,
    equipment: 0.02,
    accessories: 0.08,
  },
  engineeringLimits: {
    maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
    minVelocity: { supply: 600, return: 500, exhaust: 500 },
    maxPressureDrop: { supply: 0.1, return: 0.08, exhaust: 0.08 },
    frictionFactors: {
      galvanized: 0.0005,
      stainless: 0.00015,
      flexible: 0.003,
      fiberglass: 0.0003,
    },
    standardConditions: { temperature: 70, pressure: 29.92, altitude: 0 },
  },
};

function bomItem(overrides: Partial<BOMItem>): BOMItem {
  return {
    id: 'duct-1',
    category: 'duct',
    description: '12x8 galvanized rectangular duct',
    catalogItemId: 'cat-24',
    quantity: 10,
    unit: 'LF',
    wasteFactor: 0.1,
    quantityWithWaste: 11,
    material: 'galvanized',
    size: '12x8',
    groupKey: 'duct-rectangular-12x8-galvanized-gauge-24',
    sourceEntityIds: ['duct-1'],
    gauge: 24,
    ...overrides,
  };
}

const pricing = new Map<string, PricingData>([
  ['cat-24', { materialCost: 10, laborUnits: 0.2, wasteFactor: 0.1 }],
  ['cat-26', { materialCost: 8, laborUnits: 0.15, wasteFactor: 0.1 }],
]);

describe('WS7 costCalculationService pricing correctness', () => {
  it('joins pricing by catalogItemId only and treats missing ids as unpriced', () => {
    const estimate = costCalculationService.calculateProjectCost(
      [
        bomItem({ id: 'priced-renamed', description: 'Renamed catalog display text', catalogItemId: 'cat-24' }),
        bomItem({ id: 'missing-id', catalogItemId: undefined }),
      ],
      settings,
      pricing
    );

    expect(estimate.items[0]).toMatchObject({
      bomItemId: 'priced-renamed',
      materialUnitPrice: 10,
      unpriced: false,
    });
    expect(estimate.items[1]).toMatchObject({
      bomItemId: 'missing-id',
      materialUnitPrice: null,
      itemTotal: null,
      unpriced: true,
    });
    expect(estimate.unpricedCount).toBe(1);
    expect(estimate.breakdown.totalCost).toBeGreaterThan(0);
  });

  it('excludes unpriced items from confident totals and keeps gauge-specific priced lines separate', () => {
    const estimate = costCalculationService.calculateProjectCost(
      [
        bomItem({ id: 'duct-24', catalogItemId: 'cat-24', gauge: 24 }),
        bomItem({
          id: 'duct-26',
          catalogItemId: 'cat-26',
          gauge: 26,
          groupKey: 'duct-rectangular-12x8-galvanized-gauge-26',
        }),
        bomItem({ id: 'manual-duct', catalogItemId: undefined, unpriced: true }),
      ],
      settings,
      pricing
    );

    const duct24 = estimate.items.find((item) => item.bomItemId === 'duct-24');
    const duct26 = estimate.items.find((item) => item.bomItemId === 'duct-26');
    const manual = estimate.items.find((item) => item.bomItemId === 'manual-duct');

    expect(duct24?.materialUnitPrice).toBe(10);
    expect(duct26?.materialUnitPrice).toBe(8);
    expect(manual?.unpriced).toBe(true);
    expect(estimate.breakdown.subtotal).toBe((duct24?.itemTotal ?? 0) + (duct26?.itemTotal ?? 0));
    expect(estimate.confidentSubtotal).toBe(estimate.breakdown.subtotal);
    expect(estimate.gaugeSplitLineCount).toBe(2);
  });
});
