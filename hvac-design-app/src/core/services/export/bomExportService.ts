import { ProjectCostEstimate } from '../cost/costCalculationService';

export interface BOMExportOptions {
  format: 'csv' | 'excel';
  includePricing: boolean;
  includeEngineeringNotes: boolean;
  groupBy: 'category' | 'systemType' | 'none';
  filename: string;
}

export interface BOMExportRow {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  quantity: number;
  unit: string;
  size?: string;
  material?: string;
  unpriced?: boolean;
  // Pricing fields (optional)
  materialCost?: number | null;
  laborCost?: number | null;
  totalCost?: number | null;
  // Engineering fields (optional)
  velocity?: number;
  pressureDrop?: number;
}

/**
 * BOM Export Service
 * 
 * Handles export of Bill of Materials to various formats
 */
export class BOMExportService {
  /**
   * Export BOM to CSV format
   */
  static exportToCSV(
    items: BOMExportRow[],
    options: BOMExportOptions
  ): string {
    const headers = this.generateHeaders(options);
    const rows = items.map(item => this.generateRow(item, options));
    
    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    return bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export cost estimate to CSV
   */
  static exportCostEstimateToCSV(
    estimate: ProjectCostEstimate,
    _options: BOMExportOptions
  ): string {
    const headers = [
      'Item ID',
      'Description',
      'Material Unit Price',
      'Material Quantity',
      'Material Subtotal',
      'Labor Hours',
      'Labor Rate',
      'Labor Subtotal',
      'Item Total',
    ];

    const rows = estimate.items.map(item => [
      item.bomItemId,
      this.escapeCSV(item.description),
      item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.materialUnitPrice),
      item.materialQuantity.toFixed(2),
      item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.materialSubtotal),
      item.unpriced ? 'Unpriced' : this.formatNullableNumber(item.laborHours),
      item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.laborRate),
      item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.laborSubtotal),
      item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.itemTotal),
    ]);

    const qualityRow = [
      '',
      'Estimate Quality',
      `${estimate.unpricedCount ?? 0} unpriced · ${estimate.gaugeSplitLineCount ?? 0} gauge-split lines · ${estimate.inferredSizeCount ?? 0} inferred sizes`,
      '',
      '',
      '',
      '',
      '',
      '',
    ];

    // Add summary row
    const summaryRow = [
      '',
      'CONFIDENT TOTAL',
      '',
      '',
      estimate.breakdown.materialCost.toFixed(2),
      '',
      '',
      estimate.breakdown.laborCost.toFixed(2),
      estimate.breakdown.totalCost.toFixed(2),
    ];

    const bom = '\uFEFF';
    return bom + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      qualityRow.map((field) => this.escapeCSV(field)).join(','),
      summaryRow.join(','),
    ].join('\n');
  }

  /**
   * Generate CSV headers based on options
   */
  private static generateHeaders(options: BOMExportOptions): string[] {
    const headers = [
      'ID',
      'Category',
      'Subcategory',
      'Description',
      'Quantity',
      'Unit',
      'Size',
      'Material',
    ];

    if (options.includePricing) {
      headers.push('Material Cost', 'Labor Cost', 'Total Cost');
    }

    if (options.includeEngineeringNotes) {
      headers.push('Velocity (FPM)', 'Pressure Drop (in.w.g./100ft)');
    }

    return headers;
  }

  /**
   * Generate CSV row for an item
   */
  private static generateRow(item: BOMExportRow, options: BOMExportOptions): string[] {
    const row = [
      item.id,
      this.escapeCSV(item.category),
      this.escapeCSV(item.subcategory),
      this.escapeCSV(item.description),
      item.quantity.toString(),
      item.unit,
      item.size || '',
      item.material || '',
    ];

    if (options.includePricing) {
      row.push(
        item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.materialCost),
        item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.laborCost),
        item.unpriced ? 'Unpriced' : this.formatNullableCurrency(item.totalCost)
      );
    }

    if (options.includeEngineeringNotes) {
      row.push(
        item.velocity?.toFixed(0) || '',
        item.pressureDrop?.toFixed(4) || ''
      );
    }

    return row.map(field => this.escapeCSV(field));
  }

  /**
   * Escape CSV field to handle commas and quotes
   */
  private static escapeCSV(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private static formatNullableCurrency(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : value.toFixed(2);
  }

  private static formatNullableNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : value.toFixed(2);
  }

  /**
   * Group items by category
   */
  static groupByCategory(items: BOMExportRow[]): Map<string, BOMExportRow[]> {
    const groups = new Map<string, BOMExportRow[]>();
    
    for (const item of items) {
      const key = item.category;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    return groups;
  }

  /**
   * Group items by system type
   */
  static groupBySystemType(items: BOMExportRow[]): Map<string, BOMExportRow[]> {
    const groups = new Map<string, BOMExportRow[]>();
    
    for (const item of items) {
      // Extract system type from category or use default
      const key = item.category.split(' ')[0] || 'Uncategorized';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    return groups;
  }
}

export const bomExportService = new BOMExportService();
