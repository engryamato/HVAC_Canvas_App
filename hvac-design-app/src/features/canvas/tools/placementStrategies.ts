import type { Duct } from '@/core/schema';
import type { EngineeringSystem } from '@/core/schema/unified-component.schema';

export interface PlacementPreviewDecoration {
  label?: string;
  strokeStyle?: string;
  dash?: number[];
}

export interface PlacementToolbarMetadata {
  iconKey: PlacementToolbarIconKey;
  label: string;
  tooltip: string;
}

export type PlacementToolbarIconKey = 'duct';

export interface PlacementPoint {
  x: number;
  y: number;
}

export interface PlacementSnapTarget {
  ductId: string;
  endPoint: 'start' | 'end';
  x: number;
  y: number;
  angle: number;
}

export interface PlacementContext {
  engineeringSystem: EngineeringSystem;
  specialtyToolId: string | null;
  startPoint?: PlacementPoint | null;
  endPoint?: PlacementPoint | null;
  snapTarget?: PlacementSnapTarget | null;
}

export interface PlacementSnapBehavior {
  ghostFittingType?: string | null;
  label?: string;
  strokeStyle?: string;
}

export interface PlacementBannerInfo {
  title: string;
  tone?: 'info' | 'success' | 'warning';
  description?: string;
}

export interface IPlacementStrategy {
  readonly id: string;
  readonly label: string;
  readonly engineeringSystem: EngineeringSystem;
  createEntityProps(
    startPoint: PlacementPoint,
    endPoint: PlacementPoint,
    context: PlacementContext
  ): Partial<Duct['props']>;
  getToolbarMetadata(): PlacementToolbarMetadata;
  augmentPreview?(context: PlacementContext): PlacementPreviewDecoration;
  validatePlacement?(context: PlacementContext): string[] | null;
  resolveSnapBehavior?(context: PlacementContext): PlacementSnapBehavior | null;
  getGhostFittingType?(context: PlacementContext): string | null;
  getSystemBannerInfo?(context: PlacementContext): PlacementBannerInfo | null;
  getPreviewStyle?(context: PlacementContext): PlacementPreviewDecoration;
  getCreateOverrides?(): Partial<Duct['props']>;
}

class DefaultDuctStrategy implements IPlacementStrategy {
  readonly id = 'default_duct';
  readonly label = 'Duct';
  readonly engineeringSystem = 'standard_duct' as const;

  createEntityProps(
    _startPoint: PlacementPoint,
    _endPoint: PlacementPoint,
    _context: PlacementContext
  ) {
    return {};
  }

  getToolbarMetadata(): PlacementToolbarMetadata {
    return {
      iconKey: 'duct',
      label: 'Duct',
      tooltip: 'Standard duct placement',
    };
  }

  augmentPreview(_context?: PlacementContext) {
    return {};
  }

  validatePlacement() {
    return null;
  }

  resolveSnapBehavior() {
    return null;
  }

  getGhostFittingType() {
    return null;
  }

  getSystemBannerInfo() {
    return null;
  }

  getPreviewStyle(context: PlacementContext) {
    return this.augmentPreview(context);
  }

  getCreateOverrides(): Partial<Duct['props']> {
    return {};
  }
}

const defaultStrategy = new DefaultDuctStrategy();

export const PlacementStrategyRegistry = new Map<string, IPlacementStrategy>();

export function resolvePlacementStrategy(id: string | null | undefined): IPlacementStrategy {
  if (!id) {
    return defaultStrategy;
  }

  return PlacementStrategyRegistry.get(id) ?? defaultStrategy;
}

export function getPlacementToolbarMetadata(id: string | null | undefined): PlacementToolbarMetadata {
  return resolvePlacementStrategy(id).getToolbarMetadata();
}

export function getToolbarSpecialtyLabel(id: string | null): string | null {
  if (!id) {
    return null;
  }
  return resolvePlacementStrategy(id).getToolbarMetadata().label;
}
