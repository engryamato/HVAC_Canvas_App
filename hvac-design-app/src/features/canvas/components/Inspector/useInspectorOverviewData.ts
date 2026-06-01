'use client';

import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { redo, undo, useCanRedo, useCanUndo, useHistoryStore } from '@/core/commands';
import type { ReversibleCommand } from '@/core/commands';
import type { Entity } from '@/core/schema';
import { useCalculationSettingsStore } from '@/core/store/calculationSettingsStore';
import { useDialogStore } from '@/core/store/dialogStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import type { ValidationResult } from '@/core/store/validationStore';
import { useValidationStore } from '@/core/store/validationStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore } from '../../store/viewportStore';
import { buildGeometryRepairPlan } from '../../services/geometryRepairService';
import { buildInspectorFocusRequest } from '../../utils/inspectorFocus';
import type {
  ActivityItem,
  DuctSystem,
  ElementInventory,
  ElementSelectionKey,
  EngineeringSettings,
  HealthItem,
  InspectorPanelProps,
  ProjectMetadata,
} from './inspectorOverviewTypes';

export const RECENT_ACTIVITY_LIMIT = 10;

type EntityLike = Pick<Entity, 'id' | 'type'> & {
  props?: Record<string, unknown>;
  calculated?: Record<string, unknown>;
  modifiedAt?: string;
  transform?: {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
  };
};

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PointLike {
  x: number;
  y: number;
}

type CalculationSettingsWithAuto = NonNullable<ReturnType<typeof useCalculationSettingsStore.getState>['currentSettings']> & {
  autoCalculate?: boolean;
};

function fallback(value: unknown, empty = '-'): string {
  if (typeof value !== 'string') {
    return empty;
  }
  return value.trim().length > 0 ? value : empty;
}

function isOpaqueId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readableOptionalId(value: unknown, fallbackText = 'Selected item'): string {
  if (typeof value !== 'string' || value.trim().length === 0 || isOpaqueId(value.trim())) {
    return fallbackText;
  }
  return value;
}

function formatDate(value: string | undefined, includeTime = false): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
}

function titleize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function numberProp(entity: EntityLike, key: string): number | null {
  return asNumber(entity.props?.[key]);
}

function pointProp(entity: EntityLike, key: string): PointLike | null {
  const value = entity.props?.[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const point = value as Record<string, unknown>;
  const x = asNumber(point.x);
  const y = asNumber(point.y);
  return x === null || y === null ? null : { x, y };
}

export function buildEntityBounds(entities: EntityLike[]): Bounds | null {
  const boxes = entities
    .map((entity) => {
      const start = pointProp(entity, 'startPoint') ?? pointProp(entity, 'start');
      const end = pointProp(entity, 'endPoint') ?? pointProp(entity, 'end');
      if (start && end) {
        const minX = Math.min(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxX = Math.max(start.x, end.x);
        const maxY = Math.max(start.y, end.y);
        return { x: minX, y: minY, width: Math.max(maxX - minX, 1), height: Math.max(maxY - minY, 1) };
      }

      const x = numberProp(entity, 'x') ?? numberProp(entity, 'left') ?? asNumber(entity.transform?.x);
      const y = numberProp(entity, 'y') ?? numberProp(entity, 'top') ?? asNumber(entity.transform?.y);
      const scaleX = asNumber(entity.transform?.scaleX) ?? 1;
      const scaleY = asNumber(entity.transform?.scaleY) ?? 1;
      const width = (numberProp(entity, 'width') ?? numberProp(entity, 'w') ?? 1) * scaleX;
      const height =
        entity.type === 'equipment'
          ? (numberProp(entity, 'depth') ?? numberProp(entity, 'height') ?? numberProp(entity, 'h') ?? 1) * scaleY
          : (numberProp(entity, 'height') ?? numberProp(entity, 'h') ?? 1) * scaleY;

      if (x === null || y === null) {
        return null;
      }

      return { x, y, width: Math.max(width, 1), height: Math.max(height, 1) };
    })
    .filter((box): box is Bounds => box !== null);

  if (boxes.length === 0) {
    return null;
  }

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function entityName(entity: EntityLike | undefined): string {
  return fallback(entity?.props?.name, entity?.id ?? 'Unknown');
}

function getLength(entity: EntityLike): number {
  return asNumber(entity.props?.length) ?? asNumber(entity.props?.installLength) ?? 0;
}

function getSurfaceArea(entity: EntityLike): number {
  const explicit = asNumber(entity.calculated?.surfaceArea);
  if (explicit !== null) {
    return explicit;
  }

  const area = asNumber(entity.calculated?.area);
  if (area !== null) {
    return area * getLength(entity);
  }

  return 0;
}

function getPressureLoss(entity: EntityLike): number {
  return (
    asNumber(entity.calculated?.pressureLoss) ??
    asNumber(entity.calculated?.cumulativePressureDrop) ??
    asNumber(entity.calculated?.frictionLoss) ??
    0
  );
}

function getSystemName(entity: EntityLike): string {
  return fallback(entity.props?.systemName, fallback(entity.props?.engineeringSystem, 'Unassigned'));
}

function getElementIdsByType(entities: EntityLike[], type: ElementSelectionKey): string[] {
  return entities
    .filter((entity) => {
      const fittingType = String(entity.props?.fittingType ?? entity.props?.type ?? '').toLowerCase();
      const shape = String(entity.props?.shape ?? '').toLowerCase();

      switch (type) {
        case 'Ducts':
          return entity.type === 'duct' || entity.type === 'duct_run';
        case 'Fittings':
          return entity.type === 'fitting';
        case 'Equipment':
          return entity.type === 'equipment';
        case 'Rooms':
          return entity.type === 'room';
        case 'Rectangular':
          return (entity.type === 'duct' || entity.type === 'duct_run') && shape === 'rectangular';
        case 'Round':
          return (entity.type === 'duct' || entity.type === 'duct_run') && (shape === 'round' || shape === 'flat_oval');
        case 'Flex':
          return (entity.type === 'duct' || entity.type === 'duct_run') && (shape === 'flex' || shape === 'flexible');
        case 'Elbows':
          return entity.type === 'fitting' && fittingType.includes('elbow');
        case 'Tees':
          return entity.type === 'fitting' && (fittingType.includes('tee') || fittingType.includes('wye'));
        case 'Reducers':
          return entity.type === 'fitting' && fittingType.includes('reducer');
        default:
          return false;
      }
    })
    .map((entity) => entity.id);
}

export function buildElementInventory(entities: EntityLike[]): ElementInventory {
  const count = (type: ElementSelectionKey) => getElementIdsByType(entities, type).length;

  return {
    inventory: {
      Ducts: count('Ducts'),
      Fittings: count('Fittings'),
      Equipment: count('Equipment'),
      Rooms: count('Rooms'),
    },
    breakdown: {
      Rectangular: count('Rectangular'),
      Round: count('Round'),
      Flex: count('Flex'),
      Elbows: count('Elbows'),
      Tees: count('Tees'),
      Reducers: count('Reducers'),
    },
  };
}

export function buildHealthItems(validationResults: Record<string, ValidationResult>): HealthItem[] {
  const grouped = new Map<string, { status: HealthItem['status']; label: string; count: number }>();

  for (const result of Object.values(validationResults)) {
    for (const violation of result.violations) {
      const id = violation.type ?? violation.ruleId;
      const previous = grouped.get(id);
      const status = violation.severity === 'blocker' ? 'error' : 'warning';
      const label = titleize(violation.type ?? violation.ruleId);

      grouped.set(id, {
        status: previous?.status === 'error' || status === 'error' ? 'error' : status,
        label: previous?.label ?? label,
        count: (previous?.count ?? 0) + 1,
      });
    }

    if (result.catalogStatus === 'unresolved') {
      const previous = grouped.get('unresolved_catalog');
      grouped.set('unresolved_catalog', {
        status: 'warning',
        label: 'Unresolved Catalog',
        count: (previous?.count ?? 0) + 1,
      });
    }
  }

  return Array.from(grouped.entries()).map(([id, item]) => ({
    id,
    status: item.status,
    label: item.label,
    count: item.count,
  }));
}

export function buildSystems(entities: EntityLike[], autoCalculate: boolean): DuctSystem[] {
  const systemMap = new Map<string, DuctSystem>();

  for (const entity of entities) {
    if (entity.type !== 'duct' && entity.type !== 'duct_run') {
      continue;
    }

    const name = getSystemName(entity);
    const current =
      systemMap.get(name) ??
      ({
        id: name,
        name,
        segmentCount: 0,
        totalLength: 0,
        surfaceArea: 0,
        designAirflow: 0,
        pressureLoss: 0,
        status: autoCalculate ? 'balanced' : 'not_calculated',
      } satisfies DuctSystem);

    const airflow = asNumber(entity.props?.airflow);
    current.segmentCount += 1;
    current.totalLength += getLength(entity);
    current.surfaceArea += getSurfaceArea(entity);
    current.designAirflow = (current.designAirflow ?? 0) + (airflow ?? 0);
    current.pressureLoss = (current.pressureLoss ?? 0) + getPressureLoss(entity);

    systemMap.set(name, current);
  }

  return Array.from(systemMap.values()).map((system) => {
    if (!autoCalculate) {
      return { ...system, status: 'not_calculated', designAirflow: null, pressureLoss: null };
    }

    return {
      ...system,
      totalLength: Math.round(system.totalLength),
      surfaceArea: Math.round(system.surfaceArea),
      designAirflow: Math.round(system.designAirflow ?? 0),
      pressureLoss: Number((system.pressureLoss ?? 0).toFixed(2)),
      status: system.designAirflow && system.designAirflow > 0 ? 'balanced' : 'not_calculated',
    };
  });
}

function commandAction(type: string): ActivityItem['action'] {
  if (type.includes('CREATE')) {
    return 'Added';
  }
  if (type.includes('DELETE')) {
    return 'Deleted';
  }
  if (type.includes('MOVE')) {
    return 'Moved';
  }
  return 'Modified';
}

function commandTypeLabel(command: Pick<ReversibleCommand, 'type' | 'payload'>): string {
  const payload = command.payload as {
    entity?: EntityLike;
    entities?: EntityLike[];
    updates?: { type?: string };
    transforms?: unknown[];
  };

  if (payload.entity?.type) {
    return titleize(payload.entity.type);
  }
  if (payload.entities?.length) {
    return `${payload.entities.length} Items`;
  }
  if (payload.transforms?.length) {
    return 'Entity';
  }
  return titleize(command.type.replace(/_ENTITY|_ENTITIES/g, ''));
}

function commandTarget(command: Pick<ReversibleCommand, 'type' | 'payload'>): string {
  const payload = command.payload as {
    entity?: EntityLike;
    entities?: EntityLike[];
    id?: string;
    ids?: string[];
    transforms?: unknown[];
  };

  if (payload.entity) {
    return entityName(payload.entity);
  }
  if (payload.entities?.length) {
    return `${payload.entities.length} items`;
  }
  if (payload.transforms?.length) {
    return `${payload.transforms.length} item${payload.transforms.length === 1 ? '' : 's'}`;
  }
  if (payload.ids?.length) {
    return `${payload.ids.length} items`;
  }
  return readableOptionalId(payload.id);
}

function relativeTime(timestamp: number, now = new Date()): string {
  const elapsedSeconds = Math.max(0, Math.round((now.getTime() - timestamp) / 1000));
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds} sec ago`;
  }

  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`;
  }

  return `${Math.round(elapsedHours / 24)} day ago`;
}

export function buildActivityItems(commands: ReversibleCommand[], now = new Date()): ActivityItem[] {
  return commands
    .slice(-RECENT_ACTIVITY_LIMIT)
    .reverse()
    .map((command) => ({
      id: command.id,
      action: commandAction(command.type),
      type: commandTypeLabel(command),
      target: commandTarget(command),
      time: relativeTime(command.timestamp, now),
    }));
}

export function buildProject(projectDetails: ReturnType<typeof useProjectStore.getState>['projectDetails']): ProjectMetadata {
  return {
    name: fallback(projectDetails?.projectName, 'Untitled'),
    description: fallback(projectDetails?.scope?.details?.join(', ')),
    number: readableOptionalId(projectDetails?.projectNumber, 'Not set'),
    client: fallback(projectDetails?.clientName),
    engineer: '-',
    created: formatDate(projectDetails?.createdAt),
    modified: formatDate(projectDetails?.modifiedAt, true),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'v0.1.0-preview',
    author: '-',
  };
}

function buildEngineering(
  settings: CalculationSettingsWithAuto | null,
  unitSystem: 'imperial' | 'metric'
): EngineeringSettings {
  return {
    designStandard: 'SMACNA HVAC Duct Construction Standards',
    shortStandard: 'SMACNA',
    airflowUnits: unitSystem === 'metric' ? 'L/s' : 'CFM',
    pressureUnits: unitSystem === 'metric' ? 'Pa' : 'in. w.g.',
    temperatureUnits: unitSystem === 'metric' ? 'deg C' : 'deg F',
    safetyFactors: settings?.templateId ? `Template ${settings.templateId}` : 'Default (SMACNA Baseline)',
    autoCalculate: settings?.autoCalculate ?? true,
  };
}

export function useInspectorOverviewData(): InspectorPanelProps {
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const projectDetails = useProjectStore((state) => state.projectDetails);
  const projectUnitSystem = useProjectStore((state) => state.projectSettings?.unitSystem);
  const preferencesUnitSystem = usePreferencesStore((state) => state.unitSystem);
  const calculationSettings = useCalculationSettingsStore(
    (state) => state.currentSettings as CalculationSettingsWithAuto | null
  );
  const updateCalculationSettings = useCalculationSettingsStore((state) => state.updateSettings);
  const entities = useEntityStore(
    useShallow((state) => state.allIds.map((id) => state.byId[id]).filter(Boolean) as EntityLike[])
  );
  const commitNetwork = useEntityStore((state) => state.commitNetwork);
  const validationResults = useValidationStore((state) => state.validationResults);
  const pastCommands = useHistoryStore((state) => state.past);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const selectMultiple = useSelectionStore((state) => state.selectMultiple);
  const zoomToSelection = useViewportStore((state) => state.zoomToSelection);
  const setOpenCalculationSettings = useDialogStore((state) => state.setOpenCalculationSettings);

  const unitSystem = projectUnitSystem ?? preferencesUnitSystem;
  const engineering = useMemo(() => buildEngineering(calculationSettings, unitSystem), [calculationSettings, unitSystem]);
  const health = useMemo(() => buildHealthItems(validationResults), [validationResults]);
  const systems = useMemo(() => buildSystems(entities, engineering.autoCalculate), [entities, engineering.autoCalculate]);
  const invalidIds = useMemo(() => {
    const failingTypes = new Set(health.filter((item) => item.status !== 'ok').map((item) => item.id));
    return Object.values(validationResults)
      .filter(
        (result) =>
          result.violations.some((violation) => failingTypes.has(violation.type ?? violation.ruleId)) ||
          (result.catalogStatus === 'unresolved' && failingTypes.has('unresolved_catalog'))
      )
      .map((result) => result.entityId);
  }, [health, validationResults]);

  const locateByIssue = useMemo(() => {
    const lookup = new Map<string, string[]>();
    for (const result of Object.values(validationResults)) {
      for (const violation of result.violations) {
        const key = violation.type ?? violation.ruleId;
        lookup.set(key, [...(lookup.get(key) ?? []), result.entityId]);
      }
      if (result.catalogStatus === 'unresolved') {
        lookup.set('unresolved_catalog', [...(lookup.get('unresolved_catalog') ?? []), result.entityId]);
      }
    }
    return lookup;
  }, [validationResults]);

  const applyInspectorSelection = useCallback(
    (ids: string[]) => {
      const request = buildInspectorFocusRequest(ids);
      selectMultiple(request.ids);

      if (request.shouldFocus) {
        const selectedEntities = entities.filter((entity) => request.ids.includes(entity.id));
        const bounds = buildEntityBounds(selectedEntities);
        if (bounds) {
          zoomToSelection(bounds, { animate: true });
        }
      }

      setActionStatus(request.status);
      return request;
    },
    [entities, selectMultiple, zoomToSelection]
  );

  const selectEntityType = useCallback(
    (type: ElementSelectionKey) => applyInspectorSelection(getElementIdsByType(entities, type)),
    [applyInspectorSelection, entities]
  );

  const onToggleAutoCalculate = useCallback(
    (nextValue: boolean) => {
      updateCalculationSettings({ ...(calculationSettings ?? {}), autoCalculate: nextValue } as never);
    },
    [calculationSettings, updateCalculationSettings]
  );

  const onAutoFixGeometry = useCallback(() => {
    commitNetwork();
    const repairPlan = buildGeometryRepairPlan(useValidationStore.getState().validationResults);
    if (repairPlan.changedEntityIds.length > 0) {
      selectMultiple(repairPlan.changedEntityIds);
    }
    setActionStatus(repairPlan.message);
  }, [commitNetwork, selectMultiple]);

  const sectionStates = useMemo(
    () => ({
      project: projectDetails ? undefined : { error: 'Project metadata is not loaded.' },
      systems:
        engineering.autoCalculate && entities.length > 0 && systems.length === 0
          ? { error: 'No calculated duct systems are available.' }
          : undefined,
    }),
    [engineering.autoCalculate, entities.length, projectDetails, systems.length]
  );

  return {
    project: buildProject(projectDetails),
    engineering,
    health,
    systems,
    unitSystem,
    elements: buildElementInventory(entities),
    recentActivity: buildActivityItems(pastCommands),
    recentActivityLimit: RECENT_ACTIVITY_LIMIT,
    recentActivityTotal: pastCommands.length,
    canUndo,
    canRedo,
    actionStatus,
    sectionStates,
    onToggleAutoCalculate,
    onEditEngineeringSettings: () => setOpenCalculationSettings(true),
    onLocateHealthIssue: (issueId) => applyInspectorSelection(locateByIssue.get(issueId) ?? []),
    onSelectAllInvalid: () => applyInspectorSelection(invalidIds),
    onAutoFixGeometry,
    onSelectElementType: selectEntityType,
    onUndo: () => {
      undo();
    },
    onRedo: () => {
      redo();
    },
  };
}
