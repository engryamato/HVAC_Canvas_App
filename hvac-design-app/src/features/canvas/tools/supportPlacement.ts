import { createEntities } from '@/core/commands/entityCommands';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import {
  type SupportDraftAnchor,
  type SupportPreviewMarker,
  type SupportPreviewMode,
  useToolStore,
} from '@/core/store/canvas.store';
import type { Duct, Entity } from '@/core/schema';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../store/selectionStore';
import { createEquipment, createGroup } from '../entities';

const PIXELS_PER_FOOT = 12;
const SUPPORT_SNAP_TOLERANCE = 18;
const UNIVERSAL_CATEGORY_ID = 'hangers_supports';
const AUTO_HANGER_TYPE_ID = 'auto_hanger_spacing';
const CONTINUOUS_TRAPEZE_TYPE_ID = 'continuous_trapeze_run';

type Point = { x: number; y: number };

interface DuctGeometry {
  duct: Duct;
  start: Point;
  end: Point;
  rotation: number;
  lengthPx: number;
  lengthFt: number;
}

interface ProjectionResult {
  point: Point;
  positionRatio: number;
  distance: number;
}

function getCatalogEntries(): UnifiedComponentDefinition[] {
  return useComponentLibraryStoreV2.getState().catalogEntries;
}

function getActiveEntry(): UnifiedComponentDefinition | null {
  return useComponentLibraryStoreV2.getState().getActiveComponent() ?? null;
}

function getUniversalSupportEntries(): UnifiedComponentDefinition[] {
  return getCatalogEntries().filter(
    (entry) => entry.engineeringSystem === 'universal' && entry.categoryId === UNIVERSAL_CATEGORY_ID
  );
}

function getEntityDucts(): Duct[] {
  return Object.values(useEntityStore.getState().byId).filter(
    (entity): entity is Duct => entity?.type === 'duct'
  );
}

function getDuctGeometry(duct: Duct): DuctGeometry {
  const start = { x: duct.transform.x, y: duct.transform.y };
  const lengthPx = duct.props.length * PIXELS_PER_FOOT;
  const rotation = duct.transform.rotation;
  const radians = (rotation * Math.PI) / 180;

  return {
    duct,
    start,
    end: {
      x: start.x + lengthPx * Math.cos(radians),
      y: start.y + lengthPx * Math.sin(radians),
    },
    rotation,
    lengthPx,
    lengthFt: duct.props.length,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function projectPointOnSegment(point: Point, start: Point, end: Point): ProjectionResult {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return {
      point: start,
      positionRatio: 0,
      distance: Math.hypot(point.x - start.x, point.y - start.y),
    };
  }

  const rawRatio = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const positionRatio = clamp(rawRatio, 0, 1);
  const projected = {
    x: start.x + dx * positionRatio,
    y: start.y + dy * positionRatio,
  };

  return {
    point: projected,
    positionRatio,
    distance: Math.hypot(projected.x - point.x, projected.y - point.y),
  };
}

function getMaxDuctDimension(duct: Duct): number {
  return Math.max(duct.props.width ?? 0, duct.props.height ?? 0, duct.props.diameter ?? 0, 12);
}

function getBaseSpacingFt(duct: Duct): number {
  const maxDimension = getMaxDuctDimension(duct);

  if (maxDimension <= 18) {
    return 8;
  }
  if (maxDimension <= 36) {
    return 10;
  }
  if (maxDimension <= 60) {
    return 12;
  }
  return 14;
}

function getCodeSpacingFt(duct: Duct): number {
  const settings = useToolStore.getState().supportSettings;
  const baseSpacing = getBaseSpacingFt(duct);
  const adjusted =
    settings.codeStandard === 'ibc_asce7'
      ? Math.max(6, baseSpacing - 1)
      : settings.codeStandard === 'ashrae'
        ? Math.max(6, baseSpacing - 0.5)
        : baseSpacing;

  if (settings.maxSpacingFt && settings.maxSpacingFt > 0) {
    return Math.min(adjusted, settings.maxSpacingFt);
  }

  return adjusted;
}

function getLoadRating(duct: Duct, spacingFt: number): number {
  const dimension = getMaxDuctDimension(duct);
  return Math.round(dimension * spacingFt * 2.5);
}

function getPreviewTargetDucts(): Duct[] {
  const allDucts = getEntityDucts();
  const { scope } = useToolStore.getState().supportSettings;

  if (scope === 'all') {
    return allDucts;
  }

  const selectedIds = useSelectionStore.getState().selectedIds;
  const selectedDucts = allDucts.filter((duct) => selectedIds.includes(duct.id));

  return selectedDucts.length > 0 ? selectedDucts : allDucts;
}

function findEntryById(entryId: string | null | undefined): UnifiedComponentDefinition | undefined {
  if (!entryId) {
    return undefined;
  }

  return getCatalogEntries().find((entry) => entry.id === entryId);
}

function findEntryByTypeId(typeId: string): UnifiedComponentDefinition | undefined {
  return getCatalogEntries().find(
    (entry) => entry.engineeringSystem === 'universal' && entry.typeId === typeId
  );
}

function resolveAutoHangerEntry(): UnifiedComponentDefinition | undefined {
  const settings = useToolStore.getState().supportSettings;
  const activeEntry = getActiveEntry();

  if (activeEntry?.engineeringSystem === 'universal' && activeEntry.componentClass === 'accessory') {
    return activeEntry;
  }

  if (settings.hangerEntryId) {
    const configured = findEntryById(settings.hangerEntryId);
    if (configured) {
      return configured;
    }
  }

  const recommendedEntryId = activeEntry?.recommendedAccessoryEntryIds?.[0];
  if (recommendedEntryId) {
    const recommended = findEntryById(recommendedEntryId);
    if (recommended) {
      return recommended;
    }
  }

  return findEntryByTypeId('clevis_hanger') ?? getUniversalSupportEntries().find((entry) => entry.componentClass === 'accessory');
}

function resolveTrapezeEntry(): UnifiedComponentDefinition | undefined {
  const activeEntry = getActiveEntry();
  const recommendedId =
    activeEntry?.recommendedAccessoryEntryIds?.find((entryId) => {
      const entry = findEntryById(entryId);
      return entry?.typeId === 'trapeze_hanger';
    }) ?? null;

  return findEntryById(recommendedId) ?? findEntryByTypeId('trapeze_hanger');
}

function resolveSeismicBraceEntry(): UnifiedComponentDefinition | undefined {
  return findEntryByTypeId('rigid_seismic_brace') ?? findEntryByTypeId('cable_seismic_brace');
}

function toMarkerId(ductId: string, kind: SupportPreviewMarker['kind'], index: number): string {
  return `${ductId}:${kind}:${index}`;
}

function createMarkerPoint(geometry: DuctGeometry, positionRatio: number): Point {
  return {
    x: geometry.start.x + (geometry.end.x - geometry.start.x) * positionRatio,
    y: geometry.start.y + (geometry.end.y - geometry.start.y) * positionRatio,
  };
}

function buildMarkersForDuct(
  geometry: DuctGeometry,
  spacingFt: number,
  entry: UnifiedComponentDefinition,
  kind: SupportPreviewMarker['kind']
): SupportPreviewMarker[] {
  const supportCount = Math.max(1, Math.ceil(geometry.lengthFt / Math.max(1, spacingFt)) - 1);
  const stepRatio = 1 / (supportCount + 1);

  return Array.from({ length: supportCount }, (_, index) => {
    const positionRatio = stepRatio * (index + 1);
    const point = createMarkerPoint(geometry, positionRatio);

    return {
      id: toMarkerId(geometry.duct.id, kind, index),
      ductId: geometry.duct.id,
      x: point.x,
      y: point.y,
      rotation: geometry.rotation,
      positionRatio,
      spacingFt,
      label: `${spacingFt.toFixed(1)} ft`,
      kind,
      catalogItemId: entry.id,
      loadRating: getLoadRating(geometry.duct, spacingFt),
    };
  });
}

function buildSeismicMarkers(geometry: DuctGeometry): SupportPreviewMarker[] {
  const settings = useToolStore.getState().supportSettings;
  const braceEntry = resolveSeismicBraceEntry();

  if (!braceEntry || settings.seismicZone === 'none' || Number(settings.seismicZone) < 2) {
    return [];
  }

  if (getMaxDuctDimension(geometry.duct) < 18 || geometry.lengthFt < 12) {
    return [];
  }

  const positionRatio = 0.5;
  const point = createMarkerPoint(geometry, positionRatio);

  return [
    {
      id: toMarkerId(geometry.duct.id, 'seismic', 0),
      ductId: geometry.duct.id,
      x: point.x,
      y: point.y,
      rotation: geometry.rotation,
      positionRatio,
      spacingFt: geometry.lengthFt / 2,
      label: `Seismic Z${settings.seismicZone}`,
      kind: 'seismic',
      catalogItemId: braceEntry.id,
      loadRating: getLoadRating(geometry.duct, Math.max(6, geometry.lengthFt / 2)),
    },
  ];
}

function createSupportEntity(
  marker: SupportPreviewMarker,
  entry: UnifiedComponentDefinition,
  overrides?: { width?: number; depth?: number; height?: number; mountHeight?: number }
) {
  const width = overrides?.width ?? (marker.kind === 'strut' ? marker.spacingFt * PIXELS_PER_FOOT : 8);
  const depth = overrides?.depth ?? (marker.kind === 'strut' ? 4 : 8);
  const height = overrides?.height ?? 8;
  const mountHeight = overrides?.mountHeight ?? useToolStore.getState().supportSettings.mountHeight ?? undefined;
  const duct = useEntityStore.getState().byId[marker.ductId];
  const connectedDuctId = duct?.type === 'duct' ? marker.ductId : undefined;

  const entity = createEquipment('damper', {
    name: entry.name,
    x: marker.x - width / 2,
    y: marker.y - depth / 2,
    width,
    depth,
    height,
    mountHeight,
    manufacturer: entry.manufacturer,
    model: entry.model,
    serviceId: duct?.type === 'duct' ? duct.props.serviceId : undefined,
    catalogItemId: entry.id,
    engineeringSystem: 'universal',
    connectedDuctId,
    loadRating: marker.loadRating,
    spacingRule: marker.label,
  });

  entity.transform.rotation = marker.rotation;
  return entity;
}

export function isSupportToolEntry(
  entry: UnifiedComponentDefinition | null | undefined
): entry is UnifiedComponentDefinition {
  return Boolean(entry && entry.engineeringSystem === 'universal' && entry.categoryId === UNIVERSAL_CATEGORY_ID);
}

export function getSupportPreviewModeForEntry(
  entry: UnifiedComponentDefinition | null | undefined
): SupportPreviewMode {
  if (!entry) {
    return null;
  }
  if (entry.typeId === AUTO_HANGER_TYPE_ID) {
    return 'auto_hanger_spacing';
  }
  if (entry.typeId === CONTINUOUS_TRAPEZE_TYPE_ID) {
    return 'continuous_trapeze_run';
  }
  return null;
}

export function previewAutoHangerSpacing(): SupportPreviewMarker[] {
  const entry = resolveAutoHangerEntry();
  if (!entry) {
    useToolStore.getState().clearSupportPreview();
    return [];
  }

  const markers = getPreviewTargetDucts().flatMap((duct) => {
    const geometry = getDuctGeometry(duct);
    const spacingFt = getCodeSpacingFt(duct);
    return [
      ...buildMarkersForDuct(geometry, spacingFt, entry, 'hanger'),
      ...buildSeismicMarkers(geometry),
    ];
  });

  useToolStore.getState().setSupportPreviewMarkers('auto_hanger_spacing', markers);
  return markers;
}

export function applyAutoHangerSpacing(): number {
  const { supportPreviewMarkers } = useToolStore.getState();
  const catalogEntries = getCatalogEntries();
  const entities = supportPreviewMarkers
    .map((marker) => {
      const entry = catalogEntries.find((candidate) => candidate.id === marker.catalogItemId);
      return entry ? createSupportEntity(marker, entry) : null;
    })
    .filter((entity): entity is Entity => Boolean(entity));

  if (entities.length === 0) {
    return 0;
  }

  createEntities(entities);
  useToolStore.getState().clearSupportPreview();
  return entities.length;
}

export function clearSupportDraft(): void {
  useToolStore.getState().setSupportDraftAnchor(null);
  useToolStore.getState().setSupportPrompt(null);
}

export function getNearestSupportAnchor(point: Point, ductId?: string): SupportDraftAnchor | null {
  const geometries = getEntityDucts()
    .filter((duct) => !ductId || duct.id === ductId)
    .map(getDuctGeometry);

  let closest: (SupportDraftAnchor & { distance: number }) | null = null;

  for (const geometry of geometries) {
    const projection = projectPointOnSegment(point, geometry.start, geometry.end);
    if (projection.distance > SUPPORT_SNAP_TOLERANCE) {
      continue;
    }

    if (!closest || projection.distance < closest.distance) {
      closest = {
        ductId: geometry.duct.id,
        x: projection.point.x,
        y: projection.point.y,
        rotation: geometry.rotation,
        positionRatio: projection.positionRatio,
        distance: projection.distance,
      };
    }
  }

  if (!closest) {
    return null;
  }

  return {
    ductId: closest.ductId,
    x: closest.x,
    y: closest.y,
    rotation: closest.rotation,
    positionRatio: closest.positionRatio,
  };
}

export function projectPointToDuct(point: Point, ductId: string): SupportDraftAnchor | null {
  const duct = useEntityStore.getState().byId[ductId];
  if (!duct || duct.type !== 'duct') {
    return null;
  }

  const geometry = getDuctGeometry(duct);
  const projection = projectPointOnSegment(point, geometry.start, geometry.end);

  return {
    ductId,
    x: projection.point.x,
    y: projection.point.y,
    rotation: geometry.rotation,
    positionRatio: projection.positionRatio,
  };
}

export function buildContinuousTrapezeDraft(
  start: SupportDraftAnchor,
  end: SupportDraftAnchor
): SupportPreviewMarker[] {
  if (start.ductId !== end.ductId) {
    return [];
  }

  const duct = useEntityStore.getState().byId[start.ductId];
  const entry = resolveTrapezeEntry();

  if (!duct || duct.type !== 'duct' || !entry) {
    return [];
  }

  const geometry = getDuctGeometry(duct);
  const spacingFt = getCodeSpacingFt(duct);
  const fromRatio = Math.min(start.positionRatio, end.positionRatio);
  const toRatio = Math.max(start.positionRatio, end.positionRatio);
  const spanRatio = toRatio - fromRatio;
  const spanFt = geometry.lengthFt * spanRatio;

  if (spanFt <= 0.5) {
    return [];
  }

  const supportCount = Math.max(1, Math.ceil(spanFt / Math.max(1, spacingFt)));
  const stepRatio = spanRatio / supportCount;

  return Array.from({ length: supportCount + 1 }, (_, index) => {
    const positionRatio = clamp(fromRatio + stepRatio * index, 0, 1);
    const point = createMarkerPoint(geometry, positionRatio);

    return {
      id: toMarkerId(geometry.duct.id, 'trapeze', index),
      ductId: geometry.duct.id,
      x: point.x,
      y: point.y,
      rotation: geometry.rotation,
      positionRatio,
      spacingFt: spanFt / supportCount,
      label: index === 0 ? 'Start' : index === supportCount ? 'End' : `${(spanFt / supportCount).toFixed(1)} ft`,
      kind: 'trapeze',
      catalogItemId: entry.id,
      loadRating: getLoadRating(duct, Math.max(4, spanFt / supportCount)),
    };
  });
}

export function applyContinuousTrapezeRun(
  start: SupportDraftAnchor,
  end: SupportDraftAnchor
): number {
  const supports = buildContinuousTrapezeDraft(start, end);
  const trapezeEntry = resolveTrapezeEntry();

  if (!trapezeEntry || supports.length === 0) {
    return 0;
  }

  const childEntities: Entity[] = [];
  const mountHeight = useToolStore.getState().supportSettings.mountHeight ?? 96;

  supports.forEach((marker, index) => {
    const supportEntity = createSupportEntity(marker, trapezeEntry, {
      width: 10,
      depth: 10,
      height: 10,
      mountHeight,
    });
    childEntities.push(supportEntity);

    const nextMarker = supports[index + 1];
    if (!nextMarker) {
      return;
    }

    const segmentLengthPx = Math.hypot(nextMarker.x - marker.x, nextMarker.y - marker.y);
    const midpoint = {
      x: (marker.x + nextMarker.x) / 2,
      y: (marker.y + nextMarker.y) / 2,
    };
    const strutMarker: SupportPreviewMarker = {
      ...marker,
      id: `${marker.id}:strut`,
      x: midpoint.x,
      y: midpoint.y,
      spacingFt: segmentLengthPx / PIXELS_PER_FOOT,
      label: useToolStore.getState().supportSettings.strutSize,
      kind: 'strut',
      loadRating: marker.loadRating + nextMarker.loadRating,
    };

    const strutEntity = createSupportEntity(strutMarker, trapezeEntry, {
      width: segmentLengthPx,
      depth: 4,
      height: 4,
      mountHeight,
    });
    childEntities.push(strutEntity);
  });

  if (childEntities.length < 2) {
    return 0;
  }

  const group = createGroup('Continuous Trapeze Run', childEntities.map((entity) => entity.id), {
    x: supports[0]?.x ?? 0,
    y: supports[0]?.y ?? 0,
  });

  createEntities([...childEntities, group]);
  clearSupportDraft();
  return childEntities.length + 1;
}

export function placeSingleSupport(point: Point): string | null {
  const activeEntry = getActiveEntry();
  if (!activeEntry || !isSupportToolEntry(activeEntry)) {
    return null;
  }

  const ductAnchor = getNearestSupportAnchor(point);
  const marker: SupportPreviewMarker = {
    id: crypto.randomUUID(),
    ductId: ductAnchor?.ductId ?? '',
    x: ductAnchor?.x ?? point.x,
    y: ductAnchor?.y ?? point.y,
    rotation: ductAnchor?.rotation ?? 0,
    positionRatio: ductAnchor?.positionRatio ?? 0,
    spacingFt: 0,
    label: activeEntry.name,
    kind: 'hanger',
    catalogItemId: activeEntry.id,
    loadRating: 0,
  };

  const entity = createSupportEntity(marker, activeEntry);
  createEntities([entity]);
  return entity.id;
}
