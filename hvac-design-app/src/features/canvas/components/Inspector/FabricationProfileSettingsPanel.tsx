import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import { resolveDuctFabricationFamily, type DuctFabricationFamily } from '@/core/schema/fabrication-profile.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';

const ROWS: Array<{ family: DuctFabricationFamily; label: string }> = [
  { family: 'rectangular_rigid', label: 'Rectangular' },
  { family: 'round_rigid', label: 'Round Rigid' },
  { family: 'flat_oval', label: 'Flat Oval' },
  { family: 'flexible', label: 'Flexible' },
];

export function FabricationProfileSettingsPanel() {
  const draft = useFabricationProfileStore((state) => state.draft);
  const updateDraftDefault = useFabricationProfileStore((state) => state.setDraftDefaultSectionLength);
  const commitDraft = useFabricationProfileStore((state) => state.commitDraft);
  const revertDraft = useFabricationProfileStore((state) => state.revertDraft);
  const resetProfile = useFabricationProfileStore((state) => state.resetProfiles);
  const recomputeNonOverriddenRuns = () => {
    const profile = useFabricationProfileStore.getState().committed;
    const { byId, updateEntity } = useEntityStore.getState();

    Object.values(byId).forEach((entity) => {
      if (entity?.type !== 'duct_run' || entity.props.sectionLengthOverride) {
        return;
      }

      const family = resolveDuctFabricationFamily(entity.props.shape);
      updateEntity(entity.id, {
        props: {
          ...entity.props,
          segments: recomputeDuctRunSegments(
            entity.props.installLength,
            profile.profiles[family].defaultSectionLength
          ),
        },
      });
    });
  };
  const saveProfile = () => {
    commitDraft();
    recomputeNonOverriddenRuns();
  };

  return (
    <div className="space-y-3">
      {ROWS.map(({ family, label }) => (
        <label key={family} className="grid grid-cols-[1fr_5rem] items-center gap-2">
          <span className="text-sm text-slate-700">{label}</span>
          <input
            type="number"
            min={draft.profiles[family].minSectionLength}
            max={draft.profiles[family].maxSectionLength}
            step={0.5}
            value={draft.profiles[family].defaultSectionLength}
            onChange={(event) => updateDraftDefault(family, Number(event.currentTarget.value))}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      ))}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={saveProfile} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
          Save
        </button>
        <button type="button" onClick={revertDraft} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            resetProfile();
            recomputeNonOverriddenRuns();
          }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
