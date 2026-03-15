import { useHistoryStore } from '@/core/commands/historyStore';
import { CURRENT_SCHEMA_VERSION, type ProjectFile } from '@/core/schema/project-file.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectStore } from '@/core/store/project.store';
import { calculateSystemMetrics } from '@/features/canvas/hooks/useSystemCalculations';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import { useThreeDViewStore } from '@/features/canvas/store/threeDViewStore';
import { useViewModeStore } from '@/features/canvas/store/viewModeStore';
import { generateBillOfMaterials, type BomItem } from '@/features/export/csv';

export interface ProjectHydrationPayload {
  project: ProjectFile;
  selection?: {
    selectedIds: string[];
    hoveredId: string | null;
  };
  viewport?: {
    panX: number;
    panY: number;
    zoom: number;
    gridVisible: boolean;
    gridSize: number;
    snapToGrid: boolean;
  };
  preferences?: {
    unitSystem?: 'imperial' | 'metric';
    gridSize?: number;
    snapToGrid?: boolean;
  };
  history?: {
    past: unknown[];
    future: unknown[];
    maxSize: number;
  };
}

function isProjectHydrationPayload(
  source: ProjectFile | ProjectHydrationPayload
): source is ProjectHydrationPayload {
  return 'project' in source;
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
    isArchived: false,
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
      gridSize: preferences.gridSize,
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
      cameraRestored: threeDViewStore.cameraRestored,
      showGrid: threeDViewStore.showGrid,
      showAxes: threeDViewStore.showAxes,
      showPlanOverlay: threeDViewStore.showPlanOverlay,
    },
    commandHistory: {
      commands: historyStore.past,
      currentIndex: Math.max(historyStore.past.length - 1, 0),
    },
    calculations: calculateSystemMetrics(entityStore.byId),
    billOfMaterials: (() => {
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
        ducts: bom.filter((i) => i.type === 'Duct').map(mapItem('Duct')),
        fittings: bom.filter((i) => i.type === 'Fitting').map(mapItem('Fitting')),
        equipment: bom.filter((i) => i.type === 'Equipment').map(mapItem('Equipment')),
      };
    })(),
  };
}

export function buildProjectFileFromStores(): ProjectFile | null {
  return snapshotFromStores();
}

export function hydrateToStores(source: ProjectFile | ProjectHydrationPayload): void {
  const hydrationPayload = isProjectHydrationPayload(source) ? source : { project: source };
  const { project } = hydrationPayload;

  const entityStore = useEntityStore.getState();
  const viewportStore = useViewportStore.getState();
  const threeDViewStore = useThreeDViewStore.getState();
  const viewModeStore = useViewModeStore.getState();
  const historyStore = useHistoryStore.getState();
  const projectStore = useProjectStore.getState();
  const preferencesStore = usePreferencesStore.getState();

  if (project.entities) {
    entityStore.hydrate(project.entities);
  } else {
    entityStore.clearAllEntities();
  }

  if (hydrationPayload.viewport) {
    useViewportStore.setState({
      panX: hydrationPayload.viewport.panX,
      panY: hydrationPayload.viewport.panY,
      zoom: hydrationPayload.viewport.zoom,
      gridVisible: hydrationPayload.viewport.gridVisible,
      gridSize: hydrationPayload.viewport.gridSize,
      snapToGrid: hydrationPayload.viewport.snapToGrid,
    });
  } else if (project.viewportState) {
    useViewportStore.setState({
      panX: project.viewportState.panX,
      panY: project.viewportState.panY,
      zoom: project.viewportState.zoom,
      gridVisible: project.settings?.gridVisible ?? viewportStore.gridVisible,
      gridSize: project.settings?.gridSize ?? preferencesStore.gridSize,
      snapToGrid: project.settings?.snapToGrid ?? preferencesStore.snapToGrid,
    });
  }

  const nextUnitSystem =
    hydrationPayload.preferences?.unitSystem ??
    project.settings?.unitSystem ??
    preferencesStore.unitSystem;
  const nextGridSize =
    hydrationPayload.preferences?.gridSize ??
    project.settings?.gridSize ??
    preferencesStore.gridSize;
  const nextSnapToGrid =
    hydrationPayload.preferences?.snapToGrid ??
    project.settings?.snapToGrid ??
    preferencesStore.snapToGrid;

  preferencesStore.setUnitSystem(nextUnitSystem);
  preferencesStore.setGridSize(nextGridSize);
  preferencesStore.setSnapToGrid(nextSnapToGrid);
  projectStore.setProjectSettings({ unitSystem: nextUnitSystem });

  const hasViewMode = Boolean(project.settings?.activeViewMode);
  const hasThreeDState = Boolean(project.threeDViewState);

  if (!hasViewMode || !hasThreeDState) {
    viewModeStore.reset();
    threeDViewStore.reset();
  }

  if (hasViewMode) {
    viewModeStore.hydrateViewMode({
      activeViewMode: project.settings?.activeViewMode,
    });
  }

  if (hasThreeDState && project.threeDViewState) {
    threeDViewStore.hydrateThreeDView(project.threeDViewState);
  }

  useSelectionStore.setState({
    selectedIds: hydrationPayload.selection?.selectedIds ?? [],
    hoveredId: hydrationPayload.selection?.hoveredId ?? null,
  });

  const fallbackPast = project.commandHistory?.commands ?? [];
  const fallbackCurrentIndex =
    project.commandHistory?.currentIndex ?? Math.max(fallbackPast.length - 1, 0);
  const boundedIndex = Math.min(fallbackCurrentIndex + 1, fallbackPast.length);

  useHistoryStore.setState({
    past: (hydrationPayload.history?.past ?? fallbackPast.slice(0, boundedIndex)) as typeof historyStore.past,
    future: (hydrationPayload.history?.future ?? []) as typeof historyStore.future,
    maxSize: hydrationPayload.history?.maxSize ?? historyStore.maxSize,
  });
}
