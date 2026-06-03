import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_FABRICATION_PROFILE } from '@/core/schema/fabrication-profile.schema';
import {
  FABRICATION_PROFILE_STORAGE_KEY,
  useFabricationProfileStore,
} from '../fabricationProfileStore';

describe('fabricationProfileStore', () => {
  beforeEach(() => {
    useFabricationProfileStore.persist?.clearStorage?.();
    useFabricationProfileStore.getState().resetProfiles();
  });

  it('loads deterministic 5 ft defaults for rectangular and round rigid families', () => {
    const state = useFabricationProfileStore.getState();

    expect(state.committed).toEqual(DEFAULT_FABRICATION_PROFILE);
    expect(state.getSectionLength('standard_duct', 'rectangular')).toBe(5);
    expect(state.getSectionLength('standard_duct', 'round')).toBe(5);
  });

  it('keeps draft edits isolated until commit', () => {
    const store = useFabricationProfileStore.getState();

    store.setDraftDefaultSectionLength('rectangular_rigid', 6);

    expect(useFabricationProfileStore.getState().draft.profiles.rectangular_rigid.defaultSectionLength).toBe(6);
    expect(
      useFabricationProfileStore.getState().committed.profiles.rectangular_rigid.defaultSectionLength
    ).toBe(5);

    useFabricationProfileStore.getState().revertDraft();

    expect(useFabricationProfileStore.getState().draft.profiles.rectangular_rigid.defaultSectionLength).toBe(5);
  });

  it('persists committed edits and supports reset', () => {
    const store = useFabricationProfileStore.getState();

    store.setDraftDefaultSectionLength('round_rigid', 8);
    store.commitDraft();

    const persisted = JSON.parse(localStorage.getItem(FABRICATION_PROFILE_STORAGE_KEY) ?? '{}');
    expect(persisted.state.committed.profiles.round_rigid.defaultSectionLength).toBe(8);
    expect(store.getSectionLength('standard_duct', 'round')).toBe(8);

    useFabricationProfileStore.getState().resetProfiles();

    expect(useFabricationProfileStore.getState().committed).toEqual(DEFAULT_FABRICATION_PROFILE);
  });
});
