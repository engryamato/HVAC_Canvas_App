import { useEffect, useRef } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import type { Duct, Room } from '@/core/schema';
import { calculateRoomValues } from '../calculators/ventilation';
import {
  calculateDuctArea,
  calculateVelocity,
  calculateEquivalentDiameter,
} from '../calculators/ductSizing';
import { calculateFrictionLoss } from '../calculators/pressureDrop';

const MATERIAL_ROUGHNESS: Record<Duct['props']['material'], number> = {
  galvanized: 0.0005,
  stainless: 0.0002,
  aluminum: 0.0002,
  flex: 0.003,
};

const VELOCITY_LIMITS = {
  residential: { min: 600, max: 900 },
  commercial: { min: 1000, max: 1500 },
  industrial: { min: 1500, max: 2500 },
  kitchen_exhaust: { min: 1500, max: 4000 },
} as const;

type VelocityProfile = keyof typeof VELOCITY_LIMITS;

/**
 * Hook to recalculate entity derived values when props change.
 * Debounces updates to avoid thrashing during rapid edits.
 */
export function useCalculations(profile: VelocityProfile = 'commercial') {
  const entities = useEntityStore((state) =>
    state.allIds.map((id) => state.byId[id]).filter((e): e is NonNullable<typeof e> => Boolean(e))
  );
  const updateEntity = useEntityStore((state) => state.updateEntity);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(() => {
      entities.forEach((entity) => {
        if (entity.type === 'room') {
          const nextCalc = calculateRoomValues(entity as Room);
          if (roomChanged(entity.calculated, nextCalc)) {
            updateEntity(entity.id, { calculated: nextCalc, modifiedAt: new Date().toISOString() });
          }
        }

        if (entity.type === 'duct') {
          const duct = entity as Duct;
          const nextCalc = calculateDuct(duct);
          const nextWarnings = buildVelocityWarning(nextCalc.velocity, profile);

          const changed =
            duct.calculated.area !== nextCalc.area ||
            duct.calculated.velocity !== nextCalc.velocity ||
            duct.calculated.frictionLoss !== nextCalc.frictionLoss ||
            (duct.warnings?.velocity || '') !== (nextWarnings?.velocity || '');

          if (changed) {
            updateEntity(duct.id, {
              calculated: nextCalc,
              warnings: nextWarnings,
              modifiedAt: new Date().toISOString(),
            });
          }
        }
      });
    }, 300);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [entities, updateEntity, profile]);
}

function roomChanged(a: Room['calculated'], b: Room['calculated']): boolean {
  return a.area !== b.area || a.volume !== b.volume || a.requiredCFM !== b.requiredCFM;
}

function calculateDuct(duct: Duct): Duct['calculated'] {
  const area = calculateDuctArea(duct.props.shape, {
    diameter: duct.props.shape === 'round' ? duct.props.diameter : undefined,
    width: duct.props.shape === 'rectangular' ? duct.props.width : undefined,
    height: duct.props.shape === 'rectangular' ? duct.props.height : undefined,
  });

  const velocity = calculateVelocity(duct.props.airflow, area);

  const equivalentDiameter =
    duct.props.shape === 'round'
      ? (duct.props.diameter ?? 0)
      : calculateEquivalentDiameter(duct.props.width ?? 0, duct.props.height ?? 0);

  const frictionLoss = calculateFrictionLoss(
    velocity,
    equivalentDiameter || 1,
    duct.props.length,
    MATERIAL_ROUGHNESS[duct.props.material]
  );

  return {
    area,
    velocity,
    frictionLoss,
  };
}

function buildVelocityWarning(
  velocity: number,
  profile: VelocityProfile
): Duct['warnings'] | undefined {
  const range = VELOCITY_LIMITS[profile];
  if (!range) {
    return undefined;
  }
  if (velocity === 0) {
    return undefined;
  }

  if (velocity < range.min) {
    return {
      velocity: `Velocity ${velocity.toFixed(0)} FPM is below ${profile} range (${range.min}-${range.max}).`,
    };
  }

  if (velocity > range.max) {
    return {
      velocity: `Velocity ${velocity.toFixed(0)} FPM exceeds ${profile} range (${range.min}-${range.max}).`,
    };
  }

  return undefined;
}

export default useCalculations;
