import { afterEach, describe, expect, it } from 'vitest';
import {
  registerAutoFittingProvider,
  resetAutoFittingProvider,
} from '@/core/projectMode/projectMode';
import { DuctTool } from '../DuctTool';

describe('DuctTool auto-fitting enablement', () => {
  afterEach(() => {
    DuctTool.clearAutoFittingEnabledOverride();
    resetAutoFittingProvider();
  });

  it('uses the persisted project setting before the default', () => {
    registerAutoFittingProvider(() => false);

    expect(DuctTool.isAutoFittingEnabled()).toBe(false);
  });

  it('lets the session override win over the persisted project setting', () => {
    registerAutoFittingProvider(() => false);
    DuctTool.setAutoFittingEnabled(true);

    expect(DuctTool.isAutoFittingEnabled()).toBe(true);
  });

  it('defaults on when there is no project setting or session override', () => {
    expect(DuctTool.isAutoFittingEnabled()).toBe(true);
  });
});
