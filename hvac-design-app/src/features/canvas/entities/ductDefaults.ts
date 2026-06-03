import type { Duct } from '@/core/schema';
import { DEFAULT_ROUND_DUCT_PROPS } from '@/core/schema/duct.schema';
import { getInitialSizePostureSource } from '@/core/projectMode/projectMode';
import {
  calculateDuctArea,
  calculateVelocity,
  calculateEquivalentDiameter,
} from '../calculators/ductSizing';
import { calculateFrictionLoss } from '../calculators/pressureDrop';

/**
 * Counter for auto-incrementing duct names
 */
let ductCounter = 1;

/**
 * Reset the duct counter (useful for testing)
 */
export function resetDuctCounter(): void {
  ductCounter = 1;
}

/**
 * Get the next duct number and increment counter
 */
export function getNextDuctNumber(): number {
  return ductCounter++;
}

/**
 * Create a new duct entity with default values
 */
export function createDuct(
  overrides?: Partial<{
    name: string;
    x: number;
    y: number;
    shape: 'round' | 'rectangular';
    diameter: number;
    width: number;
    height: number;
    length: number;
    material: Duct['props']['material'];
    airflow: number;
    staticPressure: number;
    serviceId: string;
    catalogItemId: string;
    engineeringSystem: Duct['props']['engineeringSystem'];
    specialtyToolId: string;
  }>
): Duct {
  const ductNumber = getNextDuctNumber();
  const now = new Date().toISOString();

  const shape = overrides?.shape ?? DEFAULT_ROUND_DUCT_PROPS.shape;

  // WS8: in Estimation mode the primary dimension starts manual-first
  // ('default', awaiting user entry); Design keeps the legacy 'computed' start.
  // Only the provenance label changes — 'default'/'computed' are both freely
  // recomputed by the sizing engine (only 'specified' is protected).
  const postureSource = getInitialSizePostureSource();

  // Build props based on shape
  const baseProps = {
    name: overrides?.name ?? `${shape === 'round' ? 'Round' : 'Rectangular'} Duct ${ductNumber}`,
    shape,
    length: overrides?.length ?? DEFAULT_ROUND_DUCT_PROPS.length,
    material: overrides?.material ?? DEFAULT_ROUND_DUCT_PROPS.material,
    airflow: overrides?.airflow ?? 0, // Flow calculated from topology
    staticPressure: overrides?.staticPressure ?? DEFAULT_ROUND_DUCT_PROPS.staticPressure,
    serviceId: overrides?.serviceId,
    catalogItemId: overrides?.catalogItemId,
    engineeringSystem: overrides?.engineeringSystem ?? DEFAULT_ROUND_DUCT_PROPS.engineeringSystem,
    specialtyToolId: overrides?.specialtyToolId,
  };
  const props =
    shape === 'round'
      ? {
          ...baseProps,
          diameter: overrides?.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter,
          provenance: {
            diameter: overrides?.diameter === undefined ? postureSource : 'computed' as const,
          },
        }
      : {
          ...baseProps,
          width: overrides?.width ?? 12,
          height: overrides?.height ?? 8,
          provenance: {
            width: overrides?.width === undefined ? postureSource : 'computed' as const,
            height: overrides?.height === undefined || overrides.height === 8 ? 'default' as const : 'computed' as const,
          },
        };

  const calculated = calculateDuctValues(shape, props as Duct['props']);

  return {
    id: crypto.randomUUID(),
    type: 'duct',
    transform: {
      x: overrides?.x ?? 0,
      y: overrides?.y ?? 0,
      elevation: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 5, // Ducts render above rooms
    createdAt: now,
    modifiedAt: now,
    props: props as Duct['props'],
    calculated,
  };
}

function calculateDuctValues(shape: 'round' | 'rectangular', props: Duct['props']) {
  const area = calculateDuctArea(shape, {
    diameter: 'diameter' in props ? props.diameter : undefined,
    width: 'width' in props ? props.width : undefined,
    height: 'height' in props ? props.height : undefined,
  });

  const velocity = calculateVelocity(props.airflow, area);

  const diameterForLoss =
    shape === 'round' && 'diameter' in props && props.diameter
      ? props.diameter
      : calculateEquivalentDiameter(
          'width' in props ? (props.width ?? 0) : 0,
          'height' in props ? (props.height ?? 0) : 0
        );

  const roughnessMap: Record<Duct['props']['material'], number> = {
    galvanized: 0.0005,
    stainless: 0.0002,
    aluminum: 0.0002,
    flex: 0.003,
  };

  const frictionLoss = calculateFrictionLoss(
    velocity,
    diameterForLoss || 1,
    props.length,
    roughnessMap[props.material]
  );

  return {
    area,
    velocity,
    frictionLoss,
  };
}

export default createDuct;
