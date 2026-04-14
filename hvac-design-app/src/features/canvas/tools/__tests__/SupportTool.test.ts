import { beforeEach, describe, expect, it } from 'vitest';
import { SupportTool } from '../SupportTool';
import { createMockToolEvent } from './test-utils';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useToolStore } from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { createDuct } from '@/features/canvas/entities/ductDefaults';

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

describe('SupportTool', () => {
  let tool: SupportTool;

  beforeEach(() => {
    tool = new SupportTool();
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
      mountHeight: null,
      scope: 'all',
      codeStandard: 'smacna',
    });
  });

  it('previews hanger spacing on activate when the auto-hanger entry is active', () => {
    const duct = createDuct({
      name: 'Support Target',
      x: 0,
      y: 0,
      length: 24,
      airflow: 1200,
      catalogItemId: 'round-duct',
      engineeringSystem: 'standard_duct',
    });

    useEntityStore.getState().addEntity(duct);
    useUnifiedCatalogStore.getState().selectEntry('auto-hanger-spacing');

    tool.onActivate();

    expect(useToolStore.getState().supportPreviewMarkers.length).toBeGreaterThan(0);
    expect(useToolStore.getState().statusMessage).toMatch(/Previewed \d+ support markers/);
  });

  it('sets a mount-height prompt before starting continuous trapeze placement', () => {
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

    tool.onMouseDown(createMockToolEvent({ x: 0, y: 0 }));

    expect(useToolStore.getState().supportPrompt).toMatchObject({
      kind: 'mount_height',
      title: 'Mount height required',
    });

    useToolStore.getState().setSupportSettings({ mountHeight: 96 });
    tool.onMouseMove(createMockToolEvent({ x: 0, y: 0 }));
    tool.onMouseDown(createMockToolEvent({ x: 0, y: 0 }));

    expect(useToolStore.getState().supportDraftAnchor).toMatchObject({
      ductId: duct.id,
    });
    expect(useToolStore.getState().supportPrompt).toBeNull();
  });
});
