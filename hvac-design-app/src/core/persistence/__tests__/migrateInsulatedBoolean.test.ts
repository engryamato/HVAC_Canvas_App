import { describe, expect, it } from 'vitest';
import { migrateInsulatedBooleanToType } from '../migrateInsulatedBoolean';

describe('migrateInsulatedBooleanToType', () => {
  it('maps legacy insulated booleans onto run and segment insulation type', () => {
    const migrated = migrateInsulatedBooleanToType({
      type: 'duct_run',
      props: {
        insulated: true,
        insulationThickness: 2,
        startEndType: 'raw',
        endEndType: 'coupled',
        segments: [
          { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
          {
            index: 1,
            startStation: 5,
            endStation: 10,
            length: 5,
            isPartial: false,
            insulationType: 'liner',
          },
        ],
      },
    } as { type: 'duct_run'; props: Record<string, unknown> });

    expect(migrated.props).not.toHaveProperty('insulated');
    expect(migrated.props?.insulationType).toBe('wrap');
    expect(migrated.props?.segments).toEqual([
      expect.objectContaining({
        insulationType: 'wrap',
        insulationThickness: 2,
        startEndType: 'raw',
        endEndType: 'coupled',
      }),
      expect.objectContaining({
        insulationType: 'liner',
        insulationThickness: 2,
        startEndType: 'raw',
        endEndType: 'coupled',
      }),
    ]);
  });
});
