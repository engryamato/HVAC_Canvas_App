import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { ManagePanel } from '../ManagePanel';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useEntityStore } from '@/core/store/entityStore';
import { createDuct } from '@/features/canvas/entities/ductDefaults';
import { useLayoutStore } from '@/stores/useLayoutStore';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import type { Entity } from '@/core/schema';

function createEntry(overrides: Partial<UnifiedComponentDefinition>): UnifiedComponentDefinition {
  const now = new Date();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? 'Sample Component',
    componentClass: overrides.componentClass ?? 'accessory',
    category: overrides.category ?? overrides.componentClass ?? 'accessory',
    categoryId: overrides.categoryId ?? 'standard_ductwork',
    typeId: overrides.typeId ?? 'sample',
    type: overrides.type ?? overrides.typeId ?? 'sample',
    engineeringSystem: overrides.engineeringSystem ?? 'standard_duct',
    placeable: overrides.placeable ?? true,
    source: overrides.source ?? 'system',
    recommendedFittingEntryIds: overrides.recommendedFittingEntryIds ?? [],
    recommendedAccessoryEntryIds: overrides.recommendedAccessoryEntryIds ?? [],
    recommendedEquipmentEntryIds: overrides.recommendedEquipmentEntryIds ?? [],
    connectionNotes: overrides.connectionNotes ?? [],
    systemType: overrides.systemType ?? 'supply',
    pressureClass: overrides.pressureClass,
    manufacturer: overrides.manufacturer,
    model: overrides.model,
    description: overrides.description,
    engineeringProperties: overrides.engineeringProperties ?? {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: overrides.pricing ?? {
      materialCost: 10,
      laborUnits: 1,
      wasteFactor: 0.1,
    },
    materials: overrides.materials ?? [],
    tags: overrides.tags,
    customFields: overrides.customFields,
    isCustom: overrides.isCustom ?? overrides.source === 'custom',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function seedStore() {
  const store = useComponentLibraryStoreV2.getState();
  store.reset();
  store.addCategory({ id: 'air_distribution', name: 'Air Distribution', parentId: null, subcategories: [] });
  store.addCategory({ id: 'standard_ductwork', name: 'Standard Ductwork', parentId: 'air_distribution', subcategories: [] });
  store.addCategory({ id: 'specialty_exhaust', name: 'Specialty Exhaust', parentId: null, subcategories: [] });
  store.addCategory({ id: 'boiler_flue', name: 'Boiler & Water Heater Flue', parentId: 'specialty_exhaust', subcategories: [] });
  store.addCategory({ id: 'universal_components', name: 'Universal Components', parentId: null, subcategories: [] });
  store.addCategory({ id: 'hangers_supports', name: 'Hangers, Supports & Seismic', parentId: 'universal_components', subcategories: [] });

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
      accessory: ['damper', 'turning_vanes'],
    },
    fittingRules: [],
    dimensionalConstraints: {},
    complianceRefs: [],
    calculationCapabilities: [],
  });
  store.addSystemProfile({
    id: 'universal',
    name: 'Universal Components',
    engineeringSystem: 'universal',
    defaultSystemType: 'supply',
    color: '#0f766e',
    source: 'baseline',
    supportedArchetypes: {
      duct: [],
      fitting: [],
      equipment: ['auto_hanger_spacing'],
      accessory: ['hanger', 'support', 'seismic'],
    },
    fittingRules: [],
    dimensionalConstraints: {},
    complianceRefs: [],
    calculationCapabilities: [],
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
    calculationCapabilities: [],
  });

  store.addEntry(
    createEntry({
      id: 'managed-template',
      name: 'Managed Template',
      componentClass: 'accessory',
      category: 'accessory',
      categoryId: 'hangers_supports',
      typeId: 'template',
      type: 'template',
      engineeringSystem: 'universal',
      source: 'custom',
      placeable: false,
      isCustom: true,
      systemType: 'supply',
    })
  );
}

describe('ManagePanel', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetLayout();
    useEntityStore.getState().clearAllEntities();
    useLayoutStore.setState({ activeLeftTab: 'manage' });
    seedStore();
  });

  it('filters the list by category and opens the read-only customizer flow for system entries', async () => {
    const store = useComponentLibraryStoreV2.getState();
    store.addEntry(
      createEntry({
        id: 'round-duct',
        name: 'Round Duct',
        componentClass: 'duct',
        category: 'duct',
        categoryId: 'standard_ductwork',
        typeId: 'straight',
        type: 'straight',
        engineeringSystem: 'standard_duct',
        source: 'system',
        systemType: 'supply',
      })
    );
    store.addEntry(
      createEntry({
        id: 'rect-duct',
        name: 'Rectangular Duct',
        componentClass: 'duct',
        category: 'duct',
        categoryId: 'boiler_flue',
        typeId: 'straight',
        type: 'straight',
        engineeringSystem: 'boiler_flue',
        source: 'system',
        systemType: 'exhaust',
      })
    );

    render(<ManagePanel activeTab="manage" />);

    expect(screen.getByRole('button', { name: 'Import' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDefined();

    fireEvent.click(screen.getByTestId('manage-category-leaf-standard_ductwork'));
    expect(screen.getByTestId('manage-entry-round-duct')).toBeDefined();
    expect(screen.queryByTestId('manage-entry-rect-duct')).toBeNull();

    fireEvent.click(screen.getByTestId('manage-entry-round-duct'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('System components are read-only. Customize creates a custom copy that can be edited here.')).toBeDefined();
    expect(within(dialog).getByRole('button', { name: 'Customize' })).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Customize' }));
    await waitFor(() => {
      expect(screen.getAllByText('Round Duct (Custom)').length).toBeGreaterThan(0);
    });
  });

  it('removes custom entries through the inline delete confirmation', async () => {
    const store = useComponentLibraryStoreV2.getState();
    store.addEntry(
      createEntry({
        id: 'custom-hanger',
        name: 'Custom Hanger',
        componentClass: 'accessory',
        category: 'accessory',
        categoryId: 'hangers_supports',
        typeId: 'hanger',
        type: 'hanger',
        engineeringSystem: 'universal',
        source: 'custom',
        systemType: 'supply',
        isCustom: true,
      })
    );
    useEntityStore.getState().addEntity(
      createDuct({
        name: 'Referenced duct',
        serviceId: 'custom-hanger',
        catalogItemId: 'custom-hanger',
      }) as unknown as Entity
    );

    render(<ManagePanel activeTab="manage" />);

    fireEvent.click(screen.getByTestId('manage-entry-custom-hanger'));
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(within(dialog).getByText('Delete this custom component?')).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }));

    await waitFor(() => {
      expect(screen.queryByText('Custom Hanger')).toBeNull();
    });
  });

  it('shows unsaved changes and canvas reference warnings in the slide-over editor', async () => {
    const store = useComponentLibraryStoreV2.getState();
    store.addEntry(
      createEntry({
        id: 'custom-hanger',
        name: 'Custom Hanger',
        componentClass: 'accessory',
        category: 'accessory',
        categoryId: 'hangers_supports',
        typeId: 'hanger',
        type: 'hanger',
        engineeringSystem: 'universal',
        source: 'custom',
        systemType: 'supply',
        isCustom: true,
      })
    );
    useEntityStore.getState().addEntity(
      createDuct({
        name: 'Referenced duct',
        serviceId: 'custom-hanger',
        catalogItemId: 'custom-hanger',
      }) as unknown as Entity
    );

    render(<ManagePanel activeTab="manage" />);

    fireEvent.click(screen.getByTestId('manage-entry-custom-hanger'));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText(/referenced by 1 canvas placement/i)).toBeDefined();

    const nameInput = within(dialog).getByDisplayValue('Custom Hanger');
    fireEvent.change(nameInput, { target: { value: 'Custom Hanger Updated' } });

    expect(within(dialog).getByText('Unsaved changes')).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(within(dialog).getByText(/still reference this component/i)).toBeDefined();
  });

  it('keeps non-placeable entries in the manage list and auto-opens pending edits with archetype options', async () => {
    const store = useComponentLibraryStoreV2.getState();
    store.addEntry(
      createEntry({
        id: 'round-duct',
        name: 'Round Duct',
        componentClass: 'duct',
        category: 'duct',
        categoryId: 'standard_ductwork',
        typeId: 'straight',
        type: 'straight',
        engineeringSystem: 'standard_duct',
        source: 'system',
        systemType: 'supply',
      })
    );

    const pendingEditId = store.customizeEntry('round-duct');
    expect(pendingEditId).toBeTruthy();

    render(<ManagePanel activeTab="manage" />);

    expect(screen.getByTestId('manage-entry-managed-template')).toBeDefined();

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Round Duct (Custom)')).toBeDefined();

    const selects = Array.from(dialog.querySelectorAll('select')) as HTMLSelectElement[];
    const componentClassSelect = selects[1];
    const engineeringSystemSelect = selects[2];
    const archetypeSelect = selects[3];

    expect(archetypeSelect).toHaveValue('straight');

    fireEvent.change(componentClassSelect, { target: { value: 'fitting' } });
    expect(archetypeSelect).toHaveValue('elbow');

    fireEvent.change(engineeringSystemSelect, { target: { value: 'boiler_flue' } });
    await waitFor(() => {
      expect((dialog.querySelectorAll('select')[3] as HTMLSelectElement | undefined)).toHaveValue('boot_tee');
    });
  });
});
