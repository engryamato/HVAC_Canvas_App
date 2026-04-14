import { beforeEach, describe, expect, it } from 'vitest';
import { createDuct } from '@/features/canvas/entities/ductDefaults';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useToolStore } from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import {
  applyAutoHangerSpacing,
  applyContinuousTrapezeRun,
  buildContinuousTrapezeDraft,
  getSupportPreviewModeForEntry,
  isSupportToolEntry,
  previewAutoHangerSpacing,
  projectPointToDuct,
} from '../supportPlacement';

function seedSupportCatalog() {
  const store = useUnifiedCatalogStore.getState();
  store.reset();

  store.addEntry({
    id: 'auto-hanger-spacing',
    name: 'Auto-Hanger Spacing',
    componentClass: 'equipment',
    category: 'equipment',
    categoryId: 'hangers_supports',
    typeId: 'auto_hanger_spacing',
    type: 'auto_hanger_spacing',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: ['clevis-hanger'],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.addEntry({
    id: 'continuous-trapeze-run',
    name: 'Continuous Trapeze Run',
    componentClass: 'equipment',
    category: 'equipment',
    categoryId: 'hangers_supports',
    typeId: 'continuous_trapeze_run',
    type: 'continuous_trapeze_run',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: ['trapeze-hanger'],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.addEntry({
    id: 'clevis-hanger',
    name: 'Clevis Hanger',
    componentClass: 'accessory',
    category: 'accessory',
    categoryId: 'hangers_supports',
    typeId: 'clevis_hanger',
    type: 'clevis_hanger',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: [],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.addEntry({
    id: 'trapeze-hanger',
    name: 'Trapeze Hanger',
    componentClass: 'accessory',
    category: 'accessory',
    categoryId: 'hangers_supports',
    typeId: 'trapeze_hanger',
    type: 'trapeze_hanger',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: [],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('supportPlacement helpers', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
    seedSupportCatalog();
    useToolStore.setState({
      currentTool: 'support',
      activeSpecialtyToolId: null,
      supportPreviewMarkers: [],
      supportDraftAnchor: null,
      supportPrompt: null,
    });
    useToolStore.getState().setSupportSettings({
      hangerEntryId: null,
      mountHeight: 96,
      scope: 'all',
      codeStandard: 'ibc_asce7',
      seismicZone: 'none',
    });
  });

  it('recognizes universal support entries and auto hanger preview modes', () => {
    const autoHangerEntry = useUnifiedCatalogStore.getState().getEntry('auto-hanger-spacing');
    const trapezeEntry = useUnifiedCatalogStore.getState().getEntry('continuous-trapeze-run');

    expect(isSupportToolEntry(autoHangerEntry)).toBe(true);
    expect(isSupportToolEntry(trapezeEntry)).toBe(true);
    expect(getSupportPreviewModeForEntry(autoHangerEntry)).toBe('auto_hanger_spacing');
    expect(getSupportPreviewModeForEntry(trapezeEntry)).toBe('continuous_trapeze_run');
  });

  it('previews and applies auto hanger spacing for the active duct run', () => {
    const duct = createDuct({
      name: 'Preview Target',
      x: 0,
      y: 0,
      length: 24,
      airflow: 1200,
      catalogItemId: 'round-duct',
      engineeringSystem: 'standard_duct',
    });

    useEntityStore.getState().addEntity(duct);
    useUnifiedCatalogStore.getState().selectEntry('auto-hanger-spacing');

    const markers = previewAutoHangerSpacing();

    expect(markers.length).toBeGreaterThan(0);
    expect(useToolStore.getState().supportPreviewMode).toBe('auto_hanger_spacing');
    expect(useToolStore.getState().supportPreviewMarkers).toHaveLength(markers.length);

    const entityCountBeforeApply = useEntityStore.getState().allIds.length;
    const created = applyAutoHangerSpacing();

    expect(created).toBeGreaterThan(0);
    expect(useToolStore.getState().supportPreviewMarkers).toHaveLength(0);
    expect(useEntityStore.getState().allIds.length).toBeGreaterThan(entityCountBeforeApply);
  });

  it('builds and applies continuous trapeze runs with mount-height aware clearing', () => {
    const duct = createDuct({
      name: 'Trapeze Target',
      x: 0,
      y: 0,
      length: 24,
      airflow: 1200,
      catalogItemId: 'round-duct',
      engineeringSystem: 'standard_duct',
    });

    useEntityStore.getState().addEntity(duct);
    useUnifiedCatalogStore.getState().selectEntry('continuous-trapeze-run');

    const start = projectPointToDuct({ x: 0, y: 0 }, duct.id);
    const end = projectPointToDuct({ x: 288, y: 0 }, duct.id);

    expect(start).not.toBeNull();
    expect(end).not.toBeNull();

    const draftMarkers = buildContinuousTrapezeDraft(start!, end!);

    expect(draftMarkers.length).toBeGreaterThan(0);
    expect(draftMarkers[0]?.label).toBe('Start');
    expect(draftMarkers[draftMarkers.length - 1]?.label).toBe('End');

    useToolStore.getState().setSupportDraftAnchor(start);
    useToolStore.getState().setSupportPrompt({
      kind: 'mount_height',
      title: 'Mount height required',
      description: 'Set a mount height before placing a continuous trapeze run.',
    });

    const created = applyContinuousTrapezeRun(start!, end!);

    expect(created).toBeGreaterThan(0);
    expect(useToolStore.getState().supportDraftAnchor).toBeNull();
    expect(useToolStore.getState().supportPrompt).toBeNull();
    expect(useEntityStore.getState().allIds.some((id) => useEntityStore.getState().byId[id]?.type === 'group')).toBe(true);
  });
});
