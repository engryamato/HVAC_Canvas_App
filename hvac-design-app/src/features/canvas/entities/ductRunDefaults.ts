import type { DuctRun, DuctRunShape } from '@/core/schema';
import { DEFAULT_ROUND_DUCT_PROPS } from '@/core/schema/duct.schema';
import {
  calculateDuctArea,
  calculateEquivalentDiameter,
  calculateVelocity,
} from '../calculators/ductSizing';
import { calculateFrictionLoss } from '../calculators/pressureDrop';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';

let ductRunCounter = 1;

export function resetDuctRunCounter(): void {
  ductRunCounter = 1;
}

function getNextDuctRunNumber(): number {
  return ductRunCounter++;
}

type CreateDuctRunOverrides = Partial<{
  name: string;
  x: number;
  y: number;
  shape: DuctRunShape;
  diameter: number;
  width: number;
  height: number;
  installLength: number;
  material: DuctRun['props']['material'];
  airflow: number;
  staticPressure: number;
  serviceId: string;
  catalogItemId: string;
  engineeringSystem: DuctRun['props']['engineeringSystem'];
  specialtyToolId: string;
  sectionLengthOverride: number;
}>;

export function createDuctRun(overrides?: CreateDuctRunOverrides): DuctRun {
  const now = new Date().toISOString();
  const shape = overrides?.shape ?? 'round';
  const installLength = overrides?.installLength ?? 10;
  const runNumber = getNextDuctRunNumber();

  const propsBase = {
    name:
      overrides?.name ??
      `${shape === 'round' || shape === 'flexible' ? 'Round' : 'Rectangular'} Duct Run ${runNumber}`,
    engineeringSystem: overrides?.engineeringSystem ?? DEFAULT_ROUND_DUCT_PROPS.engineeringSystem,
    specialtyToolId: overrides?.specialtyToolId,
    shape,
    material: overrides?.material ?? (shape === 'flexible' ? 'flex' : DEFAULT_ROUND_DUCT_PROPS.material),
    airflow: overrides?.airflow ?? DEFAULT_ROUND_DUCT_PROPS.airflow,
    staticPressure: overrides?.staticPressure ?? DEFAULT_ROUND_DUCT_PROPS.staticPressure,
    installLength,
    sectionLengthOverride: overrides?.sectionLengthOverride,
    serviceId: overrides?.serviceId,
    catalogItemId: overrides?.catalogItemId,
  };

  const props =
    shape === 'round' || shape === 'flexible'
      ? ({
          ...propsBase,
          diameter: overrides?.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter,
        } as DuctRun['props'])
      : ({
          ...propsBase,
          width: overrides?.width ?? 12,
          height: overrides?.height ?? 8,
        } as DuctRun['props']);

  props.segments = recomputeDuctRunSegments(
    installLength,
    getActiveSectionLength({ props } as Pick<DuctRun, 'props'>)
  );

  return {
    id: crypto.randomUUID(),
    type: 'duct_run',
    transform: {
      x: overrides?.x ?? 0,
      y: overrides?.y ?? 0,
      elevation: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props,
    calculated: calculateDuctRunValues(props),
  };
}

function calculateDuctRunValues(props: DuctRun['props']) {
  const area = calculateDuctArea(props.shape === 'round' || props.shape === 'flexible' ? 'round' : 'rectangular', {
    diameter: 'diameter' in props ? props.diameter : undefined,
    width: 'width' in props ? props.width : undefined,
    height: 'height' in props ? props.height : undefined,
  });

  const velocity = calculateVelocity(props.airflow, area);

  const diameterForLoss =
    (props.shape === 'round' || props.shape === 'flexible') && 'diameter' in props && props.diameter
      ? props.diameter
      : calculateEquivalentDiameter(
          'width' in props ? (props.width ?? 0) : 0,
          'height' in props ? (props.height ?? 0) : 0
        );

  const roughnessMap: Record<DuctRun['props']['material'], number> = {
    galvanized: 0.0005,
    stainless: 0.0002,
    aluminum: 0.0002,
    flex: 0.003,
  };

  return {
    area,
    velocity,
    frictionLoss: calculateFrictionLoss(
      velocity,
      diameterForLoss || 1,
      props.installLength,
      roughnessMap[props.material]
    ),
  };
}
