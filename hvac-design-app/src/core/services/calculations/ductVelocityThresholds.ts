import type { DuctTopologyRole } from '../graph/types';
import type { SystemType } from '@/core/schema';

export type VelocityBand = 'green' | 'amber' | 'red' | 'grey';
export type VelocityThresholdKey = `${SystemType | 'unassigned'}_${DuctTopologyRole}`;

export interface VelocityThreshold {
  greenMax: number;
  amberMax: number;
}

export const ductVelocityThresholds: Record<VelocityThresholdKey, VelocityThreshold> = {
  supply_main: { greenMax: 1500, amberMax: 2500 },
  supply_branch: { greenMax: 1000, amberMax: 1800 },
  return_main: { greenMax: 1200, amberMax: 2000 },
  return_branch: { greenMax: 800, amberMax: 1200 },
  exhaust_main: { greenMax: 1000, amberMax: 1500 },
  exhaust_branch: { greenMax: 1000, amberMax: 1500 },
  outside_air_main: { greenMax: 1000, amberMax: 1500 },
  outside_air_branch: { greenMax: 1000, amberMax: 1500 },
  unassigned_main: { greenMax: 1200, amberMax: 2000 },
  unassigned_branch: { greenMax: 1200, amberMax: 2000 },
};

export function classifyDuctVelocity(
  velocityFpm: number | undefined,
  systemType: SystemType | undefined,
  role: DuctTopologyRole | undefined
): VelocityBand {
  if (!velocityFpm || velocityFpm <= 0) {
    return 'grey';
  }

  const key: VelocityThresholdKey = `${systemType ?? 'unassigned'}_${role ?? 'branch'}`;
  const threshold = ductVelocityThresholds[key];

  if (velocityFpm < threshold.greenMax) {
    return 'green';
  }

  if (velocityFpm <= threshold.amberMax) {
    return 'amber';
  }

  return 'red';
}
