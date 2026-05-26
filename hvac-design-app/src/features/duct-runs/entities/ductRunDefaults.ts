import type { DuctRun, DuctRunProps } from '@/core/schema/duct-run.schema';
import { pixelsToFeet } from '@/core/constants/coordinates';
import { DEFAULT_FABRICATION_PROFILE } from '@/core/schema/fabrication-profile.schema';
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
  }
): DuctRun {
  const now = new Date().toISOString();
  const dx = overrides.end.x - overrides.start.x;
  const dy = overrides.end.y - overrides.start.y;
  const installLength = overrides.installLength ?? pixelsToFeet(Math.hypot(dx, dy));
  const angle = overrides.angle ?? (Math.atan2(dy, dx) * 180) / Math.PI;
  const shape = overrides.shape ?? 'round';
  const baseProps = {
    name: overrides.name ?? `Duct Run ${ductRunCounter++}`,
    shape,
    family: overrides.family ?? overrides.engineeringSystem ?? 'standard_duct',
    engineeringSystem: overrides.engineeringSystem ?? overrides.family ?? 'standard_duct',
    installLength,
    sectionLengthOverride: overrides.sectionLengthOverride,
    angle,
    start: overrides.start,
    end: overrides.end,
    material: overrides.material ?? 'galvanized',
    airflow: overrides.airflow ?? 0,
    staticPressure: overrides.staticPressure ?? 0.1,
    systemType: overrides.systemType,
    constructionType: overrides.constructionType ?? (shape === 'flexible' ? 'flexible' : 'singleWall'),
    linerThickness: overrides.linerThickness,
    innerWallThickness: overrides.innerWallThickness,
    wrapThickness: overrides.wrapThickness,
    insulationThickness: overrides.insulationThickness,
    ribSpacing: overrides.ribSpacing,
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
        recomputeDuctRunSegments(installLength, getActiveSectionLength(temporaryRun, DEFAULT_FABRICATION_PROFILE)),
    } as DuctRun['props'],
  };
}
