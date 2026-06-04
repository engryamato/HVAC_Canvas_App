// D11-ratified 2026-06-03 (user): SMACNA nominal galvanized weights + 15% seam allowance.
// 16 ga added 2026-06-04 (user, per SMACNA source) — required for high-pressure (>=4" w.g.)
// large ducts (85"+); nominal 2.656 lb/ft^2 continues the +0.5 step from 18 ga.

export const FABRICATION_SEAM_ALLOWANCE_FACTOR = 1.15;

export interface GaugeWeightRecord {
  gauge: 26 | 24 | 22 | 20 | 18 | 16;
  nominalLbPerSquareFoot: number;
  fabricatedLbPerSquareFoot: number;
  sourceNote: string;
}

const sourceNote = 'SMACNA nominal galvanized sheet weight table; fabricated value applies 15% seam allowance.';

export const GAUGE_WEIGHT_TABLE: GaugeWeightRecord[] = [
  { gauge: 26, nominalLbPerSquareFoot: 0.906, fabricatedLbPerSquareFoot: 0.906 * FABRICATION_SEAM_ALLOWANCE_FACTOR, sourceNote },
  { gauge: 24, nominalLbPerSquareFoot: 1.156, fabricatedLbPerSquareFoot: 1.156 * FABRICATION_SEAM_ALLOWANCE_FACTOR, sourceNote },
  { gauge: 22, nominalLbPerSquareFoot: 1.406, fabricatedLbPerSquareFoot: 1.406 * FABRICATION_SEAM_ALLOWANCE_FACTOR, sourceNote },
  { gauge: 20, nominalLbPerSquareFoot: 1.656, fabricatedLbPerSquareFoot: 1.656 * FABRICATION_SEAM_ALLOWANCE_FACTOR, sourceNote },
  { gauge: 18, nominalLbPerSquareFoot: 2.156, fabricatedLbPerSquareFoot: 2.156 * FABRICATION_SEAM_ALLOWANCE_FACTOR, sourceNote },
  { gauge: 16, nominalLbPerSquareFoot: 2.656, fabricatedLbPerSquareFoot: 2.656 * FABRICATION_SEAM_ALLOWANCE_FACTOR, sourceNote },
];

export function getGaugeWeight(gauge: GaugeWeightRecord['gauge']): GaugeWeightRecord {
  const record = GAUGE_WEIGHT_TABLE.find((candidate) => candidate.gauge === gauge);
  if (!record) {
    throw new Error(`Unsupported gauge ${gauge}`);
  }
  return record;
}
