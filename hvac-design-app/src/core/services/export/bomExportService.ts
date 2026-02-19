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
  // Pricing fields (optional)
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
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
      item.materialUnitPrice.toFixed(2),
      item.materialQuantity.toFixed(2),
      item.materialSubtotal.toFixed(2),
      item.laborHours.toFixed(2),
      item.laborRate.toFixed(2),
      item.laborSubtotal.toFixed(2),
      item.itemTotal.toFixed(2),
    ]);

    // Add summary row
    const summaryRow = [
      '',
      'TOTAL',
      '',
      '',
      estimate.breakdown.materialCost.toFixed(2),
      '',
      '',
      estimate.breakdown.laborCost.toFixed(2),
      estimate.breakdown.totalCost.toFixed(2),
    ];

    const bom = '\uFEFF';
    return bom + [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')].join('\n');
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
      headers.push('Velocity (FPM)', 'Pressure Drop');
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
        item.materialCost?.toFixed(2) || '',
        item.laborCost?.toFixed(2) || '',
        item.totalCost?.toFixed(2) || ''
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
