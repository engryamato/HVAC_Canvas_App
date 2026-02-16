import { describe, expect, it } from 'vitest';
import { bomGenerationService } from '../../bom/bomGenerationService';
import { costCalculationService } from '../../cost/costCalculationService';
import type { CalculationSettings } from '@/core/schema/calculation-settings.schema';
import type { BOMItem } from '../../bom/bomGenerationService';

const settings: CalculationSettings = {
  laborRates: {
    baseRate: 45,
    regionalMultiplier: 1,
    currency: 'USD',
  },
  markupSettings: {
    materialMarkup: 0.15,
    laborMarkup: 0.1,
    overhead: 0.12,
    includeTaxInEstimate: true,
    taxRate: 0.08,
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

const baseBomItems: BOMItem[] = [
  {
    id: 'duct-1',
    category: 'duct',
    description: '12" galvanized round duct',
    quantity: 10,
    unit: 'LF',
    wasteFactor: 0.1,
    quantityWithWaste: 11,
    groupKey: 'duct-round-12-galv',
    sourceEntityIds: ['duct-1'],
    componentDefinitionId: 'comp-duct-1',
  },
  {
    id: 'fit-1',
    category: 'fitting',
    description: 'elbow_90 fitting',
    quantity: 1,
    unit: 'EA',
    wasteFactor: 0.05,
    quantityWithWaste: 1.05,
    groupKey: 'fitting-elbow_90',
    sourceEntityIds: ['fit-1'],
    componentDefinitionId: 'comp-fit-1',
  },
];

const pricing = new Map([
  ['comp-duct-1', { materialCost: 12, laborUnits: 0.2, wasteFactor: 0.1 }],
  ['comp-fit-1', { materialCost: 18, laborUnits: 0.5, wasteFactor: 0.05 }],
]);

describe('BOM and Cost Integration - Milestone 3', () => {
  it('classifies add/delete as immediate and property edits as debounced', () => {
    const previous = bomGenerationService.createEntitySnapshotSignature({
      byId: {
        '1': { type: 'duct', modifiedAt: '2026-01-01T00:00:00.000Z', props: { length: 10 } },
      },
      allIds: ['1'],
    });

    const addDeleteSnapshot = bomGenerationService.createEntitySnapshotSignature({
      byId: {
        '1': { type: 'duct', modifiedAt: '2026-01-01T00:00:00.000Z', props: { length: 10 } },
        '2': { type: 'fitting', modifiedAt: '2026-01-01T00:00:00.000Z', props: { fittingType: 'tee' } },
      },
      allIds: ['1', '2'],
    });

    const propertyEditSnapshot = bomGenerationService.createEntitySnapshotSignature({
      byId: {
        '1': { type: 'duct', modifiedAt: '2026-01-01T00:00:01.000Z', props: { length: 15 } },
      },
      allIds: ['1'],
    });

    expect(bomGenerationService.getRecalculationTrigger(previous, addDeleteSnapshot)).toBe('immediate');
    expect(bomGenerationService.getRecalculationTrigger(previous, propertyEditSnapshot)).toBe('debounced');
  });

  it('keeps cost estimate synchronized with settings changes and produces deltas', () => {
    const first = costCalculationService.calculateProjectCost(baseBomItems, settings, pricing as any);

    const updatedSettings: CalculationSettings = {
      ...settings,
      markupSettings: {
        ...settings.markupSettings,
        materialMarkup: 0.25,
      },
    };

    const second = costCalculationService.calculateProjectCost(baseBomItems, updatedSettings, pricing as any);
    const delta = costCalculationService.calculateCostDelta(first, second);

    expect(second.breakdown.totalCost).toBeGreaterThan(first.breakdown.totalCost);
    expect(delta.totalCost).toBeGreaterThan(0);
    expect(delta.markup).toBeGreaterThan(0);
  });
});
