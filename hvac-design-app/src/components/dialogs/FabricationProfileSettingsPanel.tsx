'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import {
  DUCT_FABRICATION_FAMILY_LABELS,
  DuctFabricationFamily,
  FabricationProfile,
  FabricationProfileSchema,
} from '@/core/schema/fabrication-profile.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';
import type { DuctRun } from '@/core/schema';

type FabricationProfileFormState = Record<
  DuctFabricationFamily,
  {
    name: string;
    defaultSectionLength: string;
    allowedSectionLengths: string;
    minSectionLength: string;
    maxSectionLength: string;
  }
>;

function profileToFormState(profile: FabricationProfile): FabricationProfileFormState {
  return {
    rectangular_rigid: {
      name: profile.profiles.rectangular_rigid.name,
      defaultSectionLength: String(profile.profiles.rectangular_rigid.defaultSectionLength),
      allowedSectionLengths: profile.profiles.rectangular_rigid.allowedSectionLengths.join(', '),
      minSectionLength: String(profile.profiles.rectangular_rigid.minSectionLength),
      maxSectionLength: String(profile.profiles.rectangular_rigid.maxSectionLength),
    },
    round_rigid: {
      name: profile.profiles.round_rigid.name,
      defaultSectionLength: String(profile.profiles.round_rigid.defaultSectionLength),
      allowedSectionLengths: profile.profiles.round_rigid.allowedSectionLengths.join(', '),
      minSectionLength: String(profile.profiles.round_rigid.minSectionLength),
      maxSectionLength: String(profile.profiles.round_rigid.maxSectionLength),
    },
    flat_oval: {
      name: profile.profiles.flat_oval.name,
      defaultSectionLength: String(profile.profiles.flat_oval.defaultSectionLength),
      allowedSectionLengths: profile.profiles.flat_oval.allowedSectionLengths.join(', '),
      minSectionLength: String(profile.profiles.flat_oval.minSectionLength),
      maxSectionLength: String(profile.profiles.flat_oval.maxSectionLength),
    },
    flexible: {
      name: profile.profiles.flexible.name,
      defaultSectionLength: String(profile.profiles.flexible.defaultSectionLength),
      allowedSectionLengths: profile.profiles.flexible.allowedSectionLengths.join(', '),
      minSectionLength: String(profile.profiles.flexible.minSectionLength),
      maxSectionLength: String(profile.profiles.flexible.maxSectionLength),
    },
  };
}

function parseAllowedLengths(input: string): number[] {
  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
}

function formStateToProfile(formState: FabricationProfileFormState): FabricationProfile {
  return FabricationProfileSchema.parse({
    profiles: {
      rectangular_rigid: {
        family: 'rectangular_rigid',
        name: formState.rectangular_rigid.name.trim(),
        defaultSectionLength: Number(formState.rectangular_rigid.defaultSectionLength),
        allowedSectionLengths: parseAllowedLengths(formState.rectangular_rigid.allowedSectionLengths),
        minSectionLength: Number(formState.rectangular_rigid.minSectionLength),
        maxSectionLength: Number(formState.rectangular_rigid.maxSectionLength),
      },
      round_rigid: {
        family: 'round_rigid',
        name: formState.round_rigid.name.trim(),
        defaultSectionLength: Number(formState.round_rigid.defaultSectionLength),
        allowedSectionLengths: parseAllowedLengths(formState.round_rigid.allowedSectionLengths),
        minSectionLength: Number(formState.round_rigid.minSectionLength),
        maxSectionLength: Number(formState.round_rigid.maxSectionLength),
      },
      flat_oval: {
        family: 'flat_oval',
        name: formState.flat_oval.name.trim(),
        defaultSectionLength: Number(formState.flat_oval.defaultSectionLength),
        allowedSectionLengths: parseAllowedLengths(formState.flat_oval.allowedSectionLengths),
        minSectionLength: Number(formState.flat_oval.minSectionLength),
        maxSectionLength: Number(formState.flat_oval.maxSectionLength),
      },
      flexible: {
        family: 'flexible',
        name: formState.flexible.name.trim(),
        defaultSectionLength: Number(formState.flexible.defaultSectionLength),
        allowedSectionLengths: parseAllowedLengths(formState.flexible.allowedSectionLengths),
        minSectionLength: Number(formState.flexible.minSectionLength),
        maxSectionLength: Number(formState.flexible.maxSectionLength),
      },
    },
  });
}

function isDuctRunWithoutOverride(entity: unknown): entity is DuctRun {
  return Boolean(
    entity &&
      typeof entity === 'object' &&
      (entity as DuctRun).type === 'duct_run' &&
      typeof (entity as DuctRun).props?.sectionLengthOverride === 'undefined'
  );
}

const FABRICATION_FAMILIES: DuctFabricationFamily[] = [
  'rectangular_rigid',
  'round_rigid',
  'flat_oval',
  'flexible',
];

export function FabricationProfileSettingsPanel() {
  const committed = useFabricationProfileStore((state) => state.committed);
  const replaceDraft = useFabricationProfileStore((state) => state.replaceDraft);
  const commitDraft = useFabricationProfileStore((state) => state.commitDraft);
  const revertDraft = useFabricationProfileStore((state) => state.revertDraft);
  const resetDraftToDefaults = useFabricationProfileStore((state) => state.resetDraftToDefaults);

  const [formState, setFormState] = useState<FabricationProfileFormState>(() => profileToFormState(committed));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormState(profileToFormState(committed));
  }, [committed]);

  const hasChanges = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(profileToFormState(committed)),
    [committed, formState]
  );

  const handleFieldChange = (
    family: DuctFabricationFamily,
    field: keyof FabricationProfileFormState[DuctFabricationFamily],
    value: string
  ) => {
    setSavedMessage(null);
    setErrorMessage(null);
    setFormState((current) => ({
      ...current,
      [family]: {
        ...current[family],
        [field]: value,
      },
    }));
  };

  const recomputeAffectedRuns = (profile: FabricationProfile) => {
    const entityStore = useEntityStore.getState();

    Object.values(entityStore.byId).forEach((entity) => {
      if (!isDuctRunWithoutOverride(entity)) {
        return;
      }

      const nextDefaultSectionLength =
        profile.profiles[
          entity.props.shape === 'rectangular'
            ? 'rectangular_rigid'
            : entity.props.shape === 'round'
              ? 'round_rigid'
              : entity.props.shape === 'flat_oval'
                ? 'flat_oval'
                : 'flexible'
        ].defaultSectionLength;

      entityStore.updateEntity(entity.id, {
        props: {
          ...entity.props,
          segments: recomputeDuctRunSegments(entity.props.installLength, nextDefaultSectionLength),
        },
        modifiedAt: new Date().toISOString(),
      });
    });
  };

  const handleSave = () => {
    try {
      const nextProfile = formStateToProfile(formState);
      replaceDraft(nextProfile);
      commitDraft();
      recomputeAffectedRuns(nextProfile);
      setSavedMessage('Saved fabrication defaults and refreshed non-overridden runs.');
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save fabrication profile settings.';
      setErrorMessage(message);
    }
  };

  const handleCancel = () => {
    revertDraft();
    setFormState(profileToFormState(committed));
    setSavedMessage(null);
    setErrorMessage(null);
  };

  const handleReset = () => {
    resetDraftToDefaults();
    setFormState(profileToFormState(useFabricationProfileStore.getState().draft));
    setSavedMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4" data-testid="fabrication-profile-settings-panel">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">Fabrication Profiles</h3>
        <p className="text-xs text-slate-500">
          Global defaults affect runs without a local override. Runs with a custom section rule keep their own piece lengths.
        </p>
      </div>

      <div className="space-y-4">
        {FABRICATION_FAMILIES.map((family) => (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={family}>
            <div className="mb-3 text-sm font-semibold text-slate-900">
              {DUCT_FABRICATION_FAMILY_LABELS[family]}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor={`${family}-name`}>Profile Name</label>
                <Input
                  id={`${family}-name`}
                  value={formState[family].name}
                  onChange={(event) => handleFieldChange(family, 'name', event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor={`${family}-default`}>Default Section Length (ft)</label>
                <Input
                  id={`${family}-default`}
                  type="number"
                  step={0.5}
                  value={formState[family].defaultSectionLength}
                  onChange={(event) => handleFieldChange(family, 'defaultSectionLength', event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor={`${family}-min`}>Minimum Length (ft)</label>
                <Input
                  id={`${family}-min`}
                  type="number"
                  step={0.5}
                  value={formState[family].minSectionLength}
                  onChange={(event) => handleFieldChange(family, 'minSectionLength', event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor={`${family}-max`}>Maximum Length (ft)</label>
                <Input
                  id={`${family}-max`}
                  type="number"
                  step={0.5}
                  value={formState[family].maxSectionLength}
                  onChange={(event) => handleFieldChange(family, 'maxSectionLength', event.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-500" htmlFor={`${family}-allowed`}>Allowed Lengths (comma separated)</label>
                <Input
                  id={`${family}-allowed`}
                  value={formState[family].allowedSectionLengths}
                  onChange={(event) => handleFieldChange(family, 'allowedSectionLengths', event.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {errorMessage ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</div> : null}
      {savedMessage ? <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">{savedMessage}</div> : null}

      <div className="flex flex-wrap gap-2">
        <Button disabled={!hasChanges} size="sm" type="button" onClick={handleSave}>
          Save
        </Button>
        <Button disabled={!hasChanges} size="sm" type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button size="sm" type="button" variant="ghost" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export default FabricationProfileSettingsPanel;
