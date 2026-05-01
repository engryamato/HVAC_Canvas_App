import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_FABRICATION_PROFILE,
  FabricationProfileSchema,
  resolveDuctFabricationFamily,
  type DuctFabricationFamily,
  type FabricationProfile,
} from '@/core/schema/fabrication-profile.schema';
import type { DuctRunFamily, DuctRunShape } from '@/core/schema/duct-run.schema';

export const FABRICATION_PROFILE_STORAGE_KEY = 'sws.fabrication-profile';

function cloneFabricationProfile(profile: FabricationProfile): FabricationProfile {
  return FabricationProfileSchema.parse(structuredClone(profile));
}

interface FabricationProfileActions {
  setDraftDefaultSectionLength: (family: DuctFabricationFamily, length: number) => void;
  setDraftAllowedSectionLengths: (
    family: DuctFabricationFamily,
    allowedSectionLengths: number[]
  ) => void;
  setDraftName: (family: DuctFabricationFamily, name: string) => void;
  commitDraft: () => void;
  revertDraft: () => void;
  resetProfiles: () => void;
  getSectionLength: (engineeringSystem: DuctRunFamily, shape: DuctRunShape) => number;
}

export interface FabricationProfileState {
  committed: FabricationProfile;
  draft: FabricationProfile;
}

type FabricationProfileStore = FabricationProfileState & FabricationProfileActions;

const FABRICATION_PROFILE_DEFAULT_STATE: FabricationProfileState = {
  committed: cloneFabricationProfile(DEFAULT_FABRICATION_PROFILE),
  draft: cloneFabricationProfile(DEFAULT_FABRICATION_PROFILE),
};

export const useFabricationProfileStore = create<FabricationProfileStore>()(
  persist(
    (set, get) => ({
      ...FABRICATION_PROFILE_DEFAULT_STATE,

      setDraftDefaultSectionLength: (family, length) =>
        set((state) => ({
          draft: FabricationProfileSchema.parse({
            profiles: {
              ...state.draft.profiles,
              [family]: {
                ...state.draft.profiles[family],
                defaultSectionLength: length,
                allowedSectionLengths: state.draft.profiles[family].allowedSectionLengths.includes(length)
                  ? state.draft.profiles[family].allowedSectionLengths
                  : [...state.draft.profiles[family].allowedSectionLengths, length].sort((a, b) => a - b),
              },
            },
          }),
        })),

      setDraftAllowedSectionLengths: (family, allowedSectionLengths) =>
        set((state) => ({
          draft: FabricationProfileSchema.parse({
            profiles: {
              ...state.draft.profiles,
              [family]: {
                ...state.draft.profiles[family],
                allowedSectionLengths: [...allowedSectionLengths].sort((a, b) => a - b),
              },
            },
          }),
        })),

      setDraftName: (family, name) =>
        set((state) => ({
          draft: FabricationProfileSchema.parse({
            profiles: {
              ...state.draft.profiles,
              [family]: {
                ...state.draft.profiles[family],
                name,
              },
            },
          }),
        })),

      commitDraft: () =>
        set((state) => {
          const committed = cloneFabricationProfile(state.draft);
          return {
            committed,
            draft: cloneFabricationProfile(committed),
          };
        }),

      revertDraft: () =>
        set((state) => ({
          draft: cloneFabricationProfile(state.committed),
        })),

      resetProfiles: () =>
        set(() => ({
          committed: cloneFabricationProfile(DEFAULT_FABRICATION_PROFILE),
          draft: cloneFabricationProfile(DEFAULT_FABRICATION_PROFILE),
        })),

      getSectionLength: (_engineeringSystem, shape) => {
        const family = resolveDuctFabricationFamily(shape);
        return get().committed.profiles[family].defaultSectionLength;
      },
    }),
    {
      name: FABRICATION_PROFILE_STORAGE_KEY,
      partialize: (state) => ({
        committed: state.committed,
        draft: state.draft,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<FabricationProfileState> | undefined;
        if (!state?.committed || !state?.draft) {
          return currentState;
        }

        return {
          ...currentState,
          committed: FabricationProfileSchema.parse(state.committed),
          draft: FabricationProfileSchema.parse(state.draft),
        };
      },
    }
  )
);
