'use client';

import { useMemo } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import { generateBillOfMaterials } from '@/features/export/csv';
import type { BomItem } from '@/features/export/csv';

/**
 * Grouped BOM items by category
 */
export interface GroupedBomItems {
  ducts: BomItem[];
  equipment: BomItem[];
  fittings: BomItem[];
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
  const entities = useEntityStore((state) => ({
    byId: state.byId,
    allIds: state.allIds,
  }));

  // Generate BOM items from entities
  const bomItems = useMemo(() => {
    return generateBillOfMaterials(entities);
  }, [entities]);

  // Group items by type
  const grouped = useMemo(() => {
    return {
      ducts: bomItems.filter(item => item.type === 'Duct'),
      equipment: bomItems.filter(item => item.type === 'Equipment'),
      fittings: bomItems.filter(item => item.type === 'Fitting'),
    };
  }, [bomItems]);

  return grouped;
}