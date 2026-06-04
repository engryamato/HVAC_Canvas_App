import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DuctRun } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { resetDuctConstructionProvider } from '@/core/services/calculations/ductConstructionProvider';
import { BOMGenerationService } from '@/core/services/bom/bomGenerationService';
import { CostCalculationService } from '@/core/services/cost/costCalculationService';
import { getGaugeWeight } from '@/core/services/calculations/gaugeWeightTable';
import type { CalculationSettings } from '@/core/schema/calculation-settings.schema';
import type { PricingData } from '@/core/schema/component-library.schema';
import type { WasteFactors } from '@/core/schema/calculation-settings.schema';

/**
 * H1b — proves the construction derivation fires in the REAL duct_run recompute
 * pipeline (entityStore.runCommittedPipeline), realizing the required flow:
 *   edit duct_run → recompute → deriveDuctConstruction → gauge → weight → cost → BOM.
 *
 * Sample case: rectangular 48" x 24", 20 ft, pressure class 4".
 */

const ID = '550e8400-e29b-41d4-a716-446655440900';
const now = '2026-01-01T00:00:00.000Z';

const wasteFactors: WasteFactors = {
  default: 0.1,
  ducts: 0.1,
  fittings: 0.05,
  equipment: 0.02,
  accessories: 0.08,
};

const settings = (perPound?: Record<string, number>): CalculationSettings => ({
  laborRates: { baseRate: 50, regionalMultiplier: 1, currency: 'USD' },
  markupSettings: { materialMarkup: 0, laborMarkup: 0, overhead: 0, includeTaxInEstimate: false },
  wasteFactors,
  engineeringLimits: {
    maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
    minVelocity: { supply: 600, return: 500, exhaust: 500 },
    maxPressureDrop: { supply: 0.1, return: 0.08, exhaust: 0.08 },
    frictionFactors: { galvanized: 0.0005, stainless: 0.00015, flexible: 0.003, fiberglass: 0.0003 },
    standardConditions: { temperature: 70, pressure: 29.92, altitude: 0 },
  },
  ...(perPound ? { materialCostPerPound: perPound } : {}),
});

function rectRun(overrides: Partial<DuctRun['props']> = {}): DuctRun {
  return {
    id: ID,
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Run',
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 48,
      height: 24,
      material: 'galvanized',
      installLength: 20,
      airflow: 0,
      staticPressure: 0.1,
      pressureClass: '4',
      serviceId: '00000000-0000-0000-0000-000000000001',
      segments: [{ index: 0, startStation: 0, endStation: 20, length: 20, isPartial: false }],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 240, y: 0 },
      ...overrides,
    },
    calculated: { area: 0, velocity: 0, frictionLoss: 0 },
  } as DuctRun;
}

/** Seed a duct_run and run the committed recompute pipeline; return the updated entity. */
function commit(run: DuctRun): DuctRun {
  useEntityStore.setState({ byId: { [run.id]: run }, allIds: [run.id] });
  useEntityStore.getState().commitNetwork();
  return useEntityStore.getState().byId[run.id] as DuctRun;
}

describe('H1b — duct_run recompute drives gauge → weight → cost', () => {
  beforeEach(() => {
    resetDuctConstructionProvider();
    useEntityStore.setState({ byId: {}, allIds: [] });
  });
  afterEach(() => {
    useEntityStore.setState({ byId: {}, allIds: [] });
    resetDuctConstructionProvider();
  });

  it('derives gauge (18 ga @ 4"), seal class, surface area and weight in the pipeline', () => {
    const run = commit(rectRun());

    expect(run.props.gauge).toBe(18); // 48" @ 4" w.g.
    expect(run.props.sealClass).toBe('A'); // SMACNA derived at 4"
    expect(run.props.provenance?.gauge).toBe('computed');

    expect(run.calculated.surfaceArea).toBeCloseTo(240, 6); // 2(4+2)·20
    const expectedWeight = 240 * getGaugeWeight(18).fabricatedLbPerSquareFoot;
    expect(run.calculated.weight).toBeCloseTo(expectedWeight, 6); // ≈ 595.06 lb
    expect(run.calculated.weight).toBeGreaterThan(0);
  });

  it('flows the recomputed weight into the BOM and weight × $/lb into the cost/proposal', () => {
    const run = commit(rectRun());

    const bom = BOMGenerationService.generateBOM(
      { ducts: [run], fittings: [], equipment: [] },
      wasteFactors,
      { includeAutoInserted: true, applyWasteFactors: true, groupSimilarItems: false }
    );
    const ductItem = bom.find((i) => i.category === 'duct')!;
    expect(ductItem.weightPounds).toBeCloseTo(run.calculated.weight!, 6);
    expect(ductItem.surfaceAreaSquareFeet).toBeCloseTo(240, 6);

    const estimate = CostCalculationService.calculateProjectCost(
      bom,
      settings({ galvanized: 2.0 }),
      new Map<string, PricingData>()
    );
    const cost = estimate.items[0]!;
    expect(cost.unpriced).toBe(false);
    expect(cost.materialUnitPrice).toBe(2.0);
    // weight × $/lb × (1 + duct waste 0.1)
    expect(cost.materialSubtotal).toBeCloseTo(run.calculated.weight! * 2.0 * 1.1, 4);
    expect(cost.itemTotal!).toBeGreaterThan(0);
    // The proposal/estimate total reflects the same computed cost.
    expect(estimate.breakdown.totalCost).toBeGreaterThan(0);
  });

  it('shows weight/cost as unavailable (never a silent 0) when the gauge is unresolved', () => {
    // A user-specified off-table gauge: weight cannot be computed.
    const run = commit(rectRun({ gauge: 30, provenance: { gauge: 'specified' } } as Partial<DuctRun['props']>));
    expect(run.props.gauge).toBe(30); // preserved
    expect(run.calculated.weight).toBeUndefined(); // "—", not 0
    expect(run.calculated.surfaceArea).toBeCloseTo(240, 6); // area still computes

    const bom = BOMGenerationService.generateBOM(
      { ducts: [run], fittings: [], equipment: [] },
      wasteFactors,
      { includeAutoInserted: true, applyWasteFactors: true, groupSimilarItems: false }
    );
    expect(bom.find((i) => i.category === 'duct')!.weightPounds).toBeUndefined();

    const estimate = CostCalculationService.calculateProjectCost(
      bom,
      settings({ galvanized: 2.0 }),
      new Map<string, PricingData>()
    );
    expect(estimate.items[0]!.unpriced).toBe(true);
    expect(estimate.items[0]!.itemTotal).toBeNull(); // unavailable, not 0
  });
});
