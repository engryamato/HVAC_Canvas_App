export type HealthStatus = 'ok' | 'error' | 'warning';
export type DuctSystemStatus = 'balanced' | 'unbalanced' | 'not_calculated';
export type ActivityAction = 'Added' | 'Moved' | 'Deleted' | 'Modified' | string;
export type UnitSystem = 'imperial' | 'metric';
export type ElementSelectionKey =
  | 'Ducts'
  | 'Fittings'
  | 'Equipment'
  | 'Rooms'
  | 'Rectangular'
  | 'Round'
  | 'Flex'
  | 'Elbows'
  | 'Tees'
  | 'Reducers';

export interface ProjectMetadata {
  name: string;
  description: string;
  number: string;
  client: string;
  engineer: string;
  created: string;
  modified: string;
  version: string;
  author: string;
}

export interface EngineeringSettings {
  designStandard: string;
  shortStandard: string;
  airflowUnits: string;
  pressureUnits: string;
  temperatureUnits: string;
  safetyFactors: string;
  autoCalculate: boolean;
}

export interface HealthItem {
  id: string;
  status: HealthStatus;
  label: string;
  count?: number;
}

export interface DuctSystem {
  id: string;
  name: string;
  segmentCount: number;
  totalLength: number;
  surfaceArea: number;
  designAirflow: number | null;
  pressureLoss: number | null;
  status: DuctSystemStatus;
}

export interface ElementInventory {
  inventory: Record<'Ducts' | 'Fittings' | 'Equipment' | 'Rooms', number>;
  breakdown: Record<'Rectangular' | 'Round' | 'Flex' | 'Elbows' | 'Tees' | 'Reducers', number>;
}

export interface ActivityItem {
  id: string | number;
  action: ActivityAction;
  type: string;
  target: string;
  time: string;
}

export interface InspectorSectionState {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface InspectorFocusResult {
  ids: string[];
  shouldFocus: boolean;
  status: string;
}

export interface InspectorPanelProps {
  project: ProjectMetadata;
  engineering: EngineeringSettings;
  health: HealthItem[];
  systems: DuctSystem[];
  unitSystem: UnitSystem;
  elements: ElementInventory;
  recentActivity: ActivityItem[];
  recentActivityLimit: number;
  recentActivityTotal: number;
  canUndo: boolean;
  canRedo: boolean;
  actionStatus?: string | null;
  sectionStates?: Partial<Record<'project' | 'engineering' | 'health' | 'systems' | 'elements' | 'activity', InspectorSectionState>>;
  onToggleAutoCalculate: (nextValue: boolean) => void;
  onEditEngineeringSettings: () => void;
  onLocateHealthIssue: (issueId: string) => InspectorFocusResult;
  onSelectAllInvalid: () => InspectorFocusResult;
  onAutoFixGeometry: () => void;
  onSelectElementType: (type: ElementSelectionKey) => InspectorFocusResult;
  onUndo: () => void;
  onRedo: () => void;
}
