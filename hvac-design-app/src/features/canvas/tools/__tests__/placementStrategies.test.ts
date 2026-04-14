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

  it('exposes all registered specialty strategies and the default fallback contract', () => {
    expect(PlacementStrategyRegistry.has('single_wall_pipe')).toBe(true);
    expect(PlacementStrategyRegistry.has('double_wall_pipe')).toBe(true);
    expect(PlacementStrategyRegistry.has('flexible_liner')).toBe(true);
    expect(PlacementStrategyRegistry.has('factory_built_round')).toBe(true);
    expect(PlacementStrategyRegistry.has('welded_rectangular')).toBe(true);
    expect(PlacementStrategyRegistry.has('zero_clearance')).toBe(true);
    expect(PlacementStrategyRegistry.has('flanged_exhaust_pipe')).toBe(true);
    expect(PlacementStrategyRegistry.has('slip_fit_exhaust_pipe')).toBe(true);

    expect(resolvePlacementStrategy('unknown-specialty').id).toBe('default_duct');
    expect(getToolbarSpecialtyLabel(null)).toBeNull();
  });

  it('falls back explicitly for unsupported T10-style tool ids', () => {
    expect(resolvePlacementStrategy('continuous_trapeze_run').id).toBe('default_duct');
    expect(getToolbarSpecialtyLabel('continuous_trapeze_run')).toBe('Duct');
  });

  it('resolves specialty metadata and create props', () => {
    const strategy = resolvePlacementStrategy('single_wall_pipe');
    const props = strategy.createEntityProps(
      { x: 0, y: 0 },
      { x: 24, y: 0 },
      {
        engineeringSystem: 'boiler_flue',
        specialtyToolId: 'single_wall_pipe',
      }
    );

    expect(strategy.id).toBe('single_wall_pipe');
    expect(strategy.getToolbarMetadata().label).toBe('Single Wall Pipe');
    expect(props.engineeringSystem).toBe('boiler_flue');
    expect('wallType' in props && props.wallType === 'single').toBe(true);
  });

  it('exposes the optional strategy hooks used by the toolbar and duct tool', () => {
    const strategy = resolvePlacementStrategy('single_wall_pipe');
    const context = {
      engineeringSystem: 'boiler_flue' as const,
      specialtyToolId: 'single_wall_pipe',
    };

    expect(strategy.augmentPreview?.(context)).toMatchObject({
      label: 'Slope 1/4 in/ft',
      strokeStyle: '#ea580c',
      dash: [12, 6],
    });
    expect(strategy.validatePlacement?.(context)).toBeNull();
    expect(strategy.resolveSnapBehavior?.(context)).toMatchObject({
      ghostFittingType: 'boot_tee',
      label: 'Slope 1/4 in/ft',
      strokeStyle: '#ea580c',
    });
    expect(strategy.getGhostFittingType?.(context)).toBe('boot_tee');
    expect(strategy.getSystemBannerInfo?.(context)).toMatchObject({
      title: 'Boiler & Water Heater Flue',
      tone: 'warning',
      description: 'Single Wall Pipe',
    });
    expect(strategy.getPreviewStyle?.(context)).toMatchObject({
      label: 'Slope 1/4 in/ft',
      strokeStyle: '#ea580c',
    });
    expect(strategy.getCreateOverrides?.()).toMatchObject({
      engineeringSystem: 'boiler_flue',
      wallType: 'single',
      venting: 'forced',
    });
    expect(getToolbarSpecialtyLabel('single_wall_pipe')).toBe('Single Wall Pipe');
  });

  it('falls back to the default duct strategy for unknown ids', () => {
    const strategy = resolvePlacementStrategy('unknown-specialty');

    expect(strategy.id).toBe('default_duct');
    expect(strategy.getToolbarMetadata().label).toBe('Duct');
  });
});
