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

export type PlacementToolbarIconKey =
  | 'duct'
  | 'boiler_flue'
  | 'grease_duct'
  | 'generator_exhaust';

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

class BoilerFlueStrategy implements IPlacementStrategy {
  readonly id: string;
  readonly label: string;
  readonly engineeringSystem = 'boiler_flue' as const;

  constructor(id: string, label: string) {
    this.id = id;
    this.label = label;
  }

  createEntityProps(
    _startPoint: PlacementPoint,
    _endPoint: PlacementPoint,
    _context: PlacementContext
  ): Partial<Duct['props']> {
    return {
      engineeringSystem: 'boiler_flue',
      condensateSlope: 0.25,
      wallType: this.id === 'double_wall_pipe' ? 'double' : 'single',
      venting: 'forced',
    };
  }

  getToolbarMetadata(): PlacementToolbarMetadata {
    return {
      iconKey: 'boiler_flue',
      label: this.label,
      tooltip: `Boiler & Water Heater Flue - ${this.label}`,
    };
  }

  augmentPreview(_context?: PlacementContext): PlacementPreviewDecoration {
    return { label: 'Slope 1/4 in/ft', strokeStyle: '#ea580c', dash: [12, 6] };
  }

  validatePlacement() {
    return null;
  }

  resolveSnapBehavior(): PlacementSnapBehavior {
    return {
      ghostFittingType: 'boot_tee',
      label: 'Slope 1/4 in/ft',
      strokeStyle: '#ea580c',
    };
  }

  getGhostFittingType() {
    return 'boot_tee';
  }

  getSystemBannerInfo(): PlacementBannerInfo {
    return {
      title: 'Boiler & Water Heater Flue',
      tone: 'warning',
      description: this.label,
    };
  }

  getPreviewStyle(context: PlacementContext) {
    return this.augmentPreview(context);
  }

  getCreateOverrides(): Partial<Duct['props']> {
    const wallType: 'single' | 'double' =
      this.id === 'double_wall_pipe' ? 'double' : 'single';

    return {
      engineeringSystem: 'boiler_flue' as const,
      condensateSlope: 0.25,
      wallType,
      venting: 'forced' as const,
    };
  }
}

class GreaseDuctStrategy implements IPlacementStrategy {
  readonly id: string;
  readonly label: string;
  readonly engineeringSystem = 'grease_duct' as const;

  constructor(id: string, label: string) {
    this.id = id;
    this.label = label;
  }

  createEntityProps(
    _startPoint: PlacementPoint,
    _endPoint: PlacementPoint,
    _context: PlacementContext
  ): Partial<Duct['props']> {
    return {
      engineeringSystem: 'grease_duct',
      constructionType: this.id,
      fireRating: '2hr',
      liquidTight: true,
    };
  }

  getToolbarMetadata(): PlacementToolbarMetadata {
    return {
      iconKey: 'grease_duct',
      label: this.label,
      tooltip: `Grease Duct - ${this.label}`,
    };
  }

  augmentPreview(_context?: PlacementContext): PlacementPreviewDecoration {
    return { label: 'NFPA 96', strokeStyle: '#b45309', dash: [10, 5] };
  }

  validatePlacement() {
    return null;
  }

  resolveSnapBehavior(): PlacementSnapBehavior {
    return {
      ghostFittingType: 'grease_elbow',
      label: 'NFPA 96',
      strokeStyle: '#b45309',
    };
  }

  getGhostFittingType() {
    return 'grease_elbow';
  }

  getSystemBannerInfo(): PlacementBannerInfo {
    return {
      title: 'Grease Duct',
      tone: 'warning',
      description: this.label,
    };
  }

  getPreviewStyle(context: PlacementContext) {
    return this.augmentPreview(context);
  }

  getCreateOverrides(): Partial<Duct['props']> {
    return {
      engineeringSystem: 'grease_duct' as const,
      constructionType: this.id,
      fireRating: '2hr',
      liquidTight: true,
    };
  }
}

class GeneratorExhaustStrategy implements IPlacementStrategy {
  readonly id: string;
  readonly label: string;
  readonly engineeringSystem = 'generator_exhaust' as const;

  constructor(id: string, label: string) {
    this.id = id;
    this.label = label;
  }

  createEntityProps(
    _startPoint: PlacementPoint,
    _endPoint: PlacementPoint,
    _context: PlacementContext
  ): Partial<Duct['props']> {
    return {
      engineeringSystem: 'generator_exhaust',
      connectionType: this.id === 'flanged_exhaust_pipe' ? 'flanged' : 'slip_fit',
      backpressureLimit: 3,
      exhaustTempF: 900,
    };
  }

  getToolbarMetadata(): PlacementToolbarMetadata {
    return {
      iconKey: 'generator_exhaust',
      label: this.label,
      tooltip: `Generator & Engine Exhaust - ${this.label}`,
    };
  }

  augmentPreview(_context?: PlacementContext): PlacementPreviewDecoration {
    return { label: 'Backpressure', strokeStyle: '#7c3aed', dash: [14, 6] };
  }

  validatePlacement() {
    return null;
  }

  resolveSnapBehavior(): PlacementSnapBehavior {
    return {
      ghostFittingType: 'long_radius_elbow',
      label: 'Backpressure',
      strokeStyle: '#7c3aed',
    };
  }

  getGhostFittingType() {
    return 'long_radius_elbow';
  }

  getSystemBannerInfo(): PlacementBannerInfo {
    return {
      title: 'Generator & Engine Exhaust',
      tone: 'info',
      description: this.label,
    };
  }

  getPreviewStyle(context: PlacementContext) {
    return this.augmentPreview(context);
  }

  getCreateOverrides(): Partial<Duct['props']> {
    const connectionType: 'flanged' | 'slip_fit' =
      this.id === 'flanged_exhaust_pipe' ? 'flanged' : 'slip_fit';

    return {
      engineeringSystem: 'generator_exhaust' as const,
      connectionType,
      backpressureLimit: 3,
      exhaustTempF: 900,
    };
  }
}

const defaultStrategy = new DefaultDuctStrategy();

export const PlacementStrategyRegistry = new Map<string, IPlacementStrategy>([
  ['single_wall_pipe', new BoilerFlueStrategy('single_wall_pipe', 'Single Wall Pipe')],
  ['double_wall_pipe', new BoilerFlueStrategy('double_wall_pipe', 'Double Wall Pipe')],
  ['flexible_liner', new BoilerFlueStrategy('flexible_liner', 'Flexible Liner')],
  ['factory_built_round', new GreaseDuctStrategy('factory_built_round', 'Factory-Built Round')],
  ['welded_rectangular', new GreaseDuctStrategy('welded_rectangular', 'Welded Rectangular')],
  ['zero_clearance', new GreaseDuctStrategy('zero_clearance', 'Zero-Clearance Duct')],
  ['flanged_exhaust_pipe', new GeneratorExhaustStrategy('flanged_exhaust_pipe', 'Flanged Exhaust Pipe')],
  ['slip_fit_exhaust_pipe', new GeneratorExhaustStrategy('slip_fit_exhaust_pipe', 'Slip-Fit Exhaust Pipe')],
]);

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
