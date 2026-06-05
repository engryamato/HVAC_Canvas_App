import type { Entity, Fitting, FittingType } from '@/core/schema';
import type { DuctRunShape } from '@/core/schema/duct-run.schema';

export type AxialFamily = 'elbow' | 'tee_wye' | 'reducer' | 'transition' | 'takeoff' | 'cap';
export type AxialShape = 'rect' | 'round' | 'flat_oval';

export const fittingTypeToFamily: Record<FittingType, AxialFamily> = {
  elbow_90: 'elbow',
  elbow_45: 'elbow',
  elbow_mitered: 'elbow',
  tee: 'tee_wye',
  wye: 'tee_wye',
  reducer: 'reducer',
  reducer_tapered: 'reducer',
  reducer_eccentric: 'reducer',
  transition_square_to_round: 'transition',
  takeoff: 'takeoff',
  end_boot: 'takeoff',
  cap: 'cap',
};

function normalizeShape(shape: string | undefined): AxialShape | null {
  if (shape === 'round' || shape === 'flexible') {
    return 'round';
  }
  if (shape === 'flat_oval') {
    return 'flat_oval';
  }
  if (shape === 'rectangular') {
    return 'rect';
  }
  return null;
}

function getConnectedEntityIds(fitting: Fitting): string[] {
  return [
    fitting.props.inletDuctId,
    fitting.props.outletDuctId,
    ...(fitting.props.connectionPoints?.map((point) => point.ductId) ?? []),
    ...(fitting.props.ports?.map((port) => port.connectedDuctRunId) ?? []),
  ].filter((id): id is string => Boolean(id));
}

export function resolveFittingShape(fitting: Fitting, entitiesById: Record<string, Entity>): AxialShape {
  for (const id of getConnectedEntityIds(fitting)) {
    const entity = entitiesById[id];
    if (!entity || (entity.type !== 'duct' && entity.type !== 'duct_run')) {
      continue;
    }

    const shape = normalizeShape((entity.props as { shape?: DuctRunShape | 'rectangular' | 'round' }).shape);
    if (shape) {
      return shape;
    }
  }

  // Legacy or detached fittings may not have resolved duct metadata yet; rectangular is the safest fabrication default.
  return 'rect';
}
