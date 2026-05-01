import type { DuctRun } from '@/core/schema';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';

export function getActiveSectionLength(run: Pick<DuctRun, 'props'>): number {
  if (typeof run.props.sectionLengthOverride === 'number' && run.props.sectionLengthOverride > 0) {
    return run.props.sectionLengthOverride;
  }

  return useFabricationProfileStore
    .getState()
    .getSectionLength(run.props.engineeringSystem, run.props.shape);
}
