import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_PROJECT_MODE,
  areCostColumnsDefaultVisible,
  getInitialSizePostureSource,
  getProjectMode,
  isAutoFittingProjectSettingEnabled,
  isAutoFittingDefaultEnabled,
  registerAutoFittingProvider,
  registerProjectModeProvider,
  resetAutoFittingProvider,
  resetProjectModeProvider,
} from '../projectMode';

describe('projectMode (WS8)', () => {
  beforeEach(() => {
    resetProjectModeProvider();
    resetAutoFittingProvider();
  });

  afterEach(() => {
    resetProjectModeProvider();
    resetAutoFittingProvider();
  });

  it('defaults to estimation when no provider is registered', () => {
    expect(DEFAULT_PROJECT_MODE).toBe('estimation');
    expect(getProjectMode()).toBe('estimation');
  });

  it('returns the registered provider value', () => {
    registerProjectModeProvider(() => 'design');
    expect(getProjectMode()).toBe('design');
  });

  it('falls back to the default when the provider yields an invalid value', () => {
    registerProjectModeProvider(() => 'bogus' as never);
    expect(getProjectMode()).toBe('estimation');
  });

  describe('estimation mode drives manual-first / cost-visible / auto-fitting', () => {
    beforeEach(() => registerProjectModeProvider(() => 'estimation'));

    it('size posture is default (manual-first)', () => {
      expect(getInitialSizePostureSource()).toBe('default');
    });

    it('cost columns are visible by default', () => {
      expect(areCostColumnsDefaultVisible()).toBe(true);
    });

    it('auto-fitting default is on', () => {
      expect(isAutoFittingDefaultEnabled()).toBe(true);
    });
  });

  describe('design mode drives computed / cost-collapsed / auto-fitting', () => {
    beforeEach(() => registerProjectModeProvider(() => 'design'));

    it('size posture is computed (legacy)', () => {
      expect(getInitialSizePostureSource()).toBe('computed');
    });

    it('cost columns are collapsed by default', () => {
      expect(areCostColumnsDefaultVisible()).toBe(false);
    });

    it('auto-fitting default is on', () => {
      expect(isAutoFittingDefaultEnabled()).toBe(true);
    });
  });

  describe('persisted auto-fitting project setting', () => {
    it('defaults to enabled when no provider is registered', () => {
      expect(isAutoFittingProjectSettingEnabled()).toBe(true);
    });

    it('returns the registered persisted project value', () => {
      registerAutoFittingProvider(() => false);
      expect(isAutoFittingProjectSettingEnabled()).toBe(false);
    });
  });
});
