import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { useActivationBridge } from '../useActivationBridge';
import { useToolStore } from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';

function ActivationBridgeProbe() {
  useActivationBridge();
  return null;
}

function seedBridgeStore() {
  const store = useUnifiedCatalogStore.getState();
  store.reset();

  store.addSystemProfile({
    id: 'standard-duct',
    name: 'Standard Ductwork',
    engineeringSystem: 'standard_duct',
    defaultSystemType: 'supply',
    color: '#2563eb',
    source: 'baseline',
    supportedArchetypes: {
      duct: ['straight'],
      fitting: ['elbow'],
      equipment: ['terminal_box'],
      accessory: ['damper'],
    },
    fittingRules: [],
    dimensionalConstraints: {},
    complianceRefs: [],
    calculationCapabilities: ['sizing'],
  });
  store.addSystemProfile({
    id: 'boiler-flue',
    name: 'Boiler & Water Heater Flue',
    engineeringSystem: 'boiler_flue',
    defaultSystemType: 'exhaust',
    color: '#ea580c',
    source: 'baseline',
    supportedArchetypes: {
      duct: ['single_wall_pipe'],
      fitting: ['boot_tee'],
      equipment: ['draft_inducer'],
      accessory: ['condensate_trap'],
    },
    fittingRules: [],
    dimensionalConstraints: {},
    complianceRefs: [],
    calculationCapabilities: ['sizing', 'compliance'],
  });

  store.addEntry({
    id: 'round-duct',
    name: 'Round Duct',
    componentClass: 'duct',
    category: 'duct',
    categoryId: 'standard_ductwork',
    typeId: 'straight',
    type: 'straight',
    engineeringSystem: 'standard_duct',
    placeable: true,
    source: 'system',
    recommendedFittingEntryIds: [],
    recommendedAccessoryEntryIds: [],
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
    id: 'single-wall-pipe',
    name: 'Single Wall Pipe',
    componentClass: 'fitting',
    category: 'fitting',
    categoryId: 'boiler_flue',
    typeId: 'elbow',
    type: 'elbow',
    subtype: 'radius',
    engineeringSystem: 'boiler_flue',
    placeable: true,
    source: 'system',
    specialtyToolId: 'single_wall_pipe',
    recommendedFittingEntryIds: [],
    recommendedAccessoryEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'exhaust',
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
    id: 'draft-inducer',
    name: 'Draft Inducer',
    componentClass: 'equipment',
    category: 'equipment',
    categoryId: 'boiler_flue',
    typeId: 'draft_inducer',
    type: 'draft_inducer',
    engineeringSystem: 'boiler_flue',
    placeable: true,
    source: 'system',
    specialtyToolId: 'draft_inducer',
    recommendedFittingEntryIds: [],
    recommendedAccessoryEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'exhaust',
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
}

describe('useActivationBridge', () => {
  beforeEach(() => {
    useToolStore.setState({
      currentTool: 'select',
      activeSpecialtyToolId: null,
      selectedEquipmentType: 'fan',
      selectedFittingType: 'elbow_90',
    });
    seedBridgeStore();
  });

  it('bridges active fitting entries into the tool store without assigning specialty mode', async () => {
    render(<ActivationBridgeProbe />);

    await act(async () => {
      useUnifiedCatalogStore.getState().selectEntry('single-wall-pipe');
    });

    await waitFor(() => {
      expect(useToolStore.getState().currentTool).toBe('fitting');
      expect(useToolStore.getState().activeSpecialtyToolId).toBeNull();
      expect(useToolStore.getState().selectedFittingType).toBe('elbow_90');
    });

    await act(async () => {
      useUnifiedCatalogStore.getState().selectEntry('round-duct');
    });

    await waitFor(() => {
      expect(useToolStore.getState().currentTool).toBe('duct');
      expect(useToolStore.getState().activeSpecialtyToolId).toBeNull();
    });
  });

  it('bridges equipment entries into the tool store without assigning specialty mode', async () => {
    render(<ActivationBridgeProbe />);

    await act(async () => {
      useUnifiedCatalogStore.getState().selectEntry('draft-inducer');
    });

    await waitFor(() => {
      expect(useToolStore.getState().currentTool).toBe('equipment');
      expect(useToolStore.getState().activeSpecialtyToolId).toBeNull();
      expect(useToolStore.getState().selectedEquipmentType).toBe('fan');
    });
  });

  it('routes universal support entries into the support tool and seeds hanger defaults', async () => {
    render(<ActivationBridgeProbe />);

    await act(async () => {
      useUnifiedCatalogStore.getState().selectEntry('auto-hanger-spacing');
    });

    await waitFor(() => {
      expect(useToolStore.getState().currentTool).toBe('support');
      expect(useToolStore.getState().activeSpecialtyToolId).toBeNull();
      expect(useToolStore.getState().supportSettings.hangerEntryId).toBe('clevis-hanger');
      expect(useToolStore.getState().supportPrompt).toBeNull();
    });
  });
});
