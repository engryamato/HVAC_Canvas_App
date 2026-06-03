import { describe, expect, it } from 'vitest';
import { BOMExportService } from '../bomExportService';
import type { ProjectCostEstimate } from '@/core/services/cost/costCalculationService';
import type { CalculationSettings } from '@/core/schema/calculation-settings.schema';

const settings = {} as CalculationSettings;

describe('WS7 bomExportService pricing correctness', () => {
  it('exports unpriced cost estimate lines as Unpriced with advisory counts', () => {
    const estimate: ProjectCostEstimate = {
      items: [
        {
          bomItemId: 'duct-1',
          description: '12x8 duct',
          materialUnitPrice: 10,
          materialQuantity: 11,
          materialSubtotal: 110,
          laborHoursPerUnit: 0.2,
          laborRate: 50,
          laborHours: 2.2,
          laborSubtotal: 110,
          itemTotal: 220,
          unpriced: false,
        },
        {
          bomItemId: 'duct-2',
          description: 'Manual duct',
          materialUnitPrice: null,
          materialQuantity: 11,
          materialSubtotal: null,
          laborHoursPerUnit: null,
          laborRate: null,
          laborHours: null,
          laborSubtotal: null,
          itemTotal: null,
          unpriced: true,
        },
      ],
      breakdown: {
        materialCost: 110,
        laborCost: 110,
        subtotal: 220,
        markup: 0,
        overhead: 0,
        subtotalWithMarkup: 220,
        tax: 0,
        totalCost: 220,
      },
      generatedAt: new Date('2026-01-01T00:00:00.000Z'),
      settings,
      method: 'unit',
      unpricedCount: 1,
      gaugeSplitLineCount: 2,
      inferredSizeCount: 1,
      confidentSubtotal: 220,
    };

    const csv = BOMExportService.exportCostEstimateToCSV(estimate, {
      format: 'csv',
      includePricing: true,
      includeEngineeringNotes: false,
      groupBy: 'none',
      filename: 'estimate.csv',
    });

    expect(csv).toContain('Estimate Quality');
    expect(csv).toContain('1 unpriced · 2 gauge-split lines · 1 inferred sizes');
    expect(csv).toContain('Manual duct,Unpriced');
    expect(csv).toContain('CONFIDENT TOTAL');
    expect(csv).not.toContain('Manual duct,0.00');
  });
});
