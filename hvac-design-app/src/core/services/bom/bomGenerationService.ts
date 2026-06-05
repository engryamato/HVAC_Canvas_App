import { Duct } from '../../schema/duct.schema';
import { DuctRun } from '../../schema/duct-run.schema';
import { Fitting, FittingProps } from '../../schema/fitting.schema';
import { Equipment, EquipmentProps } from '../../schema/equipment.schema';
import { WasteFactors } from '../../schema/calculation-settings.schema';

export const DEFAULT_BOM_WASTE_FACTORS: WasteFactors = {
  default: 0.1,
  ducts: 0.1,
  fittings: 0.05,
  equipment: 0.02,
  accessories: 0.08,
};

/**
 * Bill of Materials (BOM) Generation Service
 * 
 * Generates comprehensive BOM from design entities with:
 * - Material quantity calculations
 * - Waste factor application
 * - Component aggregation
 * - Unit conversions
 */

export interface BOMItem {
  id: string;
  category: 'duct' | 'fitting' | 'equipment' | 'accessory';
  description: string;
  
  // Identification
  catalogItemId?: string;
  componentDefinitionId?: string;
  unpriced?: boolean;
  unitCost?: number | null;
  
  // Quantities
  quantity: number;
  unit: string;
  wasteFactor: number;
  quantityWithWaste: number;
  
  // Material details
  material?: string;
  size?: string; // e.g., "12 inch" or "14x8"
  gauge?: number;
  surfaceAreaSquareFeet?: number;
  weightPounds?: number;
  
  // Grouping
  groupKey: string; // For aggregation
  
  // Source tracking
  sourceEntityIds: string[];
}

export interface BOMSummary {
  totalItems: number;
  categories: {
    ducts: number;
    fittings: number;
    equipment: number;
    accessories: number;
  };
  materials: Map<string, number>; // Material type -> total quantity
}

export interface BOMGenerationOptions {
  includeAutoInserted?: boolean; // Include auto-inserted fittings
  applyWasteFactors?: boolean;
  groupSimilarItems?: boolean;
  includeZeroQuantity?: boolean;
}

export interface EntityStoreSnapshot {
  byId: Record<string, unknown>;
  allIds: string[];
}

export interface BOMQualitySummary {
  unpricedCount: number;
  gaugeSplitLineCount: number;
  inferredSizeCount: number;
}

type DuctLike = {
  id: string;
  props: {
    shape?: string;
    diameter?: number;
    width?: number;
    height?: number;
    length?: number;
    installLength?: number;
    material?: string;
    catalogItemId?: string;
    gauge?: number;
    insulated?: boolean;
    insulationThickness?: number;
  };
  calculated?: {
    surfaceArea?: number;
    weight?: number;
  };
};

export interface EntitySnapshotSignature {
  structural: string;
  content: string;
}

export class BOMGenerationService {
  /**
   * Build lightweight signatures to detect structural vs. property edits.
   *
   * structural: add/delete/order changes
   * content: property edits that impact BOM/cost
   */
  static createEntitySnapshotSignature(entities: {
    byId: Record<string, unknown>;
    allIds: string[];
  }): EntitySnapshotSignature {
    const structural = entities.allIds.join('|');

    const content = entities.allIds
      .map((id) => {
        const entity = entities.byId[id] as {
          type?: string;
          modifiedAt?: string;
          props?: Record<string, unknown>;
          calculated?: Record<string, unknown>;
        } | undefined;

        if (!entity) {
          return `${id}:missing`;
        }

        return `${id}:${entity.type ?? 'unknown'}:${entity.modifiedAt ?? ''}:${JSON.stringify(
          entity.props ?? {}
        )}:${JSON.stringify(entity.calculated ?? {})}`;
      })
      .join('|');

    return { structural, content };
  }

  static getRecalculationTrigger(
    previous: EntitySnapshotSignature | null,
    next: EntitySnapshotSignature
  ): 'none' | 'immediate' | 'debounced' {
    if (!previous) {
      return 'immediate';
    }

    if (previous.structural !== next.structural) {
      return 'immediate';
    }

    if (previous.content !== next.content) {
      return 'debounced';
    }

    return 'none';
  }

  /**
   * Generate BOM from design entities
   */
  static generateBOM(
    entities: {
      ducts: Array<Duct | DuctRun>;
      fittings: Fitting[];
      equipment: Equipment[];
    },
    wasteFactors: WasteFactors,
    options: BOMGenerationOptions = {}
  ): BOMItem[] {
    const items: BOMItem[] = [];

    // Default options
    const opts = {
      includeAutoInserted: true,
      applyWasteFactors: true,
      groupSimilarItems: true,
      includeZeroQuantity: false,
      ...options,
    };

    // Process ducts
    for (const duct of entities.ducts) {
      const ductItems = this.processDuct(duct, wasteFactors, opts);
      items.push(...ductItems);
    }

    // Process fittings
    for (const fitting of entities.fittings) {
      // Skip auto-inserted if specified
      if (!opts.includeAutoInserted && fitting.props.autoInserted) {
        continue;
      }

      const fittingItem = this.processFitting(fitting, wasteFactors, opts);
      if (fittingItem) {
        items.push(fittingItem);
      }
    }

    // Process equipment
    for (const equipment of entities.equipment) {
      const equipmentItem = this.processEquipment(equipment, wasteFactors, opts);
      if (equipmentItem) {
        items.push(equipmentItem);
      }
    }

    // Group similar items if requested
    if (opts.groupSimilarItems) {
      return this.groupBOMItems(items);
    }

    return items;
  }

  static generateBOMFromEntityStore(
    entities: EntityStoreSnapshot,
    wasteFactors: WasteFactors,
    options: BOMGenerationOptions = {}
  ): BOMItem[] {
    const ducts: Array<Duct | DuctRun> = [];
    const fittings: Fitting[] = [];
    const equipment: Equipment[] = [];

    for (const id of entities.allIds) {
      const entity = entities.byId[id] as { type?: string } | undefined;
      if (!entity) {
        continue;
      }

      if (entity.type === 'duct' || entity.type === 'duct_run') {
        ducts.push(entity as Duct | DuctRun);
      } else if (entity.type === 'fitting') {
        fittings.push(entity as Fitting);
      } else if (entity.type === 'equipment') {
        equipment.push(entity as Equipment);
      }
    }

    return this.generateBOM({ ducts, fittings, equipment }, wasteFactors, options);
  }

  static summarizeQuality(items: BOMItem[]): BOMQualitySummary {
    const unpricedCount = items.filter((item) => item.unpriced).length;
    const inferredSizeCount = items.filter((item) => item.size === 'Unknown size').length;
    const gaugeSplitGroups = new Map<string, Set<string>>();

    for (const item of items) {
      if (item.category !== 'duct') {
        continue;
      }

      const baseKey = [
        item.category,
        item.size ?? '',
        item.material ?? '',
      ].join('-');
      if (!gaugeSplitGroups.has(baseKey)) {
        gaugeSplitGroups.set(baseKey, new Set());
      }
      gaugeSplitGroups.get(baseKey)!.add(String(item.gauge ?? 'unspecified'));
    }

    const gaugeSplitLineCount = items.filter((item) => {
      if (item.category !== 'duct') {
        return false;
      }
      const baseKey = [item.category, item.size ?? '', item.material ?? ''].join('-');
      return (gaugeSplitGroups.get(baseKey)?.size ?? 0) > 1;
    }).length;

    return { unpricedCount, gaugeSplitLineCount, inferredSizeCount };
  }

  /**
   * Process duct into BOM items
   */
  private static processDuct(
    duct: DuctLike,
    wasteFactors: WasteFactors,
    options: BOMGenerationOptions
  ): BOMItem[] {
    const items: BOMItem[] = [];

    // Main duct material
    const ductItem = this.createDuctBOMItem(duct, wasteFactors, options);
    items.push(ductItem);

    // Insulation (if applicable)
    if (duct.props.insulated && duct.props.insulationThickness) {
      const insulationItem = this.createInsulationBOMItem(duct, wasteFactors);
      items.push(insulationItem);
    }

    return items;
  }

  /**
   * Create BOM item for duct
   */
  private static createDuctBOMItem(
    duct: DuctLike,
    wasteFactors: WasteFactors,
    options: BOMGenerationOptions
  ): BOMItem {
    const wasteFactor = options.applyWasteFactors
      ? wasteFactors.ducts || wasteFactors.default
      : 0;

    // Calculate quantity (linear feet)
    const quantity = duct.props.length ?? duct.props.installLength ?? 0;
    const quantityWithWaste = quantity * (1 + wasteFactor);

    // Generate description
    const size = this.getDuctSizeString(duct.props);
    const material = duct.props.material || 'galvanized';
    const description = `${size} ${material} ${duct.props.shape} duct`;
    const gauge = duct.props.gauge;

    // Group key for aggregation
    const groupKey = `duct-${duct.props.shape}-${size}-${material}-gauge-${gauge ?? 'unspecified'}`;

    return {
      id: duct.id,
      category: 'duct',
      description,
      catalogItemId: duct.props.catalogItemId,
      unpriced: !duct.props.catalogItemId,
      unitCost: duct.props.catalogItemId ? undefined : null,
      quantity,
      unit: 'LF',
      wasteFactor,
      quantityWithWaste,
      material,
      size,
      gauge,
      surfaceAreaSquareFeet: duct.calculated?.surfaceArea,
      weightPounds: duct.calculated?.weight,
      groupKey,
      sourceEntityIds: [duct.id],
    };
  }

  /**
   * Create BOM item for insulation
   */
  private static createInsulationBOMItem(
    duct: DuctLike,
    wasteFactors: WasteFactors
  ): BOMItem {
    const wasteFactor = wasteFactors.accessories || wasteFactors.default;

    const size = this.getDuctSizeString(duct.props);
    const thickness = duct.props.insulationThickness;
    const quantity = duct.props.length ?? duct.props.installLength ?? 0;
    const quantityWithWaste = quantity * (1 + wasteFactor);

    const description = `${size} duct insulation (${thickness}" thick)`;
    const groupKey = `insulation-${size}-${thickness}`;

    return {
      id: `${duct.id}-insulation`,
      category: 'accessory',
      description,
      unpriced: true,
      unitCost: null,
      quantity,
      unit: 'LF',
      wasteFactor,
      quantityWithWaste,
      size,
      groupKey,
      sourceEntityIds: [duct.id],
    };
  }

  /**
   * Process fitting into BOM item
   */
  private static processFitting(
    fitting: Fitting,
    wasteFactors: WasteFactors,
    options: BOMGenerationOptions
  ): BOMItem | null {
    const wasteFactor = options.applyWasteFactors
      ? wasteFactors.fittings || wasteFactors.default
      : 0;

    const quantity = 1; // Fittings are counted as each
    const quantityWithWaste = quantity * (1 + wasteFactor);

    const description = this.getFittingDescription(fitting.props);
    const groupKey = `fitting-${fitting.props.fittingType}`;

    return {
      id: fitting.id,
      category: 'fitting',
      description,
      catalogItemId: fitting.props.catalogItemId,
      unpriced: !fitting.props.catalogItemId,
      unitCost: fitting.props.catalogItemId ? undefined : null,
      quantity,
      unit: 'EA',
      wasteFactor,
      quantityWithWaste,
      groupKey,
      sourceEntityIds: [fitting.id],
    };
  }

  /**
   * Process equipment into BOM item
   */
  private static processEquipment(
    equipment: Equipment,
    wasteFactors: WasteFactors,
    options: BOMGenerationOptions
  ): BOMItem | null {
    const wasteFactor = options.applyWasteFactors
      ? wasteFactors.equipment || wasteFactors.default
      : 0;

    const quantity = 1;
    const quantityWithWaste = quantity * (1 + wasteFactor);

    const description = this.getEquipmentDescription(equipment.props);
    const groupKey = `equipment-${equipment.props.equipmentType}-${equipment.props.manufacturer ?? 'generic'}`;

    return {
      id: equipment.id,
      category: 'equipment',
      description,
      catalogItemId: equipment.props.catalogItemId,
      unpriced: !equipment.props.catalogItemId,
      unitCost: equipment.props.catalogItemId ? undefined : null,
      quantity,
      unit: 'EA',
      wasteFactor,
      quantityWithWaste,
      groupKey,
      sourceEntityIds: [equipment.id],
    };
  }

  /**
   * Group similar BOM items together
   */
  private static groupBOMItems(items: BOMItem[]): BOMItem[] {
    const grouped = new Map<string, BOMItem>();

    for (const item of items) {
      const groupingIdentity = `${item.groupKey}-catalog-${item.catalogItemId ?? 'unpriced'}`;
      const existing = grouped.get(groupingIdentity);

      if (existing) {
        // Merge quantities
        existing.quantity += item.quantity;
        existing.quantityWithWaste += item.quantityWithWaste;
        if (item.surfaceAreaSquareFeet !== undefined || existing.surfaceAreaSquareFeet !== undefined) {
          existing.surfaceAreaSquareFeet =
            (existing.surfaceAreaSquareFeet ?? 0) + (item.surfaceAreaSquareFeet ?? 0);
        }
        if (item.weightPounds !== undefined || existing.weightPounds !== undefined) {
          existing.weightPounds = (existing.weightPounds ?? 0) + (item.weightPounds ?? 0);
        }
        existing.sourceEntityIds.push(...item.sourceEntityIds);
      } else {
        grouped.set(groupingIdentity, { ...item });
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * Generate BOM summary statistics
   */
  static generateSummary(items: BOMItem[]): BOMSummary {
    const summary: BOMSummary = {
      totalItems: items.length,
      categories: {
        ducts: 0,
        fittings: 0,
        equipment: 0,
        accessories: 0,
      },
      materials: new Map(),
    };

    for (const item of items) {
      // Count by category
      if (item.category === 'duct') {summary.categories.ducts++;}
      else if (item.category === 'fitting') {summary.categories.fittings++;}
      else if (item.category === 'equipment') {summary.categories.equipment++;}
      else if (item.category === 'accessory') {summary.categories.accessories++;}

      // Aggregate materials
      if (item.material) {
        const current = summary.materials.get(item.material) || 0;
        summary.materials.set(item.material, current + item.quantityWithWaste);
      }
    }

    return summary;
  }

  /**
   * Helper: Get duct size string
   */
  private static getDuctSizeString(duct: DuctLike['props']): string {
    if ((duct.shape === 'round' || duct.shape === 'flexible') && duct.diameter) {
      return `${duct.diameter}"`;
    } else if ((duct.shape === 'rectangular' || duct.shape === 'flat_oval') && duct.width && duct.height) {
      return `${duct.width}x${duct.height}`;
    }
    return 'Unknown size';
  }

  /**
   * Helper: Get fitting description
   */
  private static getFittingDescription(fitting: Partial<FittingProps>): string {
    const type = fitting.fittingType?.replace('_', ' ') || 'fitting';
    return `${type} fitting`;
  }

  /**
   * Helper: Get equipment description
   */
  private static getEquipmentDescription(equipment: Partial<EquipmentProps>): string {
    const parts = [];
    if (equipment.manufacturer) {parts.push(equipment.manufacturer);}
    if (equipment.model) {parts.push(equipment.model);}
    if (equipment.equipmentType) {parts.push(equipment.equipmentType);}

    return parts.join(' ') || 'Equipment';
  }

  /**
   * Export BOM to CSV format
   */
  static exportToCSV(items: BOMItem[]): string {
    const headers = [
      'Category',
      'Description',
      'Size',
      'Material',
      'Quantity',
      'Unit',
      'Waste %',
      'Qty w/ Waste',
      'Gauge',
      'Weight (lb)',
      'Surface Area (sq ft)',
    ];

    const rows = items.map(item => [
      item.category,
      item.description,
      item.size || '',
      item.material || '',
      item.quantity.toFixed(2),
      item.unit,
      (item.wasteFactor * 100).toFixed(1) + '%',
      item.quantityWithWaste.toFixed(2),
      item.gauge !== undefined ? String(item.gauge) : '',
      item.weightPounds !== undefined ? item.weightPounds.toFixed(2) : '',
      item.surfaceAreaSquareFeet !== undefined ? item.surfaceAreaSquareFeet.toFixed(2) : '',
    ]);

    const csvRows = [headers, ...rows];
    // Escape cells containing commas/quotes/newlines (RFC 4180) so descriptions
    // or materials with commas don't corrupt the CSV.
    const escapeCell = (value: string): string =>
      /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    const body = csvRows.map(row => row.map(escapeCell).join(',')).join('\n');
    // Prepend UTF-8 BOM for Excel compatibility (parity with legacy exportBOMtoCSV).
    return String.fromCharCode(0xFEFF) + body;
  }
}

/**
 * Export singleton instance
 */
export const bomGenerationService = BOMGenerationService;
