import { BOMItem } from '../bom/bomGenerationService';
import { 
  LaborRates,
  CalculationSettings 
} from '../../schema/calculation-settings.schema';
import { PricingData } from '../../schema/component-library.schema';

/**
 * Cost Calculation Engine
 * 
 * Calculates project costs including:
 * - Material costs
 * - Labor costs
 * - Markup and overhead
 * - Tax calculations
 */

export interface CostBreakdown {
  materialCost: number;
  laborCost: number;
  subtotal: number;
  markup: number;
  overhead: number;
  subtotalWithMarkup: number;
  tax: number;
  totalCost: number;
}

export interface ItemCost {
  bomItemId: string;
  description: string;
  
  // Material
  materialUnitPrice: number;
  materialQuantity: number;
  materialSubtotal: number;
  
  // Labor
  laborHoursPerUnit: number;
  laborRate: number;
  laborHours: number;
  laborSubtotal: number;
  
  // Total
  itemTotal: number;
}

export type CostCalculationMethod = 'unit' | 'assembly' | 'parametric';

export interface AssemblyGroup {
  id: string;
  name: string;
  description?: string;
  itemIds: string[];
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

export interface ProjectCostEstimate {
  items: ItemCost[];
  breakdown: CostBreakdown;
  generatedAt: Date;
  settings: CalculationSettings;
  method: CostCalculationMethod;
  assemblyGroups?: AssemblyGroup[];
}

export interface CostDelta {
  materialCost: number;
  laborCost: number;
  subtotal: number;
  markup: number;
  overhead: number;
  subtotalWithMarkup: number;
  tax: number;
  totalCost: number;
}

interface NormalizedPricingData {
  materialCost: number;
  laborUnits: number;
  laborRate?: number;
  wasteFactor: number;
  markup?: number;
}

export class CostCalculationService {
  static calculateCostDelta(
    previous: ProjectCostEstimate | null,
    next: ProjectCostEstimate
  ): CostDelta {
    const previousBreakdown = previous?.breakdown;

    return {
      materialCost: next.breakdown.materialCost - (previousBreakdown?.materialCost ?? 0),
      laborCost: next.breakdown.laborCost - (previousBreakdown?.laborCost ?? 0),
      subtotal: next.breakdown.subtotal - (previousBreakdown?.subtotal ?? 0),
      markup: next.breakdown.markup - (previousBreakdown?.markup ?? 0),
      overhead: next.breakdown.overhead - (previousBreakdown?.overhead ?? 0),
      subtotalWithMarkup:
        next.breakdown.subtotalWithMarkup - (previousBreakdown?.subtotalWithMarkup ?? 0),
      tax: next.breakdown.tax - (previousBreakdown?.tax ?? 0),
      totalCost: next.breakdown.totalCost - (previousBreakdown?.totalCost ?? 0),
    };
  }

  /**
   * Calculate project cost estimate from BOM using specified method
   */
  static calculateProjectCost(
    bomItems: BOMItem[],
    settings: CalculationSettings,
    componentPricing: Map<string, PricingData>,
    method: CostCalculationMethod = 'unit'
  ): ProjectCostEstimate {
    switch (method) {
      case 'assembly':
        return this.calculateAssemblyCost(bomItems, settings, componentPricing);
      case 'parametric':
        return this.calculateParametricCost(bomItems, settings, componentPricing);
      case 'unit':
      default:
        return this.calculateUnitCost(bomItems, settings, componentPricing);
    }
  }

  /**
   * Unit cost method - individual item pricing
   */
  private static calculateUnitCost(
    bomItems: BOMItem[],
    settings: CalculationSettings,
    componentPricing: Map<string, PricingData>
  ): ProjectCostEstimate {
    const items = bomItems.map(item =>
      this.calculateItemCost(item, settings, componentPricing)
    );

    const breakdown = this.calculateCostBreakdown(items, settings);

    return {
      items,
      breakdown,
      generatedAt: new Date(),
      settings,
      method: 'unit',
    };
  }

  /**
   * Assembly cost method - grouped component pricing
   */
  private static calculateAssemblyCost(
    bomItems: BOMItem[],
    settings: CalculationSettings,
    componentPricing: Map<string, PricingData>
  ): ProjectCostEstimate {
    const items = bomItems.map(item =>
      this.calculateItemCost(item, settings, componentPricing)
    );

    const assemblyGroups = this.createAssemblyGroups(bomItems, items);
    
    const breakdown = this.calculateCostBreakdown(items, settings);

    return {
      items,
      breakdown,
      generatedAt: new Date(),
      settings,
      method: 'assembly',
      assemblyGroups,
    };
  }

  /**
   * Parametric cost method - size-based pricing
   */
  private static calculateParametricCost(
    bomItems: BOMItem[],
    settings: CalculationSettings,
    componentPricing: Map<string, PricingData>
  ): ProjectCostEstimate {
    const items = bomItems.map(item => {
      const baseCost = this.calculateItemCost(item, settings, componentPricing);
      const parametricMultiplier = this.calculateParametricMultiplier(item);
      
      return {
        ...baseCost,
        materialSubtotal: baseCost.materialSubtotal * parametricMultiplier,
        laborSubtotal: baseCost.laborSubtotal * parametricMultiplier,
        itemTotal: baseCost.itemTotal * parametricMultiplier,
      };
    });

    const breakdown = this.calculateCostBreakdown(items, settings);

    return {
      items,
      breakdown,
      generatedAt: new Date(),
      settings,
      method: 'parametric',
    };
  }

  private static createAssemblyGroups(
    bomItems: BOMItem[],
    itemCosts: ItemCost[]
  ): AssemblyGroup[] {
    const groups = new Map<string, AssemblyGroup>();

    for (let i = 0; i < bomItems.length; i++) {
      const item = bomItems[i];
      if (!item) continue;
      
      const cost = itemCosts[i];
      if (!cost) continue;
      
      const category = item.category;
      
      if (!groups.has(category)) {
        groups.set(category, {
          id: category,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Components`,
          itemIds: [],
          materialCost: 0,
          laborCost: 0,
          totalCost: 0,
        });
      }

      const group = groups.get(category)!;
      group.itemIds.push(item.id);
      group.materialCost += cost.materialSubtotal;
      group.laborCost += cost.laborSubtotal;
      group.totalCost += cost.itemTotal;
    }

    return Array.from(groups.values());
  }

  private static calculateParametricMultiplier(bomItem: BOMItem): number {
    const size = bomItem.size || '';
    const dimensions = size.split('x').map(Number).filter(Boolean);
    
    if (dimensions.length === 0) return 1;
    
    const dim0 = dimensions[0] || 0;
    const dim1 = dimensions[1] || dim0;
    
    const area = dimensions.length === 1 
      ? Math.PI * Math.pow(dim0 / 2, 2)
      : dim0 * dim1;
    
    const baseArea = 100;
    const ratio = area / baseArea;
    
    return Math.max(0.5, Math.min(3, Math.pow(ratio, 0.5)));
  }

  /**
   * Calculate cost for individual BOM item
   */
  private static calculateItemCost(
    bomItem: BOMItem,
    settings: CalculationSettings,
    componentPricing: Map<string, PricingData>
  ): ItemCost {
    const pricing = this.getPricingData(bomItem, componentPricing);
    const mappedPricing = this.mapBomToPricingFields(bomItem, pricing, settings);
    const quantityWithWaste = bomItem.quantity * (1 + mappedPricing.wasteFactor);

    // Material cost
    const materialUnitPrice = mappedPricing.materialCost;
    const materialQuantity = quantityWithWaste;
    const materialSubtotal = materialUnitPrice * materialQuantity;

    // Labor cost
    const laborHoursPerUnit = mappedPricing.laborUnits;
    const laborRate = mappedPricing.laborRate ?? this.getLaborRate(bomItem.category, settings.laborRates);
    const laborHours = laborHoursPerUnit * quantityWithWaste;
    const laborSubtotal = laborHours * laborRate;

    // Item total
    const itemTotal = materialSubtotal + laborSubtotal;

    return {
      bomItemId: bomItem.id,
      description: bomItem.description,
      materialUnitPrice,
      materialQuantity,
      materialSubtotal,
      laborHoursPerUnit,
      laborRate,
      laborHours,
      laborSubtotal,
      itemTotal,
    };
  }

  /**
   * Calculate overall cost breakdown with markup and tax
   */
  private static calculateCostBreakdown(
    items: ItemCost[],
    settings: CalculationSettings
  ): CostBreakdown {
    // Sum material and labor
    const materialCost = items.reduce((sum, item) => sum + item.materialSubtotal, 0);
    const laborCost = items.reduce((sum, item) => sum + item.laborSubtotal, 0);
    const subtotal = materialCost + laborCost;

    // Apply markup
    const materialMarkupAmount = materialCost * settings.markupSettings.materialMarkup;
    const laborMarkupAmount = laborCost * settings.markupSettings.laborMarkup;
    const markup = materialMarkupAmount + laborMarkupAmount;

    // Apply overhead
    const overhead = subtotal * settings.markupSettings.overhead;

    // Subtotal with markup
    const subtotalWithMarkup = subtotal + markup + overhead;

    // Apply tax
    let tax = 0;
    if (settings.markupSettings.includeTaxInEstimate && settings.markupSettings.taxRate) {
      tax = subtotalWithMarkup * settings.markupSettings.taxRate;
    }

    // Total
    const totalCost = subtotalWithMarkup + tax;

    return {
      materialCost,
      laborCost,
      subtotal,
      markup,
      overhead,
      subtotalWithMarkup,
      tax,
      totalCost,
    };
  }

  /**
   * Get pricing data for BOM item
   */
  private static getPricingData(
    bomItem: BOMItem,
    componentPricing: Map<string, PricingData>
  ): PricingData | null {
    // Try to get from component library
    if (bomItem.componentDefinitionId) {
      const pricing = componentPricing.get(bomItem.componentDefinitionId);
      if (pricing) {return pricing;}
    }

    // Try catalog item
    if (bomItem.catalogItemId) {
      const pricing = componentPricing.get(bomItem.catalogItemId);
      if (pricing) {return pricing;}
    }

    return null;
  }

  /**
   * Map BOM item and optional pricing data to normalized PricingDataSchema fields
   */
  private static mapBomToPricingFields(
    bomItem: BOMItem,
    pricing: PricingData | null,
    settings: CalculationSettings
  ): NormalizedPricingData {
    const categoryWasteFactor = this.getWasteFactorForCategory(bomItem.category, settings);

    return {
      materialCost: pricing?.materialCost ?? 0,
      laborUnits: pricing?.laborUnits ?? this.getDefaultLaborHours(bomItem),
      laborRate: pricing?.laborRate,
      wasteFactor: pricing?.wasteFactor ?? bomItem.wasteFactor ?? categoryWasteFactor,
      markup: pricing?.markup,
    };
  }

  private static getWasteFactorForCategory(
    category: BOMItem['category'],
    settings: CalculationSettings
  ): number {
    switch (category) {
      case 'duct':
        return settings.wasteFactors.ducts ?? settings.wasteFactors.default;
      case 'fitting':
        return settings.wasteFactors.fittings ?? settings.wasteFactors.default;
      case 'equipment':
        return settings.wasteFactors.equipment ?? settings.wasteFactors.default;
      case 'accessory':
        return settings.wasteFactors.accessories ?? settings.wasteFactors.default;
      default:
        return settings.wasteFactors.default;
    }
  }

  /**
   * Get default labor hours if not specified in pricing
   */
  private static getDefaultLaborHours(bomItem: BOMItem): number {
    switch (bomItem.category) {
      case 'duct':
        // 0.15 hours per linear foot (rough estimate)
        return bomItem.unit === 'LF' ? 0.15 : 1.0;
      case 'fitting':
        // 0.5 hours per fitting
        return 0.5;
      case 'equipment':
        // 4 hours per unit (varies greatly)
        return 4.0;
      case 'accessory':
        // 0.2 hours per unit
        return 0.2;
      default:
        return 1.0;
    }
  }

  /**
   * Get labor rate based on category
   */
  private static getLaborRate(
    _category: string,
    laborRates: LaborRates
  ): number {
    // Apply regional multiplier to base rate
    const baseRate = laborRates.baseRate;
    const regionalMultiplier = laborRates.regionalMultiplier || 1.0;

    return baseRate * regionalMultiplier;
  }

  /**
   * Calculate cost per square foot
   * Useful for comparing projects
   */
  static calculateCostPerSqFt(
    totalCost: number,
    buildingArea: number
  ): number {
    if (buildingArea <= 0) {return 0;}
    return totalCost / buildingArea;
  }

  /**
   * Calculate profit margin percentage
   */
  static calculateProfitMargin(breakdown: CostBreakdown): number {
    if (breakdown.subtotal === 0) {return 0;}
    const profit = breakdown.markup + breakdown.overhead;
    return (profit / breakdown.subtotal) * 100;
  }

  /**
   * Generate cost comparison between options
   */
  static compareCosts(
    estimates: ProjectCostEstimate[]
  ): Array<{
    index: number;
    totalCost: number;
    savings: number;
    savingsPercent: number;
  }> {
    if (estimates.length === 0) {return [];}

    // Find baseline (most expensive)
    const baseline = Math.max(...estimates.map(e => e.breakdown.totalCost));

    return estimates.map((estimate, index) => {
      const totalCost = estimate.breakdown.totalCost;
      const savings = baseline - totalCost;
      const savingsPercent = baseline > 0 ? (savings / baseline) * 100 : 0;

      return {
        index,
        totalCost,
        savings,
        savingsPercent,
      };
    });
  }

  /**
   * Export cost estimate to formatted report
   */
  static exportToReport(estimate: ProjectCostEstimate): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('PROJECT COST ESTIMATE');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Generated: ${estimate.generatedAt.toLocaleDateString()}`);
    lines.push('');

    // Items detail
    lines.push('ITEM BREAKDOWN:');
    lines.push('-'.repeat(60));

    for (const item of estimate.items) {
      lines.push(`${item.description}`);
      lines.push(`  Material: $${item.materialSubtotal.toFixed(2)}`);
      lines.push(`  Labor: ${item.laborHours.toFixed(1)} hrs @ $${item.laborRate.toFixed(2)}/hr = $${item.laborSubtotal.toFixed(2)}`);
      lines.push(`  Item Total: $${item.itemTotal.toFixed(2)}`);
      lines.push('');
    }

    // Summary
    lines.push('='.repeat(60));
    lines.push('SUMMARY:');
    lines.push('-'.repeat(60));
    lines.push(`Material Cost:        $${estimate.breakdown.materialCost.toFixed(2)}`);
    lines.push(`Labor Cost:           $${estimate.breakdown.laborCost.toFixed(2)}`);
    lines.push(`Subtotal:             $${estimate.breakdown.subtotal.toFixed(2)}`);
    lines.push(`Markup:               $${estimate.breakdown.markup.toFixed(2)}`);
    lines.push(`Overhead:             $${estimate.breakdown.overhead.toFixed(2)}`);
    lines.push(`Subtotal w/ Markup:   $${estimate.breakdown.subtotalWithMarkup.toFixed(2)}`);
    
    if (estimate.breakdown.tax > 0) {
      lines.push(`Tax:                  $${estimate.breakdown.tax.toFixed(2)}`);
    }
    
    lines.push('='.repeat(60));
    lines.push(`TOTAL COST:           $${estimate.breakdown.totalCost.toFixed(2)}`);
    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}

/**
 * Export singleton instance
 */
export const costCalculationService = CostCalculationService;
