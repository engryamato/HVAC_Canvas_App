import type { Duct } from '@/core/schema';
import { DEFAULT_ROUND_DUCT_PROPS } from '@/core/schema/duct.schema';

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
 * Calculate duct values from dimensions and airflow
 */
export function calculateDuctValues(
  shape: 'round' | 'rectangular',
  airflow: number,
  diameter?: number,
  width?: number,
  height?: number
): { area: number; velocity: number; frictionLoss: number } {
  let area: number;

  if (shape === 'round' && diameter !== undefined) {
    // Area = π * r² (in sq inches)
    area = Math.PI * Math.pow(diameter / 2, 2);
  } else if (shape === 'rectangular' && width !== undefined && height !== undefined) {
    // Area = width * height (in sq inches)
    area = width * height;
  } else {
    area = 0;
  }

  // Convert area from sq inches to sq ft
  const areaFt = area / 144;

  // Velocity = CFM / Area (FPM)
  const velocity = areaFt > 0 ? airflow / areaFt : 0;

  // Simplified friction loss calculation (in.w.g./100ft)
  // Real formula would use Darcy-Weisbach or ASHRAE tables
  const frictionLoss = velocity > 0 ? 0.0001 * Math.pow(velocity / 100, 2) : 0;

  return {
    area: Math.round(area * 100) / 100,
    velocity: Math.round(velocity * 100) / 100,
    frictionLoss: Math.round(frictionLoss * 10000) / 10000,
  };
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
  }>
): Duct {
  const ductNumber = getNextDuctNumber();
  const now = new Date().toISOString();

  const shape = overrides?.shape ?? DEFAULT_ROUND_DUCT_PROPS.shape;

  // Build props based on shape
  const baseProps = {
    name: overrides?.name ?? `Duct ${ductNumber}`,
    shape,
    length: overrides?.length ?? DEFAULT_ROUND_DUCT_PROPS.length,
    material: overrides?.material ?? DEFAULT_ROUND_DUCT_PROPS.material,
    airflow: overrides?.airflow ?? DEFAULT_ROUND_DUCT_PROPS.airflow,
    staticPressure: overrides?.staticPressure ?? DEFAULT_ROUND_DUCT_PROPS.staticPressure,
  };

  const props =
    shape === 'round'
      ? {
          ...baseProps,
          diameter: overrides?.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter,
        }
      : {
          ...baseProps,
          width: overrides?.width ?? 12,
          height: overrides?.height ?? 12,
        };

  const calculated = calculateDuctValues(
    shape,
    props.airflow,
    'diameter' in props ? props.diameter : undefined,
    'width' in props ? props.width : undefined,
    'height' in props ? props.height : undefined
  );

  return {
    id: crypto.randomUUID(),
    type: 'duct',
    transform: {
      x: overrides?.x ?? 0,
      y: overrides?.y ?? 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: props as Duct['props'],
    calculated,
  };
}

export default createDuct;
