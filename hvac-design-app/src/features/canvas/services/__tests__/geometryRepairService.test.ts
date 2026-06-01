import { describe, expect, it } from 'vitest';

import { buildGeometryRepairPlan } from '../geometryRepairService';

describe('buildGeometryRepairPlan', () => {
  it('returns a no-op result when there are no geometry violations', () => {
    const result = buildGeometryRepairPlan({});

    expect(result).toEqual({
      changedEntityIds: [],
      message: 'No geometry issues found.',
      requiresConfirmation: false,
      reversible: true,
    });
  });

  it('identifies geometry violation entity ids and requires confirmation', () => {
    const result = buildGeometryRepairPlan({
      'duct-1': {
        entityId: 'duct-1',
        catalogStatus: 'resolved',
        lastValidated: new Date('2026-05-26T00:00:00.000Z'),
        violations: [{ ruleId: 'geometry', type: 'invalid_transition', severity: 'blocker', message: 'Invalid' }],
      },
    } as never);

    expect(result).toEqual({
      changedEntityIds: ['duct-1'],
      message: 'Found 1 geometry issue. Select the affected element before applying a repair.',
      requiresConfirmation: true,
      reversible: true,
    });
  });
});
