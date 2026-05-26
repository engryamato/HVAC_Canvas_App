import { SYSTEM_COLOR_MAP, normalizeSystemType, type LegacySystemType, type SystemType } from './systemColorMap';

export type ElementVisualCategory =
  | 'duct'
  | 'fitting'
  | 'accessory'
  | 'equipment'
  | 'airflowArrow'
  | 'airflowText'
  | 'systemLabel'
  | 'nonSystemLabel'
  | 'endMarker'
  | 'sectionMarker'
  | 'constructionIndicator'
  | 'equipmentPort';

export type VisualState =
  | 'normal'
  | 'selected'
  | 'hover'
  | 'dragPreview'
  | 'snapPreview'
  | 'connectionPreview'
  | 'invalidPlacement'
  | 'validationWarning';

export interface ElementColorParams {
  systemType?: SystemType | LegacySystemType | string | null;
  elementCategory: ElementVisualCategory;
  visualState: VisualState;
}

const INTERACTION_COLOR_MAP: Partial<Record<VisualState, string>> = {
  hover: '#0F766E',
  dragPreview: '#0284C7',
  snapPreview: '#7C3AED',
  connectionPreview: '#2563EB',
  invalidPlacement: '#D32F2F',
  validationWarning: '#F59E0B',
};

export function getElementColor({ systemType, elementCategory, visualState }: ElementColorParams): string {
  if (visualState === 'selected') {
    return '#1976D2';
  }

  const interactionColor = INTERACTION_COLOR_MAP[visualState];
  if (interactionColor) {
    return interactionColor;
  }

  if (elementCategory === 'nonSystemLabel') {
    return '#424242';
  }

  const colors = SYSTEM_COLOR_MAP[normalizeSystemType(systemType)];

  switch (elementCategory) {
    case 'duct':
    case 'fitting':
    case 'endMarker':
    case 'sectionMarker':
    case 'constructionIndicator':
      return colors.ductAndFitting;
    case 'accessory':
    case 'equipment':
    case 'equipmentPort':
      return colors.accessoryAndEquipment;
    case 'airflowArrow':
    case 'airflowText':
      return colors.airflow;
    case 'systemLabel':
      return colors.label;
  }
}
