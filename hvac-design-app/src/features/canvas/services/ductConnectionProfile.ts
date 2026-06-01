import type { Duct, DuctRun } from '@/core/schema';

export type DuctConnectionEntity = Duct | DuctRun;
export type DuctConnectionMarkerKind = 'circle' | 'rect';

export interface DuctConnectionMetadata {
  shape: DuctConnectionEntity['props']['shape'];
  diameter?: number;
  width?: number;
  height?: number;
  engineeringSystem: DuctConnectionEntity['props']['engineeringSystem'];
  airflow: number;
  staticPressure: number;
  material: DuctConnectionEntity['props']['material'];
  systemType?: DuctConnectionEntity['props']['systemType'];
  segments?: DuctRun['props']['segments'];
}

export interface DuctConnectionProfile {
  markerKind: DuctConnectionMarkerKind;
  visualSize: number;
  metadata: DuctConnectionMetadata;
}

export function resolveDuctConnectionProfile(duct: DuctConnectionEntity): DuctConnectionProfile {
  const props = duct.props;
  const isRoundVisual = props.shape === 'round' || props.shape === 'flexible';
  const diameter = 'diameter' in props ? props.diameter : undefined;
  const width = 'width' in props ? props.width : undefined;
  const height = 'height' in props ? props.height : undefined;

  return {
    markerKind: isRoundVisual ? 'circle' : 'rect',
    visualSize: isRoundVisual ? diameter ?? 0 : width ?? 0,
    metadata: {
      shape: props.shape,
      diameter,
      width,
      height,
      engineeringSystem: props.engineeringSystem,
      airflow: props.airflow,
      staticPressure: props.staticPressure,
      material: props.material,
      systemType: props.systemType,
      ...(duct.type === 'duct_run' ? { segments: duct.props.segments } : {}),
    },
  };
}
