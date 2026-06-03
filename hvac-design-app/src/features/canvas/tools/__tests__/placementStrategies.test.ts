import { describe, expect, it } from 'vitest';
import {
  getPlacementToolbarMetadata,
  getToolbarSpecialtyLabel,
  PlacementStrategyRegistry,
  resolvePlacementStrategy,
} from '../placementStrategies';

describe('placementStrategies', () => {
  it('returns default duct metadata when no specialty tool is active', () => {
    const metadata = getPlacementToolbarMetadata(null);

    expect(metadata.label).toBe('Duct');
    expect(metadata.iconKey).toBe('duct');
  });

  it('registers no specialty strategies and always resolves the default fallback (air-only)', () => {
    expect(PlacementStrategyRegistry.size).toBe(0);

    expect(resolvePlacementStrategy('unknown-specialty').id).toBe('default_duct');
    expect(getToolbarSpecialtyLabel(null)).toBeNull();
  });

  it('falls back explicitly for unsupported tool ids', () => {
    expect(resolvePlacementStrategy('continuous_trapeze_run').id).toBe('default_duct');
    expect(getToolbarSpecialtyLabel('continuous_trapeze_run')).toBe('Duct');
  });

  it('falls back to the default duct strategy for unknown ids', () => {
    const strategy = resolvePlacementStrategy('unknown-specialty');

    expect(strategy.id).toBe('default_duct');
    expect(strategy.getToolbarMetadata().label).toBe('Duct');
  });
});
