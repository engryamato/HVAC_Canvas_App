'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import { useShallow } from 'zustand/react/shallow';
import { generateBillOfMaterials, type BomItem } from '@/features/export/csv';
import { useSettingsStore } from '@/core/store/settingsStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import {
  costCalculationService,
  type CostDelta,
  type ProjectCostEstimate,
} from '@/core/services/cost/costCalculationService';
import {
  bomGenerationService,
  type BOMItem as CostBOMItem,
  type EntitySnapshotSignature,
} from '@/core/services/bom/bomGenerationService';

/**
 * Grouped BOM items by category
 */
export interface GroupedBomItems {
  all: BomItem[];
  ducts: BomItem[];
  equipment: BomItem[];
  fittings: BomItem[];
  accessories: BomItem[];
  totals: {
    totalItems: number;
    totalQuantity: number;
  };
  costEstimate: ProjectCostEstimate | null;
  costDelta: CostDelta | null;
  lastUpdated: Date | null;
}

/**
 * Hook to get Bill of Materials from current entities
 *
 * Automatically updates when entities change.
 * Groups items by category (Ducts, Equipment, Fittings).
 *
 * @returns Grouped BOM items
 */
export function useBOM(): GroupedBomItems {
  const entities = useEntityStore(
    useShallow((state) => ({
      byId: state.byId,
      allIds: state.allIds,
    }))
  );
  const calculationSettings = useSettingsStore((state) => state.calculationSettings);
  const componentDefinitions = useComponentLibraryStoreV2((state) => state.components);
  const [costEstimate, setCostEstimate] = useState<ProjectCostEstimate | null>(null);
  const [costDelta, setCostDelta] = useState<CostDelta | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const previousEntitySignatureRef = useRef<EntitySnapshotSignature | null>(null);
  const previousSettingsSignatureRef = useRef<string | null>(null);
  const previousPricingSignatureRef = useRef<string | null>(null);
  const previousEstimateRef = useRef<ProjectCostEstimate | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bomItems = useMemo(() => {
    return generateBillOfMaterials(entities);
  }, [entities]);

  const entitySignature = useMemo(
    () => bomGenerationService.createEntitySnapshotSignature(entities),
    [entities]
  );

  const settingsSignature = useMemo(() => JSON.stringify(calculationSettings), [calculationSettings]);

  const pricingSignature = useMemo(() => {
    return componentDefinitions
      .map((component) =>
        [
          component.id,
          component.pricing.materialCost,
          component.pricing.laborUnits,
          component.pricing.laborRate ?? '',
          component.pricing.wasteFactor,
          component.pricing.markup ?? '',
          component.updatedAt ? new Date(component.updatedAt).toISOString() : '',
        ].join(':')
      )
      .join('|');
  }, [componentDefinitions]);

  useEffect(() => {
    if (!calculationSettings) {
      return;
    }

    const componentPricing = new Map(
      componentDefinitions.map((component) => [component.id, component.pricing] as const)
    );
    const componentLookupByName = new Map(
      componentDefinitions.map((component) => [component.name.toLowerCase(), component.id] as const)
    );

    const mapTypeToCategory = (
      type: string
    ): CostBOMItem['category'] => {
      if (type === 'Duct') {return 'duct';}
      if (type === 'Fitting') {return 'fitting';}
      if (type === 'Equipment') {return 'equipment';}
      return 'accessory';
    };

    const mapCategoryToWasteFactor = (category: CostBOMItem['category']): number => {
      if (category === 'duct') {return calculationSettings.wasteFactors.ducts ?? calculationSettings.wasteFactors.default ?? 0.1;}
      if (category === 'fitting') {return calculationSettings.wasteFactors.fittings ?? calculationSettings.wasteFactors.default ?? 0.1;}
      if (category === 'equipment') {return calculationSettings.wasteFactors.equipment ?? calculationSettings.wasteFactors.default ?? 0.05;}
      return calculationSettings.wasteFactors.accessories ?? calculationSettings.wasteFactors.default ?? 0.1;
    };

    const costBomItems: CostBOMItem[] = bomItems.map((item) => {
      const category = mapTypeToCategory(item.type);
      const wasteFactor = mapCategoryToWasteFactor(category);
      const componentDefinitionId = componentLookupByName.get(item.name.toLowerCase());

      return {
        id: `bom-${item.itemNumber}`,
        category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit.toUpperCase(),
        wasteFactor,
        quantityWithWaste: item.quantity * (1 + wasteFactor),
        size: item.specifications || undefined,
        groupKey: `${category}-${item.name}-${item.specifications}`,
        sourceEntityIds: [],
        componentDefinitionId,
      };
    });

    const recalculate = () => {
      if (costBomItems.length === 0) {
        previousEstimateRef.current = null;
        setCostEstimate(null);
        setCostDelta(null);
        setLastUpdated(new Date());
        return;
      }

      const nextEstimate = costCalculationService.calculateProjectCost(
        costBomItems,
        calculationSettings,
        componentPricing
      );
      const delta = costCalculationService.calculateCostDelta(previousEstimateRef.current, nextEstimate);

      previousEstimateRef.current = nextEstimate;
      setCostEstimate(nextEstimate);
      setCostDelta(delta);
      setLastUpdated(new Date());
    };

    const previousEntitySignature = previousEntitySignatureRef.current;
    const previousSettingsSignature = previousSettingsSignatureRef.current;
    const previousPricingSignature = previousPricingSignatureRef.current;

    let trigger: 'none' | 'immediate' | 'debounced' = 'none';

    if (!previousEntitySignature || !previousSettingsSignature || !previousPricingSignature) {
      trigger = 'immediate';
    } else if (
      previousSettingsSignature !== settingsSignature ||
      previousPricingSignature !== pricingSignature
    ) {
      trigger = 'immediate';
    } else {
      trigger = bomGenerationService.getRecalculationTrigger(previousEntitySignature, entitySignature);
    }

    previousEntitySignatureRef.current = entitySignature;
    previousSettingsSignatureRef.current = settingsSignature;
    previousPricingSignatureRef.current = pricingSignature;

    if (trigger === 'none') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (trigger === 'immediate') {
      recalculate();
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      recalculate();
      debounceTimerRef.current = null;
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    bomItems,
    calculationSettings,
    componentDefinitions,
    entitySignature,
    settingsSignature,
    pricingSignature,
  ]);

  // Group items by type
  const grouped = useMemo(() => {
    const ducts = bomItems.filter((item) => item.type === 'Duct');
    const equipment = bomItems.filter((item) => item.type === 'Equipment');
    const fittings = bomItems.filter((item) => item.type === 'Fitting');
    const accessories = bomItems.filter(
      (item) => item.type !== 'Duct' && item.type !== 'Equipment' && item.type !== 'Fitting'
    );

    return {
      all: bomItems,
      ducts,
      equipment,
      fittings,
      accessories,
      totals: {
        totalItems: bomItems.length,
        totalQuantity: bomItems.reduce((sum, item) => sum + item.quantity, 0),
      },
      costEstimate,
      costDelta,
      lastUpdated,
    };
  }, [bomItems, costEstimate, costDelta, lastUpdated]);

  return grouped;
}
