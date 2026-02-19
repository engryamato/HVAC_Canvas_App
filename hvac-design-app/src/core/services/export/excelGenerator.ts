import { ProjectCostEstimate } from '../cost/costCalculationService';
import { BOMExportRow } from './bomExportService';

export interface ExcelExportOptions {
  includePricing: boolean;
  includeEngineeringNotes: boolean;
  groupBy: 'category' | 'systemType' | 'none';
  filename: string;
  sheetName?: string;
}

export interface ExcelWorksheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ExcelWorkbook {
  sheets: ExcelWorksheet[];
  metadata: {
    created: Date;
    modified: Date;
    application: string;
  };
}

/**
 * Excel Generator Service
 * 
 * Generates Excel workbooks with multiple sheets for BOM and cost data
 * Note: This creates a JSON structure that can be converted to Excel using libraries like xlsx or exceljs
 */
export class ExcelGenerator {
  /**
   * Generate Excel workbook from BOM and cost data
   */
  static generateWorkbook(
    bomRows: BOMExportRow[],
    options: ExcelExportOptions,
    costEstimate?: ProjectCostEstimate
  ): ExcelWorkbook {
    const sheets: ExcelWorksheet[] = [];

    // BOM Sheet
    sheets.push(this.generateBOMSheet(bomRows, options));

    // Cost Summary Sheet (if pricing enabled)
    if (options.includePricing && costEstimate) {
      sheets.push(this.generateCostSheet(costEstimate));
      sheets.push(this.generateItemizedCostSheet(costEstimate));
    }

    // Grouped sheets
    if (options.groupBy !== 'none') {
      sheets.push(...this.generateGroupedSheets(bomRows, options));
    }

    return {
      sheets,
      metadata: {
        created: new Date(),
        modified: new Date(),
        application: 'SizeWise HVAC Canvas',
      },
    };
  }

  private static generateBOMSheet(rows: BOMExportRow[], options: ExcelExportOptions): ExcelWorksheet {
    const headers = ['ID', 'Category', 'Subcategory', 'Description', 'Quantity', 'Unit', 'Size', 'Material'];

    if (options.includePricing) {
      headers.push('Material Cost', 'Labor Cost', 'Total Cost');
    }

    if (options.includeEngineeringNotes) {
      headers.push('Velocity (FPM)', 'Pressure Drop');
    }

    const dataRows = rows.map(row => {
      const rowData: (string | number)[] = [
        row.id,
        row.category,
        row.subcategory,
        row.description,
        row.quantity,
        row.unit,
        row.size || '',
        row.material || '',
      ];

      if (options.includePricing) {
        rowData.push(
          row.materialCost || 0,
          row.laborCost || 0,
          row.totalCost || 0
        );
      }

      if (options.includeEngineeringNotes) {
        rowData.push(
          row.velocity || '',
          row.pressureDrop || ''
        );
      }

      return rowData;
    });

    return {
      name: options.sheetName || 'Bill of Materials',
      headers,
      rows: dataRows,
    };
  }

  private static generateCostSheet(estimate: ProjectCostEstimate): ExcelWorksheet {
    const b = estimate.breakdown;

    return {
      name: 'Cost Summary',
      headers: ['Category', 'Amount'],
      rows: [
        ['Material Cost', b.materialCost],
        ['Labor Cost', b.laborCost],
        ['Subtotal', b.subtotal],
        ['Markup', b.markup],
        ['Overhead', b.overhead],
        ['Subtotal with Markup', b.subtotalWithMarkup],
        ['Tax', b.tax],
        ['Total Cost', b.totalCost],
      ],
    };
  }

  private static generateItemizedCostSheet(estimate: ProjectCostEstimate): ExcelWorksheet {
    return {
      name: 'Itemized Costs',
      headers: [
        'Item ID',
        'Description',
        'Material Unit Price',
        'Material Quantity',
        'Material Subtotal',
        'Labor Hours',
        'Labor Rate',
        'Labor Subtotal',
        'Item Total',
      ],
      rows: estimate.items.map(item => [
        item.bomItemId,
        item.description,
        item.materialUnitPrice,
        item.materialQuantity,
        item.materialSubtotal,
        item.laborHours,
        item.laborRate,
        item.laborSubtotal,
        item.itemTotal,
      ]),
    };
  }

  private static generateGroupedSheets(
    rows: BOMExportRow[],
    options: ExcelExportOptions
  ): ExcelWorksheet[] {
    const sheets: ExcelWorksheet[] = [];
    const groups = this.groupRows(rows, options.groupBy);

    for (const [groupName, groupRows] of groups) {
      const sheetName = `${groupName} Items`.substring(0, 31);
      sheets.push(this.generateBOMSheet(groupRows, { ...options, sheetName }));
    }

    return sheets;
  }

  private static groupRows(
    rows: BOMExportRow[],
    groupBy: 'category' | 'systemType'
  ): Map<string, BOMExportRow[]> {
    const groups = new Map<string, BOMExportRow[]>();

    for (const row of rows) {
      const key = groupBy === 'category' ? row.category : row.category.split(' ')[0] || 'General';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    return groups;
  }

  /**
   * Export workbook to CSV format (single sheet only)
   */
  static exportToCSV(workbook: ExcelWorkbook, sheetIndex: number = 0): string {
    const sheet = workbook.sheets[sheetIndex];
    if (!sheet) return '';

    const rows = [sheet.headers, ...sheet.rows];
    const bom = '\uFEFF';
    return bom + rows.map(row => row.map(this.escapeCSV).join(',')).join('\n');
  }

  private static escapeCSV(field: string | number): string {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

export const excelGenerator = new ExcelGenerator();
