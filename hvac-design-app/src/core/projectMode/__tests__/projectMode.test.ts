import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Flags are resolved once at module-load, so the WS8-off path is exercised by
// mocking isEnabled (the flag-on/flag-off convention from featureFlags).
const { isEnabledMock } = vi.hoisted(() => ({ isEnabledMock: vi.fn(() => true) }));
vi.mock('@/core/flags/featureFlags', () => ({
  isEnabled: isEnabledMock,
}));

import {
  DEFAULT_PROJECT_MODE,
  areCostColumnsDefaultVisible,
  getInitialSizePostureSource,
  getProjectMode,
  isAutoFittingDefaultEnabled,
  registerProjectModeProvider,
  resetProjectModeProvider,
} from '../projectMode';

describe('projectMode (WS8)', () => {
  beforeEach(() => {
    isEnabledMock.mockReturnValue(true);
    resetProjectModeProvider();
  });

  afterEach(() => {
    resetProjectModeProvider();
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

  describe('estimation mode drives manual-first / cost-visible / no-auto-fitting', () => {
    beforeEach(() => registerProjectModeProvider(() => 'estimation'));

    it('size posture is default (manual-first)', () => {
      expect(getInitialSizePostureSource()).toBe('default');
    });

    it('cost columns are visible by default', () => {
      expect(areCostColumnsDefaultVisible()).toBe(true);
    });

    it('auto-fitting default is off', () => {
      expect(isAutoFittingDefaultEnabled()).toBe(false);
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

  describe('WS8 flag off preserves pre-WS8 behavior regardless of mode', () => {
    beforeEach(() => {
      isEnabledMock.mockReturnValue(false);
      registerProjectModeProvider(() => 'estimation');
    });

    it('size posture stays computed', () => {
      expect(getInitialSizePostureSource()).toBe('computed');
    });

    it('cost columns stay hidden', () => {
      expect(areCostColumnsDefaultVisible()).toBe(false);
    });

    it('auto-fitting defers to legacy (null = no opinion)', () => {
      expect(isAutoFittingDefaultEnabled()).toBeNull();
    });
  });
});
