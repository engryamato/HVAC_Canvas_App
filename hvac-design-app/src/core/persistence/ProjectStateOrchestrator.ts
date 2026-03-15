import { useHistoryStore } from '@/core/commands/historyStore';
import { CURRENT_SCHEMA_VERSION, type ProjectFile } from '@/core/schema/project-file.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectStore } from '@/core/store/project.store';
import { calculateSystemMetrics } from '@/features/canvas/hooks/useSystemCalculations';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import { useThreeDViewStore } from '@/features/canvas/store/threeDViewStore';
import { useViewModeStore } from '@/features/canvas/store/viewModeStore';
import { generateBillOfMaterials, type BomItem } from '@/features/export/csv';

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

export function hydrateToStores(project: ProjectFile): void {
  if (project.settings?.unitSystem) {
    usePreferencesStore.getState().setUnitSystem(project.settings.unitSystem);
  }

  if (project.entities) {
    useEntityStore.getState().hydrate(project.entities);
  }

  const preferences = usePreferencesStore.getState();
  const settings = project.settings ?? {};
  const viewport = project.viewportState;

  if (viewport) {
    useViewportStore.setState({
      panX: viewport.panX,
      panY: viewport.panY,
      zoom: viewport.zoom,
      gridVisible: settings.gridVisible ?? true,
      gridSize: settings.gridSize ?? preferences.gridSize,
      snapToGrid: preferences.snapToGrid,
    });
  }

  const hasViewMode = Boolean(settings.activeViewMode);
  const hasThreeDState = Boolean(project.threeDViewState);

  if (!hasViewMode || !hasThreeDState) {
    useViewModeStore.getState().reset();
    useThreeDViewStore.getState().reset();
  }

  if (hasViewMode) {
    useViewModeStore.getState().hydrateViewMode({
      activeViewMode: settings.activeViewMode,
    });
  }

  if (hasThreeDState && project.threeDViewState) {
    useThreeDViewStore.getState().hydrateThreeDView(project.threeDViewState);
  }
}
