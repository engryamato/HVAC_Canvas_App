import { afterEach, describe, expect, it, vi } from 'vitest';
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
  autoFittingEnabled: true,
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

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/core/flags/featureFlags');
});

describe('WS7 costCalculationService weight pricing', () => {
  it('prices duct material by the project per-pound rate when no catalog item', () => {
    const estimate = costCalculationService.calculateProjectCost(
      [
        bomItem({
          catalogItemId: undefined,
          weightPounds: 100,
          quantity: 10,
          wasteFactor: 0.1,
          material: 'galvanized',
        }),
      ],
      { ...settings, materialCostPerPound: { galvanized: 1.5 } },
      new Map<string, PricingData>()
    );

    expect(estimate.items[0]).toMatchObject({
      unpriced: false,
      materialUnitPrice: 1.5,
    });
    expect(estimate.items[0]?.materialQuantity).toBeCloseTo(110);
    expect(estimate.items[0]?.materialSubtotal).toBeCloseTo(165);
    expect(estimate.items[0]?.itemTotal).toBeCloseTo(247.5);
  });

  it('catalog per-pound rate overrides the project rate', () => {
    const pricingMap = new Map<string, PricingData>([
      ['cat-24', { materialCost: 10, laborUnits: 0.2, wasteFactor: 0.1, materialCostPerPound: 2.0 }],
    ]);

    const estimate = costCalculationService.calculateProjectCost(
      [bomItem({ catalogItemId: 'cat-24', weightPounds: 100 })],
      { ...settings, materialCostPerPound: { galvanized: 1.5 } },
      pricingMap
    );

    expect(estimate.items[0]).toMatchObject({
      materialUnitPrice: 2.0,
      unpriced: false,
    });
    expect(estimate.items[0]?.materialSubtotal).toBeCloseTo(220);
  });

  it('duct with weight but no rate and no catalog is unpriced (never $0)', () => {
    const estimate = costCalculationService.calculateProjectCost(
      [bomItem({ catalogItemId: undefined, weightPounds: 100 })],
      settings,
      new Map<string, PricingData>()
    );

    expect(estimate.items[0]).toMatchObject({
      unpriced: true,
      itemTotal: null,
      materialSubtotal: null,
    });
  });

  it('falls back to linear-foot catalog pricing when no per-pound rate exists', () => {
    const pricingMap = new Map<string, PricingData>([
      ['cat-24', { materialCost: 10, laborUnits: 0.2, wasteFactor: 0.1 }],
    ]);

    const estimate = costCalculationService.calculateProjectCost(
      [bomItem({ catalogItemId: 'cat-24', weightPounds: 100 })],
      settings,
      pricingMap
    );

    expect(estimate.items[0]).toMatchObject({
      unpriced: false,
      materialUnitPrice: 10,
    });
    expect(estimate.items[0]?.materialSubtotal).toBeCloseTo(110);
  });

  it('does not weight-price when the flag is off', async () => {
    vi.resetModules();
    vi.doMock('@/core/flags/featureFlags', () => ({
      isEnabled: (f: string) => f !== 'WS7_WEIGHT_PRICING',
    }));
    const { costCalculationService } = await import('../costCalculationService');

    const estimate = costCalculationService.calculateProjectCost(
      [bomItem({ catalogItemId: undefined, weightPounds: 100 })],
      { ...settings, materialCostPerPound: { galvanized: 1.5 } },
      new Map<string, PricingData>()
    );

    expect(estimate.items[0]?.unpriced).toBe(true);
  });

  it('does not weight-price non-duct items', () => {
    const estimate = costCalculationService.calculateProjectCost(
      [
        bomItem({
          category: 'fitting',
          catalogItemId: undefined,
          weightPounds: 50,
          material: 'galvanized',
        }),
      ],
      { ...settings, materialCostPerPound: { galvanized: 1.5 } },
      new Map<string, PricingData>()
    );

    expect(estimate.items[0]?.unpriced).toBe(true);
  });
});
