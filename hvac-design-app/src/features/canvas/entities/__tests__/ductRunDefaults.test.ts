import { describe, expect, it } from 'vitest';
import { createDuctRun } from '../ductRunDefaults';

describe('canvas ductRunDefaults', () => {
  it('preserves systemType when creating a duct run', () => {
    const run = createDuctRun({
      shape: 'flat_oval',
      width: 30,
      height: 12,
      engineeringSystem: 'generator_exhaust',
      systemType: 'exhaust',
    });

    expect(run.props).toMatchObject({
      engineeringSystem: 'generator_exhaust',
      systemType: 'exhaust',
    });
  });
});
