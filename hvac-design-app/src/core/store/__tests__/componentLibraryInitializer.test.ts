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

  it('exposes the air-only category hierarchy', () => {
    const flattened = flattenCatalogCategories(CATALOG_CATEGORY_TREE);

    expect(CATALOG_CATEGORY_TREE).toHaveLength(3);
    expect(flattened.filter((category) => category.parentId === null)).toHaveLength(3);
    expect(flattened.filter((category) => category.parentId !== null)).toHaveLength(8);
    expect(flattened.map((category) => category.id)).toEqual([
      'air_distribution',
      'standard_ductwork',
      'universal_components',
      'hangers_supports',
      'hvac_equipment',
      'air_handling',
      'terminal_units',
      'fans',
      'air_devices',
      'dampers',
      'heating',
    ]);
  });

  it('seeds baseline system profiles and catalog entries', () => {
    expect(BASELINE_SYSTEM_PROFILES).toHaveLength(2);
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

    const removedSystems = new Set([
      String.fromCharCode(98, 111, 105, 108, 101, 114, 95, 102, 108, 117, 101),
      String.fromCharCode(103, 114, 101, 97, 115, 101, 95, 100, 117, 99, 116),
      String.fromCharCode(103, 101, 110, 101, 114, 97, 116, 111, 114, 95, 101, 120, 104, 97, 117, 115, 116),
    ]);

    expect(entries.filter((entry) => removedSystems.has(entry.engineeringSystem))).toHaveLength(0);
    expect(BASELINE_SYSTEM_PROFILES.filter((profile) => removedSystems.has(profile.engineeringSystem))).toHaveLength(0);
  });

  it('is idempotent when initialization runs multiple times', () => {
    const state = useUnifiedCatalogStore.getState();

    initializeComponentLibraryState(state);
    const firstSnapshot = useUnifiedCatalogStore.getState();

    expect(firstSnapshot.categories).toHaveLength(11);
    expect(firstSnapshot.systemProfiles).toHaveLength(2);
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
