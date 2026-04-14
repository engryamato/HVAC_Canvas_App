import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  migrateLegacyState,
  normalizeCategories,
  useComponentLibraryStoreV2,
} from '../componentLibraryStoreV2';
import type { CatalogEntry, UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';

function createUnifiedComponent(
  overrides: Partial<UnifiedComponentDefinition> = {}
): UnifiedComponentDefinition {
  const now = new Date();
  return {
    id: overrides.id ?? 'component-1',
    name: overrides.name ?? 'Sample Duct',
    componentClass: overrides.componentClass ?? overrides.category ?? 'duct',
    categoryId: overrides.categoryId ?? 'standard_ductwork',
    typeId: overrides.typeId ?? overrides.type ?? 'duct',
    engineeringSystem: overrides.engineeringSystem ?? 'standard_duct',
    placeable: overrides.placeable ?? true,
    source: overrides.source ?? 'custom',
    category: overrides.category ?? 'duct',
    type: overrides.type ?? 'duct',
    subtype: overrides.subtype,
    manufacturer: overrides.manufacturer,
    model: overrides.model,
    partNumber: overrides.partNumber,
    sku: overrides.sku,
    description: overrides.description,
    thumbnail: overrides.thumbnail,
    systemType: overrides.systemType ?? 'supply',
    pressureClass: overrides.pressureClass,
    engineeringProperties: overrides.engineeringProperties ?? {
      frictionFactor: 0.0005,
      maxVelocity: 2000,
    },
    pricing: overrides.pricing ?? {
      materialCost: 10,
      laborUnits: 1,
      wasteFactor: 0.1,
    },
    materials: overrides.materials ?? [],
    defaultDimensions: overrides.defaultDimensions,
    tags: overrides.tags,
    customFields: overrides.customFields,
    isCustom: overrides.isCustom ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createCatalogEntry(overrides: Partial<CatalogEntry> = {}): CatalogEntry {
  return createUnifiedComponent(overrides);
}

describe('componentLibraryStoreV2', () => {
  beforeEach(() => {
    useComponentLibraryStoreV2.getState().reset();
  });

  it('supports add, update, duplicate, delete and activation flows', () => {
    const store = useComponentLibraryStoreV2.getState();
    store.addComponent(createUnifiedComponent({ id: 'c1', name: 'Primary Duct' }));

    expect(useComponentLibraryStoreV2.getState().components).toHaveLength(1);

    store.updateComponent('c1', { name: 'Updated Duct' });
    expect(useComponentLibraryStoreV2.getState().getComponent('c1')?.name).toBe('Updated Duct');

    store.activateComponent('c1');
    expect(useComponentLibraryStoreV2.getState().getActiveComponent()?.id).toBe('c1');

    store.duplicateComponent('c1');
    expect(useComponentLibraryStoreV2.getState().components).toHaveLength(2);
    expect(
      useComponentLibraryStoreV2
        .getState()
        .components.some((component) => component.name.includes('(Copy)'))
    ).toBe(true);

    store.deleteComponent('c1');
    expect(useComponentLibraryStoreV2.getState().getComponent('c1')).toBeUndefined();
  });

  it('supports search, category tree filtering, and tag filtering', () => {
    const store = useComponentLibraryStoreV2.getState();

    store.addCategory({
      id: 'duct-root',
      name: 'Duct Root',
      parentId: null,
      subcategories: [{ id: 'duct-round', name: 'Round', parentId: 'duct-root', subcategories: [] }],
    });

    store.addComponent(
      createUnifiedComponent({
        id: 'round-duct',
        name: 'Round Main Duct',
        categoryId: 'duct-root',
        category: 'duct',
        tags: ['round', 'main'],
        description: 'Main supply trunk',
      })
    );
    store.addComponent(
      createUnifiedComponent({
        id: 'fan-1',
        name: 'Fan',
        category: 'equipment',
        type: 'equipment',
        tags: ['equipment'],
      })
    );

    expect(store.search('round').map((item) => item.id)).toContain('round-duct');
    expect(store.getByCategoryTree('duct-root').map((item) => item.id)).toContain('round-duct');

    store.setFilterTags(['round']);
    expect(store.getFilteredComponents().map((item) => item.id)).toContain('round-duct');
  });

  it('returns only placeable filtered entries and warns on service conflicts', () => {
    const store = useComponentLibraryStoreV2.getState();

    store.addSystemProfile({
      id: 'profile-standard',
      name: 'Standard Ductwork',
      engineeringSystem: 'standard_duct',
      defaultSystemType: 'supply',
      color: '#2563eb',
      source: 'baseline',
      supportedArchetypes: {
        duct: ['round'],
        fitting: ['elbow'],
        equipment: ['fan'],
        accessory: ['damper'],
      },
      fittingRules: [],
      dimensionalConstraints: {},
      complianceRefs: [],
      calculationCapabilities: ['sizing'],
    });

    store.addEntry(
      createCatalogEntry({
        id: 'placeable-entry',
        name: 'Round Duct',
        componentClass: 'duct',
        typeId: 'round',
        tags: ['round', 'supply'],
      })
    );
    store.addEntry(
      createCatalogEntry({
        id: 'hidden-entry',
        name: 'Internal Template',
        placeable: false,
        tags: ['round'],
      })
    );

    store.setSearchQuery('round');
    store.setFilterTags(['round']);
    store.selectEntry('placeable-entry');

    expect(store.getFilteredEntries().map((entry) => entry.id)).toEqual(['placeable-entry']);
    expect(store.getServiceConflictWarning()).toBeNull();

    store.setSystemType('exhaust');
    expect(store.getServiceConflictWarning()).toContain('Service override is set to exhaust');
  });

  it('derives activation intent and archetype lists from the active entry', () => {
    const store = useComponentLibraryStoreV2.getState();

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

    store.addEntry(
      createCatalogEntry({
        id: 'standard-duct',
        name: 'Standard Duct',
        componentClass: 'duct',
        engineeringSystem: 'standard_duct',
        source: 'system',
        systemType: 'supply',
      })
    );
    store.addEntry(
      createCatalogEntry({
        id: 'single-wall-pipe',
        name: 'Single Wall Pipe',
        componentClass: 'duct',
        engineeringSystem: 'boiler_flue',
        source: 'system',
        systemType: 'exhaust',
        specialtyToolId: 'single_wall_pipe',
      })
    );

    store.selectEntry('standard-duct');
    expect(store.getAvailableArchetypes()).toEqual(['straight']);
    expect(store.getActivationIntent()).toMatchObject({
      entryId: 'standard-duct',
      componentClass: 'duct',
      specialtyToolId: null,
      engineeringSystem: 'standard_duct',
      systemType: 'supply',
      defaultSystemType: 'supply',
    });

    store.selectEntry('single-wall-pipe');
    expect(store.getAvailableArchetypes()).toEqual(['single_wall_pipe']);
    expect(store.getActivationIntent()).toMatchObject({
      entryId: 'single-wall-pipe',
      componentClass: 'duct',
      specialtyToolId: 'single-wall-pipe',
      engineeringSystem: 'boiler_flue',
      systemType: 'exhaust',
      defaultSystemType: 'exhaust',
    });
  });

  it('supports cloneEntry and customizeEntry canonical flows', () => {
    const store = useComponentLibraryStoreV2.getState();
    store.addEntry(createCatalogEntry({ id: 'base-entry', name: 'Base Entry', source: 'system' }));

    const cloneId = store.cloneEntry('base-entry');
    const customizeId = store.customizeEntry('base-entry');
    const refreshed = useComponentLibraryStoreV2.getState();

    expect(cloneId).toBeTruthy();
    expect(customizeId).toBeTruthy();
    expect(refreshed.getEntry(cloneId!)?.source).toBe('custom');
    expect(refreshed.pendingEditEntryId).toBe(customizeId);
    expect(refreshed.getEntry(customizeId!)?.source).toBe('custom');
  });

  it('keeps compatibility aliases synchronized with canonical store state', () => {
    const store = useComponentLibraryStoreV2.getState();
    store.addEntry(createCatalogEntry({ id: 'compat-entry' }));
    store.selectEntry('compat-entry');
    const refreshed = useComponentLibraryStoreV2.getState();

    expect(refreshed.components).toHaveLength(1);
    expect(refreshed.activeComponentId).toBe('compat-entry');
    expect(refreshed.getComponent('compat-entry')?.id).toBe('compat-entry');
  });

  it('stores and toggles enable flag state', () => {
    const store = useComponentLibraryStoreV2.getState();
    expect(store.isEnabled).toBe(false);
    store.setEnabled(true);
    expect(useComponentLibraryStoreV2.getState().isEnabled).toBe(true);
  });
});

describe('componentLibraryStoreV2 migration helpers', () => {
  it('migrates legacy component payloads into canonical catalog entries', () => {
    const migrated = migrateLegacyState({
      components: [
        {
          id: 'legacy-1',
          name: 'Legacy Duct',
          category: 'duct',
          type: 'round',
          pricing: { materialCost: 0, laborUnits: 0, wasteFactor: 0 },
          engineeringProperties: { frictionFactor: 0.02, maxVelocity: 2500, minVelocity: 500, maxPressureDrop: 0.1 },
          materials: [],
          isCustom: true,
        },
      ],
      activeComponentId: 'legacy-1',
    });

    expect(migrated.catalogEntries).toHaveLength(1);
    expect(migrated.catalogEntries[0]).toMatchObject({
      componentClass: 'duct',
      categoryId: 'standard_ductwork',
      typeId: 'round',
      engineeringSystem: 'standard_duct',
      placeable: true,
      source: 'custom',
    });
    expect(migrated.activeEntryId).toBe('legacy-1');
  });

  it('normalizes nested categories and removes duplicates by id', () => {
    const normalized = normalizeCategories([
      {
        id: 'air_distribution',
        name: 'Air Distribution',
        parentId: null,
        subcategories: [
          { id: 'standard_ductwork', name: 'Standard Ductwork', parentId: 'air_distribution' },
          { id: 'standard_ductwork', name: 'Duplicate Standard Ductwork', parentId: 'air_distribution' },
        ],
      },
    ]);

    expect(normalized).toEqual([
      { id: 'air_distribution', name: 'Air Distribution', parentId: null, subcategories: undefined },
      { id: 'standard_ductwork', name: 'Standard Ductwork', parentId: 'air_distribution', subcategories: undefined },
    ]);
  });
});

describe('ENABLE_UNIFIED_COMPONENT_LIBRARY', () => {
  it('honors NEXT_PUBLIC_ENABLE_UNIFIED_COMPONENT_LIBRARY=false', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_ENABLE_UNIFIED_COMPONENT_LIBRARY', 'false');

    const importedModule = await import('../componentLibraryStoreV2');
    expect(importedModule.ENABLE_UNIFIED_COMPONENT_LIBRARY).toBe(false);

    vi.unstubAllEnvs();
  });
});
