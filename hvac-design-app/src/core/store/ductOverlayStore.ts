import { create } from 'zustand';
import type { DuctRun, Entity, Equipment } from '@/core/schema';
import type { OverlayStatus, TopologyValidationResult } from '@/core/services/graph/types';
import { classifyDuctVelocity, type VelocityBand } from '@/core/services/calculations/ductVelocityThresholds';

export type DuctOverlayMode = 'off' | 'velocity' | 'pressure';

interface DuctOverlayState {
  overlayMode: DuctOverlayMode;
  overlayStatusMap: Record<string, OverlayStatus>;
}

interface DuctOverlayActions {
  setOverlayMode: (mode: DuctOverlayMode) => void;
  setOverlayStatusMap: (statusMap: Record<string, OverlayStatus>) => void;
  resetOverlay: () => void;
}

const initialState: DuctOverlayState = {
  overlayMode: 'off',
  overlayStatusMap: {},
};

export const useDuctOverlayStore = create<DuctOverlayState & DuctOverlayActions>()((set) => ({
  ...initialState,
  setOverlayMode: (overlayMode) => set({ overlayMode }),
  setOverlayStatusMap: (overlayStatusMap) => set({ overlayStatusMap }),
  resetOverlay: () => set(initialState),
}));

export function buildOverlayStatusMap(
  entities: Record<string, Entity>,
  validationResults: TopologyValidationResult[],
  overlayMode: DuctOverlayMode
): Record<string, OverlayStatus> {
  if (overlayMode === 'off') {
    return {};
  }

  const invalidEntityIds = new Set(
    validationResults
      .filter((result) => !result.isValid)
      .flatMap((result) => result.affectedEntityIds)
  );
  const validResultByDuctId = new Map<string, TopologyValidationResult>();
  for (const result of validationResults) {
    for (const entityId of result.affectedEntityIds) {
      validResultByDuctId.set(entityId, result);
    }
  }

  const statusMap: Record<string, OverlayStatus> = {};
  for (const entity of Object.values(entities)) {
    if (entity.type !== 'duct_run') {
      continue;
    }

    const run = entity as DuctRun;
    if (invalidEntityIds.has(run.id)) {
      statusMap[run.id] = neutralStatus('No calculation', 'invalid network topology');
      continue;
    }

    if (overlayMode === 'velocity') {
      const validation = validResultByDuctId.get(run.id);
      const band = classifyDuctVelocity(run.calculated.velocity, run.props.systemType, validation?.ductRoles?.[run.id]);
      statusMap[run.id] = velocityStatus(run.calculated.velocity, band);
      continue;
    }

    statusMap[run.id] = pressureStatus(run, entities, validResultByDuctId.get(run.id));
  }

  return statusMap;
}

function velocityStatus(velocity: number | undefined, band: VelocityBand): OverlayStatus {
  if (band === 'grey' || !velocity) {
    return neutralStatus('No calculation', 'velocity unavailable');
  }

  const labels: Record<Exclude<VelocityBand, 'grey'>, string> = {
    green: 'Within range',
    amber: 'Approaching limit',
    red: 'Over limit',
  };

  return {
    color: colorForBand(band),
    label: labels[band],
    valueText: `${Math.round(velocity).toLocaleString()} FPM`,
    neutral: false,
  };
}

function pressureStatus(
  run: DuctRun,
  entities: Record<string, Entity>,
  validation: TopologyValidationResult | undefined
): OverlayStatus {
  const available = run.calculated.availableStaticPressure;
  const source = validation?.sourceEquipmentId ? entities[validation.sourceEquipmentId] : undefined;
  const sourceStaticPressure = source?.type === 'equipment' ? (source as Equipment).props.staticPressure : undefined;

  if (available === undefined || !sourceStaticPressure || sourceStaticPressure <= 0) {
    return neutralStatus('No calculation', 'source static pressure unavailable');
  }

  const percent = available / sourceStaticPressure;
  const band: Exclude<VelocityBand, 'grey'> = percent > 0.5 ? 'green' : percent >= 0.2 ? 'amber' : 'red';

  return {
    color: colorForBand(band),
    label: `${Math.round(percent * 100)}% available`,
    valueText: `${available.toFixed(2)} in.wg remaining`,
    neutral: false,
  };
}

function neutralStatus(label: string, valueText: string): OverlayStatus {
  return {
    color: '#94a3b8',
    label,
    valueText,
    neutral: true,
  };
}

function colorForBand(band: Exclude<VelocityBand, 'grey'>): string {
  return {
    green: '#16a34a',
    amber: '#d97706',
    red: '#dc2626',
  }[band];
}
