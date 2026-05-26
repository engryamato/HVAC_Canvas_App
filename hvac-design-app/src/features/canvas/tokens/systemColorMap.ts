export type SystemType =
  | 'supply'
  | 'return'
  | 'exhaust'
  | 'outside'
  | 'relief'
  | 'transfer'
  | 'general'
  | 'unassigned'
  | 'other';

export type LegacySystemType = 'outside_air';

export interface SystemColorToken {
  ductAndFitting: string;
  accessoryAndEquipment: string;
  airflow: string;
  label: string;
}

export const SYSTEM_COLOR_MAP: Record<SystemType, SystemColorToken> = {
  supply: { ductAndFitting: '#66BB6A', accessoryAndEquipment: '#2E7D32', airflow: '#2E7D32', label: '#2E7D32' },
  return: { ductAndFitting: '#42A5F5', accessoryAndEquipment: '#1565C0', airflow: '#1565C0', label: '#1565C0' },
  exhaust: { ductAndFitting: '#EF5350', accessoryAndEquipment: '#C62828', airflow: '#C62828', label: '#C62828' },
  outside: { ductAndFitting: '#26C6DA', accessoryAndEquipment: '#00838F', airflow: '#00838F', label: '#00838F' },
  relief: { ductAndFitting: '#AB47BC', accessoryAndEquipment: '#6A1B9A', airflow: '#6A1B9A', label: '#6A1B9A' },
  transfer: { ductAndFitting: '#FFA726', accessoryAndEquipment: '#EF6C00', airflow: '#EF6C00', label: '#EF6C00' },
  general: { ductAndFitting: '#9E9E9E', accessoryAndEquipment: '#757575', airflow: '#757575', label: '#757575' },
  unassigned: { ductAndFitting: '#9E9E9E', accessoryAndEquipment: '#757575', airflow: '#757575', label: '#757575' },
  other: { ductAndFitting: '#9E9E9E', accessoryAndEquipment: '#757575', airflow: '#757575', label: '#757575' },
};

export function normalizeSystemType(systemType: unknown): SystemType {
  if (systemType === 'outside_air') {
    return 'outside';
  }

  if (typeof systemType !== 'string') {
    return 'unassigned';
  }

  return systemType in SYSTEM_COLOR_MAP ? (systemType as SystemType) : 'unassigned';
}
