import { describe, expect, it } from 'vitest';
import { BOMGenerationService } from '../bomGenerationService';
import type { BOMItem } from '../bomGenerationService';

function bomItem(overrides: Partial<BOMItem> = {}): BOMItem {
  return {
    id: 'duct-1',
    category: 'duct',
    description: '12x8 galvanized rectangular duct',
    quantity: 10,
    unit: 'LF',
    wasteFactor: 0.1,
    quantityWithWaste: 11,
    groupKey: 'duct-rectangular-12x8-galvanized-gauge-24',
    sourceEntityIds: ['duct-1'],
    ...overrides,
  };
}

describe('BOMGenerationService CSV export', () => {
  it('includes rendered geometry headers', () => {
    const csv = BOMGenerationService.exportToCSV([bomItem()]);

    expect(csv).toContain('Gauge');
    expect(csv).toContain('Weight (lb)');
    expect(csv).toContain('Surface Area (sq ft)');
  });

  it('exports gauge, weight, and surface area values', () => {
    const csv = BOMGenerationService.exportToCSV([
      bomItem({
        gauge: 24,
        weightPounds: 18.75,
        surfaceAreaSquareFeet: 33.25,
      }),
    ]);

    expect(csv).toContain('24');
    expect(csv).toContain('18.75');
    expect(csv).toContain('33.25');
  });

  it('prepends a UTF-8 BOM for Excel compatibility', () => {
    const csv = BOMGenerationService.exportToCSV([bomItem()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('escapes cells containing commas/quotes (RFC 4180)', () => {
    const csv = BOMGenerationService.exportToCSV([
      bomItem({ description: 'Duct, lined, 1" wrap "A"', gauge: 24 }),
    ]);
    // Comma + quotes in the description must be quoted and quotes doubled,
    // so the row keeps a stable column count.
    expect(csv).toContain('"Duct, lined, 1"" wrap ""A"""');
  });

  it('leaves missing weight and surface area cells blank', () => {
    const csv = BOMGenerationService.exportToCSV([
      bomItem({
        gauge: 24,
        weightPounds: undefined,
        surfaceAreaSquareFeet: undefined,
      }),
    ]);
    const row = csv.split('\n')[1];
    const cells = row.split(',');

    expect(row).toContain('24,,');
    expect(cells[8]).toBe('24');
    expect(cells[9]).toBe('');
    expect(cells[10]).toBe('');
  });
});
