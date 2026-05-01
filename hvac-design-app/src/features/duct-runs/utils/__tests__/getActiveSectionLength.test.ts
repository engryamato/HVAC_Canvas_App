import { beforeEach, describe, expect, it } from 'vitest';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import { getActiveSectionLength } from '../getActiveSectionLength';

describe('getActiveSectionLength', () => {
  beforeEach(() => {
    useFabricationProfileStore.persist?.clearStorage?.();
    useFabricationProfileStore.getState().resetProfiles();
  });

  it('uses the explicit run override first', () => {
    expect(
      getActiveSectionLength({
        props: {
          engineeringSystem: 'standard_duct',
          shape: 'rectangular',
          sectionLengthOverride: 7,
        },
      } as never)
    ).toBe(7);
  });

  it('falls back to the fabrication profile default when no override exists', () => {
    useFabricationProfileStore.getState().setDraftDefaultSectionLength('flat_oval', 9);
    useFabricationProfileStore.getState().commitDraft();

    expect(
      getActiveSectionLength({
        props: {
          engineeringSystem: 'boiler_flue',
          shape: 'flat_oval',
        },
      } as never)
    ).toBe(9);
  });
});
