import { useMemo } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import { useShallow } from 'zustand/react/shallow';
import { type Duct } from '@/core/schema/duct.schema';
import { type Equipment } from '@/core/schema/equipment.schema';
import { type Entity } from '@/core/schema/project-file.schema';

export interface SystemCalculations {
  totalCFM: number;
  maxStaticPressure: number;
  totalDuctLength: number;
  totalDuctWeight: number;
  criticalPathId?: string;
}

/**
 * Pure function to calculate system metrics from a list of entities.
 * Can be used by hooks or standard functions (like auto-save).
 */
export function calculateSystemMetrics(entities: Record<string, Entity> | Entity[]): SystemCalculations {
  let totalCFM = 0;
  let totalDuctLength = 0;
  let totalDuctWeight = 0;
  let maxStaticPressure = 0;

  const entityList = Array.isArray(entities) ? entities : Object.values(entities);

  for (const entity of entityList) {
    if (entity.type === 'equipment') {
      const eq = entity as Equipment;
      // Sum up capacity for primary equipment
      if (eq.props.equipmentType === 'air_handler' || eq.props.equipmentType === 'rtu' || eq.props.equipmentType === 'furnace') {
         totalCFM += eq.props.capacity;
         // Track max static pressure capability
         maxStaticPressure = Math.max(maxStaticPressure, eq.props.staticPressure);
      }
    }

    if (entity.type === 'duct') {
      const duct = entity as Duct;
      totalDuctLength += duct.props.length;

      // Weight estimation
      const perimeter = duct.props.shape === 'round' 
          ? Math.PI * (duct.props.diameter || 0) 
          : 2 * ((duct.props.width || 0) + (duct.props.height || 0));
      
      const surfaceArea = (perimeter / 12) * duct.props.length;
      const weightFactor = 1.0; 
      
      totalDuctWeight += surfaceArea * weightFactor;
    }
  }

  return {
    totalCFM,
    maxStaticPressure,
    totalDuctLength: Number(totalDuctLength.toFixed(1)),
    totalDuctWeight: Number(totalDuctWeight.toFixed(1)),
  };
}

/**
 * Hook to calculate system-wide metrics.
 * Uses calculateSystemMetrics internally.
 */
export function useSystemCalculations(): SystemCalculations {
  const entities = useEntityStore(
    useShallow((state) => state.byId)
  );

  const calculations = useMemo(() => {
    return calculateSystemMetrics(entities);
  }, [entities]);

  return calculations;
}
