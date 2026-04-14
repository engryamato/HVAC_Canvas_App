import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CatalogPanel } from '../CatalogPanel';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useLayoutStore } from '@/stores/useLayoutStore';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';

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
    specialtyToolId: overrides.specialtyToolId,
    subtype: overrides.subtype,
    systemType: overrides.systemType ?? 'supply',
    recommendedFittingEntryIds: overrides.recommendedFittingEntryIds ?? [],
    recommendedAccessoryEntryIds: overrides.recommendedAccessoryEntryIds ?? [],
    recommendedEquipmentEntryIds: overrides.recommendedEquipmentEntryIds ?? [],
    iconKey: overrides.iconKey,
    connectionNotes: overrides.connectionNotes ?? [],
    pressureClass: overrides.pressureClass,
    manufacturer: overrides.manufacturer,
    model: overrides.model,
    description: overrides.description,
    keySpec: overrides.keySpec,
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
    icon: overrides.icon,
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
      accessory: ['damper'],
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
      id: 'round-duct',
      name: 'Round Duct',
      componentClass: 'duct',
      category: 'duct',
      categoryId: 'standard_ductwork',
      typeId: 'straight',
      type: 'straight',
      engineeringSystem: 'standard_duct',
      source: 'system',
      keySpec: '12 in dia',
      description: 'Standard round duct',
      iconKey: 'duct_round',
      recommendedFittingEntryIds: ['radius-elbow'],
      recommendedAccessoryEntryIds: ['custom-hanger'],
      recommendedEquipmentEntryIds: ['terminal-box'],
      connectionNotes: ['Round branch with elbow and terminal accessories.'],
    })
  );

  store.addEntry(
    createEntry({
      id: 'single-wall-pipe',
      name: 'Single Wall Pipe',
      componentClass: 'duct',
      category: 'duct',
      categoryId: 'boiler_flue',
      typeId: 'single_wall_pipe',
      type: 'single_wall_pipe',
      engineeringSystem: 'boiler_flue',
      source: 'system',
      keySpec: '1/4 in per ft slope',
      description: 'Boiler flue duct',
      iconKey: 'duct_boiler_single_wall',
    })
  );

  store.addEntry(
    createEntry({
      id: 'radius-elbow',
      name: 'Radius Elbow',
      componentClass: 'fitting',
      category: 'fitting',
      categoryId: 'standard_ductwork',
      typeId: 'elbow',
      type: 'elbow',
      subtype: 'radius',
      engineeringSystem: 'standard_duct',
      source: 'system',
      keySpec: 'Round / Rect / Oval',
      iconKey: 'fitting_elbow_radius',
    })
  );

  store.addEntry(
    createEntry({
      id: 'terminal-box',
      name: 'VAV Terminal Box',
      componentClass: 'equipment',
      category: 'equipment',
      categoryId: 'standard_ductwork',
      typeId: 'terminal_box',
      type: 'terminal_box',
      engineeringSystem: 'standard_duct',
      source: 'system',
      iconKey: 'equipment_terminal_box',
    })
  );

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
      keySpec: 'Inline custom spec',
      iconKey: 'accessory_support_hanger',
      isCustom: true,
    })
  );

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
      keySpec: 'Internal only',
      iconKey: 'accessory_support_hanger',
    })
  );
}

describe('CatalogPanel', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetLayout();
    seedStore();
  });

  it('collapses domain groups and narrows the tree to search matches', () => {
    render(<CatalogPanel />);

    expect(screen.getByTestId('catalog-category-standard_ductwork')).toBeDefined();

    fireEvent.click(screen.getByTestId('catalog-root-air_distribution'));
    expect(screen.queryByTestId('catalog-category-standard_ductwork')).toBeNull();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: 'Single Wall Pipe' } });

    expect(screen.queryByTestId('catalog-root-air_distribution')).toBeNull();
    expect(screen.getByTestId('catalog-root-specialty_exhaust')).toBeDefined();
    expect(screen.getByTestId('catalog-category-boiler_flue')).toBeDefined();
    expect(screen.queryByTestId('catalog-category-standard_ductwork')).toBeNull();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: 'supports' } });

    expect(screen.queryByTestId('catalog-root-air_distribution')).toBeNull();
    expect(screen.getByTestId('catalog-root-universal_components')).toBeDefined();
    expect(screen.getByTestId('catalog-category-hangers_supports')).toBeDefined();
  });

  it('shows spec preview and inline delete confirmation for custom cards', async () => {
    render(<CatalogPanel />);

    expect(screen.getByText('Inline custom spec')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Open actions for Custom Hanger' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('Delete this entry?')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('Custom Hanger')).toBeNull();
    });
  });

  it('renders type-aware duct and fitting icons for library cards', () => {
    render(<CatalogPanel />);

    expect(screen.getByTestId('catalog-card-icon-round-duct')).toHaveAttribute('data-icon-key', 'duct_round');
    expect(screen.getByTestId('catalog-card-icon-single-wall-pipe')).toHaveAttribute('data-icon-key', 'duct_boiler_single_wall');
    expect(screen.getByTestId('catalog-card-icon-radius-elbow')).toHaveAttribute('data-icon-key', 'fitting_elbow_radius');
  });

  it('shows the active component compatibility summary outside the card grid', () => {
    render(<CatalogPanel />);

    fireEvent.click(screen.getByTestId('catalog-card-icon-round-duct').closest('button') as HTMLButtonElement);

    expect(screen.getByTestId('catalog-active-fittings')).toHaveTextContent('Radius Elbow');
    expect(screen.getByTestId('catalog-active-accessories')).toHaveTextContent('Custom Hanger');
    expect(screen.getByTestId('catalog-active-equipment')).toHaveTextContent('VAV Terminal Box');
    expect(screen.getByText('Round branch with elbow and terminal accessories.')).toBeDefined();
  });

  it('hides non-placeable entries and keeps service context controls visible', () => {
    useComponentLibraryStoreV2.getState().selectEntry('round-duct');
    useComponentLibraryStoreV2.getState().setSystemType('exhaust');

    render(<CatalogPanel />);

    expect(screen.queryByText('Managed Template')).toBeNull();
    expect(screen.getByRole('combobox', { name: /service context/i })).toBeDefined();
    expect(screen.getByText(/system override is set to exhaust/i)).toBeDefined();
  });

  it('switches the sidebar to Manage when customizing a catalog card', () => {
    render(<CatalogPanel />);

    fireEvent.click(screen.getByTestId('catalog-card-icon-round-duct').closest('button') as HTMLButtonElement);
    fireEvent.click(screen.getByRole('button', { name: /open actions for round duct/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Customize' }));

    expect(useLayoutStore.getState().activeLeftTab).toBe('manage');
    expect(useComponentLibraryStoreV2.getState().pendingEditEntryId).not.toBeNull();
  });
});
