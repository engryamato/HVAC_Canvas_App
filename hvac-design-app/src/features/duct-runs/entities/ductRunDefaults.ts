import type { DuctRun, DuctRunFamily, DuctRunProps } from '@/core/schema/duct-run.schema';
import { pixelsToFeet } from '@/core/constants/coordinates';
import { getActiveSectionLength } from '../utils/getActiveSectionLength';
import { recomputeDuctRunSegments } from '../utils/recomputeDuctRunSegments';

let ductRunCounter = 1;

export function resetDuctRunCounter(): void {
  ductRunCounter = 1;
}

export function createDuctRun(
  overrides: Partial<DuctRunProps> & {
    start: { x: number; y: number };
    end: { x: number; y: number };
    angle?: number;
    family?: DuctRunFamily;
  }
): DuctRun {
  const now = new Date().toISOString();
  const dx = overrides.end.x - overrides.start.x;
  const dy = overrides.end.y - overrides.start.y;
  const installLength = overrides.installLength ?? pixelsToFeet(Math.hypot(dx, dy));
  const shape = overrides.shape ?? 'round';
  const baseProps = {
    name: overrides.name ?? `Duct Run ${ductRunCounter++}`,
    shape,
    engineeringSystem: overrides.engineeringSystem ?? overrides.family ?? 'standard_duct',
    installLength,
    sectionLengthOverride: overrides.sectionLengthOverride,
    startPoint: overrides.start,
    endPoint: overrides.end,
    designStartPoint: overrides.designStartPoint ?? overrides.start,
    designEndPoint: overrides.designEndPoint ?? overrides.end,
    designLength: overrides.designLength ?? installLength,
    material: overrides.material ?? 'galvanized',
    airflow: overrides.airflow ?? 0,
    staticPressure: overrides.staticPressure ?? 0.1,
    systemType: overrides.systemType,
    insulationThickness: overrides.insulationThickness,
    serviceId: overrides.serviceId,
    catalogItemId: overrides.catalogItemId,
    specialtyToolId: overrides.specialtyToolId,
  };
  const props =
    shape === 'rectangular' || shape === 'flat_oval'
      ? {
          ...baseProps,
          shape,
          width: 'width' in overrides ? overrides.width ?? 12 : 12,
          height: 'height' in overrides ? overrides.height ?? 12 : 12,
        }
      : {
          ...baseProps,
          shape,
          diameter: 'diameter' in overrides ? overrides.diameter ?? 12 : 12,
        };
  const temporaryRun = { props } as DuctRun;

  return {
    id: crypto.randomUUID(),
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: now,
      modifiedAt: now,
      props: {
        ...props,
        segments:
          overrides.segments ??
        recomputeDuctRunSegments(installLength, getActiveSectionLength(temporaryRun)),
    } as DuctRun['props'],
    calculated: {
      area: 0,
      velocity: 0,
      frictionLoss: 0,
    },
  };
}
