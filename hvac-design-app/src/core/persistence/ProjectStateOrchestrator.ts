import { useHistoryStore } from '@/core/commands/historyStore';
import type { ReversibleCommand } from '@/core/commands/types';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectStore } from '@/core/store/project.store';
import { CURRENT_SCHEMA_VERSION, type ProjectDetails, type ProjectFile } from '@/core/schema/project-file.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useThreeDViewStore } from '@/features/canvas/store/threeDViewStore';
import { useViewModeStore } from '@/features/canvas/store/viewModeStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import { calculateSystemMetrics } from '@/features/canvas/hooks/useSystemCalculations';
import { generateBillOfMaterials, type BomItem } from '@/features/export/csv';

interface HydrationPayload {
  selection?: {
    selectedIds: string[];
    hoveredId: string | null;
  };
  history?: {
    past: Array<Record<string, unknown>>;
    future: Array<Record<string, unknown>>;
    maxSize: number;
  };
  viewport?: {
    panX: number;
    panY: number;
    zoom: number;
    gridVisible: boolean;
    gridSize: number;
    snapToGrid: boolean;
  };
}

interface HydrationOptions {
  payload?: HydrationPayload;
}

export function toProjectDetails(project: ProjectFile): ProjectDetails {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    projectNumber: project.projectNumber,
    clientName: project.clientName,
    location: project.location,
    scope: project.scope,
    siteConditions: project.siteConditions,
    isArchived: project.isArchived,
    createdAt: project.createdAt,
    modifiedAt: project.modifiedAt,
  };
}

export function snapshotFromStores(): ProjectFile | null {
  const projectStore = useProjectStore.getState();
  if (!projectStore.currentProjectId || !projectStore.projectDetails) {
    return null;
  }

  const entityStore = useEntityStore.getState();
  const viewportStore = useViewportStore.getState();
  const threeDViewStore = useThreeDViewStore.getState();
  const viewModeStore = useViewModeStore.getState();
  const preferences = usePreferencesStore.getState();
  const historyStore = useHistoryStore.getState();

  const unitSystem = projectStore.projectSettings?.unitSystem ?? preferences.unitSystem;
  const bom = generateBillOfMaterials(entityStore);
  const mapItem = <T extends 'Duct' | 'Fitting' | 'Equipment'>(type: T) => (item: BomItem) => ({
    id: String(item.itemNumber),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    cost: 0,
    type,
    details: item.specifications || item.description,
  });

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projectId: projectStore.currentProjectId,
    projectName: projectStore.projectDetails.projectName,
    projectNumber: projectStore.projectDetails.projectNumber || undefined,
    clientName: projectStore.projectDetails.clientName || undefined,
    location: projectStore.projectDetails.location || undefined,
    scope: projectStore.projectDetails.scope ?? {
      details: [],
      materials: [],
      projectType: 'Commercial',
    },
    siteConditions: projectStore.projectDetails.siteConditions ?? {
      elevation: '0',
      outdoorTemp: '70',
      indoorTemp: '70',
      windSpeed: '0',
      humidity: '50',
      localCodes: '',
    },
    createdAt: projectStore.projectDetails.createdAt,
    modifiedAt: new Date().toISOString(),
    isArchived: projectStore.projectDetails.isArchived ?? false,
    entities: {
      byId: entityStore.byId,
      allIds: entityStore.allIds,
    },
    viewportState: {
      panX: viewportStore.panX,
      panY: viewportStore.panY,
      zoom: viewportStore.zoom,
    },
    settings: {
      unitSystem,
      gridSize: viewportStore.gridSize,
      gridVisible: viewportStore.gridVisible,
      snapToGrid: viewportStore.snapToGrid,
      activeViewMode: viewModeStore.activeViewMode,
    },
    threeDViewState: {
      cameraTarget: threeDViewStore.cameraTarget,
      cameraPosition: threeDViewStore.cameraPosition,
      orbitRadius: threeDViewStore.orbitRadius,
      polarAngle: threeDViewStore.polarAngle,
      azimuthAngle: threeDViewStore.azimuthAngle,
      showGrid: threeDViewStore.showGrid,
      showAxes: threeDViewStore.showAxes,
      showPlanOverlay: threeDViewStore.showPlanOverlay,
    },
    commandHistory: {
      commands: historyStore.past,
      currentIndex: Math.max(historyStore.past.length - 1, 0),
    },
    calculations: calculateSystemMetrics(entityStore.byId),
    billOfMaterials: {
      ducts: bom.filter((item) => item.type === 'Duct').map(mapItem('Duct')),
      fittings: bom.filter((item) => item.type === 'Fitting').map(mapItem('Fitting')),
      equipment: bom.filter((item) => item.type === 'Equipment').map(mapItem('Equipment')),
    },
  };
}

export function hydrateToStores(project: ProjectFile, options: HydrationOptions = {}): void {
  const { payload } = options;
  const preferences = usePreferencesStore.getState();
  const projectStore = useProjectStore.getState();

  projectStore.setProject(project.projectId, toProjectDetails(project));

  const unitSystem = project.settings?.unitSystem ?? preferences.unitSystem;
  usePreferencesStore.getState().setUnitSystem(unitSystem);
  useProjectStore.getState().setProjectSettings({ unitSystem });

  useEntityStore.getState().hydrate(project.entities ?? { byId: {}, allIds: [] });

  const resolvedViewport = payload?.viewport ?? {
    panX: project.viewportState.panX,
    panY: project.viewportState.panY,
    zoom: project.viewportState.zoom,
    gridVisible: project.settings?.gridVisible ?? true,
    gridSize: project.settings?.gridSize ?? preferences.gridSize,
    snapToGrid: project.settings?.snapToGrid ?? preferences.snapToGrid,
  };

  useViewportStore.setState((state) => ({
    ...state,
    panX: resolvedViewport.panX,
    panY: resolvedViewport.panY,
    zoom: resolvedViewport.zoom,
    gridVisible: resolvedViewport.gridVisible,
    gridSize: resolvedViewport.gridSize,
    snapToGrid: resolvedViewport.snapToGrid,
  }));

  const hasViewMode = Boolean(project.settings?.activeViewMode);
  const hasThreeDState = Boolean(project.threeDViewState);
  if (!hasViewMode || !hasThreeDState) {
    useViewModeStore.getState().reset();
    useThreeDViewStore.getState().reset();
  }

  if (hasViewMode) {
    useViewModeStore.getState().hydrateViewMode({
      activeViewMode: project.settings.activeViewMode,
    });
  }

  if (hasThreeDState) {
    useThreeDViewStore.getState().hydrateThreeDView(project.threeDViewState!);
  }

  if (payload?.selection) {
    useSelectionStore.setState((state) => ({
      ...state,
      selectedIds: payload.selection!.selectedIds,
      hoveredId: payload.selection!.hoveredId,
    }));
  } else {
    useSelectionStore.getState().clearSelection();
    useSelectionStore.getState().setHovered(null);
  }

  if (payload?.history) {
    useHistoryStore.setState((state) => ({
      ...state,
      past: payload.history!.past as ReversibleCommand[],
      future: payload.history!.future as ReversibleCommand[],
      maxSize: payload.history!.maxSize,
    }));
  } else {
    useHistoryStore.setState((state) => ({
      ...state,
      past: project.commandHistory?.commands as ReversibleCommand[] ?? [],
      future: [],
      maxSize: state.maxSize,
    }));
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('lastActiveProjectId', project.projectId);
  }
}
