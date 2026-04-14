import { beforeEach, describe, expect, it } from 'vitest';
import {
  BASELINE_SYSTEM_PROFILES,
  CATALOG_CATEGORY_TREE,
  createSeedCatalogEntries,
  flattenCatalogCategories,
  initializeComponentLibraryState,
} from '../componentLibraryInitializer';
import { useUnifiedCatalogStore } from '../componentLibraryStoreV2';

describe('componentLibraryInitializer', () => {
  beforeEach(() => {
    useUnifiedCatalogStore.getState().reset();
  });

  it('exposes the exact 3 L1 -> 5 L2 category hierarchy', () => {
    const flattened = flattenCatalogCategories(CATALOG_CATEGORY_TREE);

    expect(CATALOG_CATEGORY_TREE).toHaveLength(3);
    expect(flattened.filter((category) => category.parentId === null)).toHaveLength(3);
    expect(flattened.filter((category) => category.parentId !== null)).toHaveLength(5);
    expect(flattened.map((category) => category.id)).toEqual([
      'air_distribution',
      'standard_ductwork',
      'specialty_exhaust',
      'boiler_flue',
      'grease_duct',
      'generator_exhaust',
      'universal_components',
      'hangers_supports',
    ]);
  });

  it('seeds baseline system profiles and catalog entries', () => {
    expect(BASELINE_SYSTEM_PROFILES).toHaveLength(5);
    const entries = createSeedCatalogEntries();

    expect(entries.length).toBeGreaterThan(0);

    const seedIds = new Set(entries.map((entry) => entry.id));
    const seedTargets = entries.filter((entry) => entry.componentClass !== 'accessory');

    seedTargets.forEach((entry) => {
      expect(entry.iconKey).toBeTruthy();
      expect(
        (entry.recommendedFittingEntryIds?.length ?? 0) +
          (entry.recommendedAccessoryEntryIds?.length ?? 0) +
          (entry.recommendedEquipmentEntryIds?.length ?? 0)
      ).toBeGreaterThan(0);

      [
        ...(entry.recommendedFittingEntryIds ?? []),
        ...(entry.recommendedAccessoryEntryIds ?? []),
        ...(entry.recommendedEquipmentEntryIds ?? []),
      ].forEach((targetId) => {
        expect(seedIds.has(targetId)).toBe(true);
      });
    });

    const specialtyOnlyEntries = entries.filter((entry) =>
      ['boiler_flue', 'grease_duct', 'generator_exhaust'].includes(entry.engineeringSystem)
    );

    specialtyOnlyEntries.forEach((entry) => {
      const references = [
        ...(entry.recommendedFittingEntryIds ?? []),
        ...(entry.recommendedAccessoryEntryIds ?? []),
        ...(entry.recommendedEquipmentEntryIds ?? []),
      ];

      references.forEach((targetId) => {
        const target = entries.find((candidate) => candidate.id === targetId);
        expect(target).toBeDefined();
        expect(target?.engineeringSystem).not.toBe('standard_duct');
      });
    });
  });

  it('is idempotent when initialization runs multiple times', () => {
    const state = useUnifiedCatalogStore.getState();

    initializeComponentLibraryState(state);
    const firstSnapshot = useUnifiedCatalogStore.getState();

    expect(firstSnapshot.categories).toHaveLength(8);
    expect(firstSnapshot.systemProfiles).toHaveLength(5);
    expect(firstSnapshot.catalogEntries.length).toBeGreaterThan(0);
    expect(firstSnapshot.isEnabled).toBe(true);
    expect(firstSnapshot.activeEntryId).not.toBeNull();

    initializeComponentLibraryState(useUnifiedCatalogStore.getState());
    const secondSnapshot = useUnifiedCatalogStore.getState();

    expect(secondSnapshot.categories).toHaveLength(firstSnapshot.categories.length);
    expect(secondSnapshot.systemProfiles).toHaveLength(firstSnapshot.systemProfiles.length);
    expect(secondSnapshot.catalogEntries).toHaveLength(firstSnapshot.catalogEntries.length);
  });
});
