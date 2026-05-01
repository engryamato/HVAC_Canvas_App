import { describe, expect, it } from 'vitest';
import { BOMExportService } from '../bomExportService';
import { ExcelGenerator } from '../excelGenerator';

describe('engineering export labels', () => {
  it('labels BOM pressure drop headers with per-100-ft units', () => {
    const csv = BOMExportService.exportToCSV(
      [
        {
          id: 'duct-1',
          category: 'Duct',
          subcategory: 'Supply',
          description: 'Main duct',
          quantity: 20,
          unit: 'LF',
          velocity: 1200,
          pressureDrop: 0.12,
        },
      ],
      {
        format: 'csv',
        includePricing: false,
        includeEngineeringNotes: true,
        groupBy: 'none',
        filename: 'bom.csv',
      }
    );

    expect(csv).toContain('Pressure Drop (in.w.g./100ft)');
  });

  it('labels Excel pressure drop headers with per-100-ft units', () => {
    const workbook = ExcelGenerator.generateWorkbook(
      [
        {
          id: 'duct-1',
          category: 'Duct',
          subcategory: 'Supply',
          description: 'Main duct',
          quantity: 20,
          unit: 'LF',
          velocity: 1200,
          pressureDrop: 0.12,
        },
      ],
      {
        includePricing: false,
        includeEngineeringNotes: true,
        groupBy: 'none',
        filename: 'bom.xlsx',
      }
    );

    expect(workbook.sheets[0]?.headers).toContain('Pressure Drop (in.w.g./100ft)');
  });
});
