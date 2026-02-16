import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BOMPanel } from '../BOMPanel';
import type { BOMItem, BOMSummary } from '@/core/services/bom/bomGenerationService';
import type { CostDelta, ProjectCostEstimate } from '@/core/services/cost/costCalculationService';
import type { CalculationSettings } from '@/core/schema/calculation-settings.schema';

const bomItems: BOMItem[] = [
  {
    id: '1',
    category: 'duct',
    description: '12" galvanized round duct',
    quantity: 12,
    unit: 'LF',
    wasteFactor: 0.1,
    quantityWithWaste: 13.2,
    groupKey: 'duct-round-12-galv',
    sourceEntityIds: ['1'],
  },
];

const summary: BOMSummary = {
  totalItems: 1,
  categories: {
    ducts: 1,
    fittings: 0,
    equipment: 0,
    accessories: 0,
  },
  materials: new Map([['galvanized', 13.2]]),
};

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

const estimate: ProjectCostEstimate = {
  items: [],
  generatedAt: new Date('2026-01-01T00:00:00.000Z'),
  settings,
  breakdown: {
    materialCost: 150,
    laborCost: 75,
    subtotal: 225,
    markup: 28,
    overhead: 20,
    subtotalWithMarkup: 273,
    tax: 22,
    totalCost: 295,
  },
};

const delta: CostDelta = {
  materialCost: 15,
  laborCost: -3,
  subtotal: 12,
  markup: 2,
  overhead: 1,
  subtotalWithMarkup: 15,
  tax: 1,
  totalCost: 16,
};

describe('components/canvas/BOMPanel - Milestone 3', () => {
  it('renders last updated timestamp and cost deltas', () => {
    render(
      <BOMPanel
        bom={{ items: bomItems, summary }}
        costEstimate={estimate}
        costDelta={delta}
        lastUpdated={new Date('2026-01-01T12:00:00.000Z')}
      />
    );

    expect(screen.getByTestId('bom-last-updated').textContent).toContain('Last updated:');
    expect(screen.getByTestId('cost-delta-material').textContent).toBe('+$15.00');
    expect(screen.getByTestId('cost-delta-labor').textContent).toBe('−$3.00');
    expect(screen.getByTestId('cost-delta-total').textContent).toBe('+$16.00');
  });

  it('renders neutral deltas when no changes were detected', () => {
    render(
      <BOMPanel
        bom={{ items: bomItems, summary }}
        costEstimate={estimate}
        costDelta={{ ...delta, materialCost: 0, laborCost: 0, totalCost: 0 }}
      />
    );

    expect(screen.getByTestId('cost-delta-material').textContent).toBe('$0.00');
    expect(screen.getByTestId('cost-delta-labor').textContent).toBe('$0.00');
    expect(screen.getByTestId('cost-delta-total').textContent).toBe('$0.00');
  });
});
