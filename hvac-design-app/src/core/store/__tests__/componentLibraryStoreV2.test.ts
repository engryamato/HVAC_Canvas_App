import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useComponentLibraryStoreV2 } from '../componentLibraryStoreV2';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';

function createUnifiedComponent(
  overrides: Partial<UnifiedComponentDefinition> = {}
): UnifiedComponentDefinition {
  const now = new Date();
  return {
    id: overrides.id ?? 'component-1',
    name: overrides.name ?? 'Sample Duct',
    category: overrides.category ?? 'duct',
    type: overrides.type ?? 'duct',
    subtype: overrides.subtype,
    manufacturer: overrides.manufacturer,
    model: overrides.model,
    partNumber: overrides.partNumber,
    sku: overrides.sku,
    description: overrides.description,
    thumbnail: overrides.thumbnail,
    systemType: overrides.systemType,
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

  it('stores and toggles enable flag state', () => {
    const store = useComponentLibraryStoreV2.getState();
    expect(store.isEnabled).toBe(false);
    store.setEnabled(true);
    expect(useComponentLibraryStoreV2.getState().isEnabled).toBe(true);
  });
});

describe('ENABLE_UNIFIED_COMPONENT_LIBRARY', () => {
  it('honors NEXT_PUBLIC_ENABLE_UNIFIED_COMPONENT_LIBRARY=false', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_ENABLE_UNIFIED_COMPONENT_LIBRARY', 'false');

    const module = await import('../componentLibraryStoreV2');
    expect(module.ENABLE_UNIFIED_COMPONENT_LIBRARY).toBe(false);

    vi.unstubAllEnvs();
  });
});
