import { describe, expect, it } from 'vitest';
import { featureFlagNames, featureFlags, isEnabled } from '../featureFlags';

describe('featureFlags', () => {
  it('defaults WS1/WS2/WS5 flags ON when no env override is set', () => {
    // The default test env sets no NEXT_PUBLIC_FF_* overrides, so flags resolve true.
    expect(featureFlags.WS1_SINGLE_TOOLBAR).toBe(true);
    expect(featureFlags.WS2_INLINE_TOOL_OPTIONS).toBe(true);
    expect(featureFlags.WS5_MANUAL_SIZING_PROVENANCE).toBe(true);
  });

  it('isEnabled mirrors the resolved flag value', () => {
    for (const name of featureFlagNames) {
      expect(isEnabled(name)).toBe(featureFlags[name]);
    }
  });
});
