'use client';

import type { ReactNode, SVGProps } from 'react';
import { Cog, Flame, Gauge, CookingPot, Wrench } from 'lucide-react';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import type { CanvasTool } from '@/core/store/canvas.store';
import type { PlacementToolbarIconKey } from '@/features/canvas/tools/placementStrategies';

export type CatalogIconKey =
  | 'duct'
  | 'duct_rectangular'
  | 'duct_round'
  | 'duct_flat_oval'
  | 'duct_flexible'
  | 'duct_boiler_flue'
  | 'duct_boiler_single_wall'
  | 'duct_boiler_double_wall'
  | 'duct_boiler_flexible_liner'
  | 'duct_grease'
  | 'duct_grease_round'
  | 'duct_grease_rectangular'
  | 'duct_grease_zero_clearance'
  | 'duct_generator'
  | 'duct_generator_flanged'
  | 'duct_generator_slip_fit'
  | 'fitting'
  | 'fitting_elbow'
  | 'fitting_elbow_radius'
  | 'fitting_elbow_90'
  | 'fitting_elbow_45'
  | 'fitting_elbow_grease'
  | 'fitting_elbow_long_radius'
  | 'fitting_mitered_elbow'
  | 'fitting_elbow_mitered'
  | 'fitting_elbow_grease_mitered'
  | 'fitting_tee'
  | 'fitting_tee_cross'
  | 'fitting_tee_grease'
  | 'fitting_boot_tee'
  | 'fitting_wye'
  | 'fitting_wye_lateral'
  | 'fitting_wye_engine'
  | 'fitting_reducer'
  | 'fitting_reducer_concentric'
  | 'fitting_reducer_eccentric'
  | 'fitting_reducer_increaser'
  | 'fitting_reducer_grease'
  | 'fitting_reducer_expander'
  | 'fitting_transition'
  | 'fitting_transition_square_to_round'
  | 'fitting_transition_grease'
  | 'fitting_end_cap'
  | 'fitting_takeoff'
  | 'fitting_takeoff_spin_in'
  | 'fitting_takeoff_bellmouth'
  | 'fitting_condensate_drain'
  | 'fitting_test_port'
  | 'fitting_flange_hardware'
  | 'equipment'
  | 'equipment_terminal_box'
  | 'equipment_fan_coil'
  | 'equipment_exhaust_fan'
  | 'equipment_ahu'
  | 'equipment_draft_inducer'
  | 'equipment_draft_control'
  | 'equipment_appliance_adapter'
  | 'equipment_hood_connection'
  | 'equipment_upblast_fan'
  | 'equipment_utility_set_fan'
  | 'equipment_pcu'
  | 'equipment_engine_silencer'
  | 'equipment_dpf'
  | 'equipment_catalytic_converter'
  | 'equipment_support_layout'
  | 'equipment_trapeze_run'
  | 'accessory'
  | 'accessory_damper_manual'
  | 'accessory_damper_motorized'
  | 'accessory_damper_fire'
  | 'accessory_damper_smoke_fire'
  | 'accessory_turning_vanes'
  | 'accessory_sound_attenuator'
  | 'accessory_access_door'
  | 'accessory_flexible_connector'
  | 'accessory_grd'
  | 'accessory_condensate_trap'
  | 'accessory_wall_thimble'
  | 'accessory_roof_flashing'
  | 'accessory_support_bracket'
  | 'accessory_rain_cap'
  | 'accessory_screened_termination'
  | 'accessory_suppression_coupling'
  | 'accessory_grease_reservoir'
  | 'accessory_roof_curb'
  | 'accessory_penetration_wrap'
  | 'accessory_vented_thimble'
  | 'accessory_bellows'
  | 'accessory_insulation_blanket'
  | 'accessory_mitre_termination'
  | 'accessory_support_hanger'
  | 'accessory_support_trapeze'
  | 'accessory_support_strap'
  | 'accessory_support_cable'
  | 'accessory_support_clamp'
  | 'accessory_support_pedestal'
  | 'accessory_support_roof'
  | 'accessory_support_brace'
  | 'accessory_support_anchor';

type IconProps = SVGProps<SVGSVGElement> & {
  'data-icon-key'?: string;
};

function BaseSvg({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

function RectangularDuctIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3.5" y="7.5" width="17" height="9" rx="1.5" />
      <line x1="7" y1="7.5" x2="7" y2="16.5" />
      <line x1="17" y1="7.5" x2="17" y2="16.5" />
    </BaseSvg>
  );
}

function RoundDuctIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </BaseSvg>
  );
}

function FlatOvalDuctIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3.5" y="8" width="17" height="8" rx="4" />
      <path d="M8 8v8" />
      <path d="M16 8v8" />
    </BaseSvg>
  );
}

function FlexibleDuctIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 15c2.5-6 5.5 6 8-1s5.5 5 8-1" />
      <path d="M4 9c2.5-6 5.5 6 8-1s5.5 5 8-1" opacity="0.55" />
    </BaseSvg>
  );
}

function BoilerFlueDuctIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 16c3-6 7-9 16-9" />
      <path d="M7 18h10" />
      <path d="M16 6l4 1-1 4" />
    </BaseSvg>
  );
}

function GreaseDuctIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="4" y="8" width="16" height="8" rx="2" />
      <path d="M8 8V6" />
      <path d="M16 8V6" />
      <path d="M12 18c1.5 0 2.5-1 2.5-2.5S13 12 12 10c-1 2-2.5 3.5-2.5 5.5S10.5 18 12 18Z" />
    </BaseSvg>
  );
}

function GeneratorDuctIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="11" cy="12" r="6" />
      <path d="M17 8l3-2v12l-3-2" />
      <path d="M9 9l3 3-3 3" />
    </BaseSvg>
  );
}

function ElbowFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M6 6v8c0 2.2 1.8 4 4 4h8" />
      <path d="M10 18V14H6" />
    </BaseSvg>
  );
}

function MiteredElbowFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M6 6v5l7 7h5" />
      <path d="M10 18H6v-4" />
      <path d="M11 12l2-2" opacity="0.6" />
    </BaseSvg>
  );
}

function TeeFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 12h16" />
      <path d="M12 7v10" />
    </BaseSvg>
  );
}

function WyeFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M12 5v14" />
      <path d="M12 12 6 6" />
      <path d="M12 12 18 6" />
    </BaseSvg>
  );
}

function ReducerFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 10h6l4-3h6v10h-6l-4-3H4z" />
    </BaseSvg>
  );
}

function TransitionFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="4" y="8" width="6" height="8" rx="1" />
      <path d="M10 8l5 2v4l-5 2Z" />
      <circle cx="18" cy="12" r="2.5" />
    </BaseSvg>
  );
}

function EndCapFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 9h9" />
      <path d="M5 15h9" />
      <path d="M14 8c3 1.5 3 6.5 0 8" />
    </BaseSvg>
  );
}

function TakeoffFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 12h16" />
      <path d="M12 12v6" />
      <path d="M9.5 18h5" />
    </BaseSvg>
  );
}

function CondensateFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M6 7h12" />
      <path d="M9 7v6c0 2 1.6 3.5 3.5 3.5S16 15 16 13V7" />
      <path d="M12.5 16.5v2" />
      <path d="M11 20h3" />
    </BaseSvg>
  );
}

function FlangeHardwareIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="4" y="8" width="6" height="8" rx="1" />
      <rect x="14" y="8" width="6" height="8" rx="1" />
      <path d="M10 12h4" />
      <circle cx="7" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </BaseSvg>
  );
}

function TerminalBoxEquipmentIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="4" y="8" width="16" height="8" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" opacity="0.5" />
      <path d="M20 12h2" />
    </BaseSvg>
  );
}

function FanEquipmentIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 6c2 0 3.5 1.5 3.5 3.5-2 0-3.5-1.5-3.5-3.5Z" />
      <path d="M17.5 12c0 2-1.5 3.5-3.5 3.5 0-2 1.5-3.5 3.5-3.5Z" />
      <path d="M12 18c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5Z" />
      <path d="M6.5 12c0-2 1.5-3.5 3.5-3.5 0 2-1.5 3.5-3.5 3.5Z" />
    </BaseSvg>
  );
}

function AhuEquipmentIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3.5" y="7" width="17" height="10" rx="2" />
      <path d="M8 7v10" />
      <path d="M16 7v10" />
      <path d="M5 12h2" />
      <path d="M17 12h2" />
    </BaseSvg>
  );
}

function HoodEquipmentIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 9h16l-2.5 5H6.5Z" />
      <path d="M9 14v4" />
      <path d="M15 14v4" />
    </BaseSvg>
  );
}

function SilencerEquipmentIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="5" y="8" width="14" height="8" rx="4" />
      <path d="M8 10v4" />
      <path d="M12 10v4" />
      <path d="M16 10v4" />
    </BaseSvg>
  );
}

function FilterEquipmentIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 12h6" />
      <path d="M9 15h6" />
    </BaseSvg>
  );
}

function SupportToolEquipmentIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 18h14" />
      <path d="M8 18V9" />
      <path d="M16 18V9" />
      <path d="M6 9h12" />
      <path d="M10 6h4" />
    </BaseSvg>
  );
}

function DamperAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="4" y="8" width="16" height="8" rx="1.5" />
      <path d="M7 10.5h10" />
      <path d="M7 13.5h10" />
      <path d="M12 8v8" />
    </BaseSvg>
  );
}

function AccessDoorAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="5" y="6" width="14" height="12" rx="1.5" />
      <path d="M15 6v12" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </BaseSvg>
  );
}

function GrdAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M7 10h10" />
      <path d="M7 12h10" />
      <path d="M7 14h10" />
    </BaseSvg>
  );
}

function SupportAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M6 18h12" />
      <path d="M9 18v-7" />
      <path d="M15 18v-7" />
      <path d="M7 11h10" />
    </BaseSvg>
  );
}

function BellowsAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 12h3" />
      <path d="M16 12h3" />
      <path d="M8 9h8" />
      <path d="M8 15h8" />
      <path d="M9.5 9v6" />
      <path d="M12 9v6" />
      <path d="M14.5 9v6" />
    </BaseSvg>
  );
}

function RoofTerminationAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 16h14" />
      <path d="M8 16v-5l4-3 4 3v5" />
      <path d="M12 5v3" />
    </BaseSvg>
  );
}

function ThimbleAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="5" y="7" width="14" height="10" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </BaseSvg>
  );
}

const ENTRY_ICON_OVERRIDES: Partial<Record<string, CatalogIconKey>> = {
  duct: 'duct',
  fitting: 'fitting',
  equipment: 'equipment',
  accessory: 'accessory',
};

const DUCT_ICON_BY_KEY: Record<string, CatalogIconKey> = {
  rectangular: 'duct_rectangular',
  straight: 'duct_rectangular',
  round: 'duct_round',
  single_wall_pipe: 'duct_boiler_flue',
  double_wall_pipe: 'duct_boiler_flue',
  flexible_liner: 'duct_boiler_flue',
  factory_built_round: 'duct_grease',
  welded_rectangular: 'duct_grease',
  zero_clearance: 'duct_grease',
  flanged_exhaust_pipe: 'duct_generator',
  slip_fit_exhaust_pipe: 'duct_generator',
  flat_oval: 'duct_flat_oval',
  flexible: 'duct_flexible',
};

const FITTING_ICON_BY_KEY: Record<string, CatalogIconKey> = {
  elbow: 'fitting_elbow',
  elbow_90: 'fitting_elbow',
  elbow_45: 'fitting_elbow',
  radius: 'fitting_elbow',
  standard_elbow: 'fitting_elbow',
  grease_elbow: 'fitting_elbow',
  long_radius_elbow: 'fitting_elbow',
  mitered: 'fitting_mitered_elbow',
  mitered_elbow: 'fitting_mitered_elbow',
  tee: 'fitting_tee',
  cross: 'fitting_tee',
  tee_cross: 'fitting_tee',
  boot_tee: 'fitting_tee',
  wye: 'fitting_wye',
  wye_lateral: 'fitting_wye',
  lateral: 'fitting_wye',
  reducer: 'fitting_reducer',
  concentric: 'fitting_reducer',
  eccentric: 'fitting_reducer',
  transition: 'fitting_transition',
  square_to_round: 'fitting_transition',
  end_cap: 'fitting_end_cap',
  takeoff: 'fitting_takeoff',
  tap: 'fitting_takeoff',
  spin_in: 'fitting_takeoff',
  bellmouth: 'fitting_takeoff',
  test_port: 'fitting_takeoff',
};

const ALL_ICON_KEYS = new Set<CatalogIconKey>([
  'duct',
  'duct_rectangular',
  'duct_round',
  'duct_flat_oval',
  'duct_flexible',
  'duct_boiler_flue',
  'duct_boiler_single_wall',
  'duct_boiler_double_wall',
  'duct_boiler_flexible_liner',
  'duct_grease',
  'duct_grease_round',
  'duct_grease_rectangular',
  'duct_grease_zero_clearance',
  'duct_generator',
  'duct_generator_flanged',
  'duct_generator_slip_fit',
  'fitting',
  'fitting_elbow',
  'fitting_elbow_radius',
  'fitting_elbow_90',
  'fitting_elbow_45',
  'fitting_elbow_grease',
  'fitting_elbow_long_radius',
  'fitting_mitered_elbow',
  'fitting_elbow_mitered',
  'fitting_elbow_grease_mitered',
  'fitting_tee',
  'fitting_tee_cross',
  'fitting_tee_grease',
  'fitting_boot_tee',
  'fitting_wye',
  'fitting_wye_lateral',
  'fitting_wye_engine',
  'fitting_reducer',
  'fitting_reducer_concentric',
  'fitting_reducer_eccentric',
  'fitting_reducer_increaser',
  'fitting_reducer_grease',
  'fitting_reducer_expander',
  'fitting_transition',
  'fitting_transition_square_to_round',
  'fitting_transition_grease',
  'fitting_end_cap',
  'fitting_takeoff',
  'fitting_takeoff_spin_in',
  'fitting_takeoff_bellmouth',
  'fitting_condensate_drain',
  'fitting_test_port',
  'fitting_flange_hardware',
  'equipment',
  'equipment_terminal_box',
  'equipment_fan_coil',
  'equipment_exhaust_fan',
  'equipment_ahu',
  'equipment_draft_inducer',
  'equipment_draft_control',
  'equipment_appliance_adapter',
  'equipment_hood_connection',
  'equipment_upblast_fan',
  'equipment_utility_set_fan',
  'equipment_pcu',
  'equipment_engine_silencer',
  'equipment_dpf',
  'equipment_catalytic_converter',
  'equipment_support_layout',
  'equipment_trapeze_run',
  'accessory',
  'accessory_damper_manual',
  'accessory_damper_motorized',
  'accessory_damper_fire',
  'accessory_damper_smoke_fire',
  'accessory_turning_vanes',
  'accessory_sound_attenuator',
  'accessory_access_door',
  'accessory_flexible_connector',
  'accessory_grd',
  'accessory_condensate_trap',
  'accessory_wall_thimble',
  'accessory_roof_flashing',
  'accessory_support_bracket',
  'accessory_rain_cap',
  'accessory_screened_termination',
  'accessory_suppression_coupling',
  'accessory_grease_reservoir',
  'accessory_roof_curb',
  'accessory_penetration_wrap',
  'accessory_vented_thimble',
  'accessory_bellows',
  'accessory_insulation_blanket',
  'accessory_mitre_termination',
  'accessory_support_hanger',
  'accessory_support_trapeze',
  'accessory_support_strap',
  'accessory_support_cable',
  'accessory_support_clamp',
  'accessory_support_pedestal',
  'accessory_support_roof',
  'accessory_support_brace',
  'accessory_support_anchor',
]);

function isCatalogIconKey(value: string): value is CatalogIconKey {
  return ALL_ICON_KEYS.has(value as CatalogIconKey);
}

function getEntryKeys(entry: UnifiedComponentDefinition): string[] {
  return [entry.icon, entry.subtype, entry.typeId, entry.type, entry.engineeringSystem]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
}

export function resolveCatalogEntryIconKey(entry: UnifiedComponentDefinition): CatalogIconKey {
  if (entry.iconKey && isCatalogIconKey(entry.iconKey)) {
    return entry.iconKey;
  }

  const keys = getEntryKeys(entry);

  for (const key of keys) {
    const override = ENTRY_ICON_OVERRIDES[key];
    if (override && entry.componentClass !== 'duct' && entry.componentClass !== 'fitting') {
      return override;
    }
  }

  if (entry.componentClass === 'duct') {
    for (const key of keys) {
      const resolved = DUCT_ICON_BY_KEY[key];
      if (resolved) {
        return resolved;
      }
    }
    return 'duct';
  }

  if (entry.componentClass === 'fitting') {
    for (const key of keys) {
      const resolved = FITTING_ICON_BY_KEY[key];
      if (resolved) {
        return resolved;
      }
    }
    return 'fitting';
  }

  return entry.componentClass === 'equipment' ? 'equipment' : 'accessory';
}

export function resolveToolbarIconKey(
  tool: CanvasTool,
  placementIconKey?: PlacementToolbarIconKey | null
): CatalogIconKey | null {
  if (tool === 'duct') {
    switch (placementIconKey) {
      case 'boiler_flue':
        return 'duct_boiler_flue';
      case 'grease_duct':
        return 'duct_grease';
      case 'generator_exhaust':
        return 'duct_generator';
      case 'duct':
      default:
        return 'duct_rectangular';
    }
  }

  if (tool === 'fitting') {
    return 'fitting_elbow';
  }

  if (tool === 'equipment') {
    return 'equipment';
  }

  return null;
}

function renderSvgIcon(iconKey: CatalogIconKey, props: IconProps) {
  switch (iconKey) {
    case 'duct':
    case 'duct_rectangular':
      return <RectangularDuctIcon {...props} />;
    case 'duct_round':
      return <RoundDuctIcon {...props} />;
    case 'duct_flat_oval':
      return <FlatOvalDuctIcon {...props} />;
    case 'duct_flexible':
      return <FlexibleDuctIcon {...props} />;
    case 'duct_boiler_flue':
    case 'duct_boiler_single_wall':
    case 'duct_boiler_double_wall':
    case 'duct_boiler_flexible_liner':
      return <BoilerFlueDuctIcon {...props} />;
    case 'duct_grease':
    case 'duct_grease_round':
    case 'duct_grease_rectangular':
    case 'duct_grease_zero_clearance':
      return <GreaseDuctIcon {...props} />;
    case 'duct_generator':
    case 'duct_generator_flanged':
    case 'duct_generator_slip_fit':
      return <GeneratorDuctIcon {...props} />;
    case 'fitting':
    case 'fitting_elbow':
    case 'fitting_elbow_radius':
    case 'fitting_elbow_90':
    case 'fitting_elbow_45':
    case 'fitting_elbow_grease':
    case 'fitting_elbow_long_radius':
      return <ElbowFittingIcon {...props} />;
    case 'fitting_mitered_elbow':
    case 'fitting_elbow_mitered':
    case 'fitting_elbow_grease_mitered':
      return <MiteredElbowFittingIcon {...props} />;
    case 'fitting_tee':
    case 'fitting_tee_cross':
    case 'fitting_tee_grease':
      return <TeeFittingIcon {...props} />;
    case 'fitting_boot_tee':
      return <TeeFittingIcon {...props} />;
    case 'fitting_wye':
    case 'fitting_wye_lateral':
    case 'fitting_wye_engine':
      return <WyeFittingIcon {...props} />;
    case 'fitting_reducer':
    case 'fitting_reducer_concentric':
    case 'fitting_reducer_eccentric':
    case 'fitting_reducer_increaser':
    case 'fitting_reducer_grease':
    case 'fitting_reducer_expander':
      return <ReducerFittingIcon {...props} />;
    case 'fitting_transition':
    case 'fitting_transition_square_to_round':
    case 'fitting_transition_grease':
      return <TransitionFittingIcon {...props} />;
    case 'fitting_end_cap':
      return <EndCapFittingIcon {...props} />;
    case 'fitting_takeoff':
    case 'fitting_takeoff_spin_in':
    case 'fitting_takeoff_bellmouth':
      return <TakeoffFittingIcon {...props} />;
    case 'fitting_condensate_drain':
    case 'fitting_test_port':
      return <CondensateFittingIcon {...props} />;
    case 'fitting_flange_hardware':
      return <FlangeHardwareIcon {...props} />;
    case 'equipment_terminal_box':
      return <TerminalBoxEquipmentIcon {...props} />;
    case 'equipment_fan_coil':
      return <AhuEquipmentIcon {...props} />;
    case 'equipment_exhaust_fan':
    case 'equipment_draft_inducer':
    case 'equipment_upblast_fan':
    case 'equipment_utility_set_fan':
      return <FanEquipmentIcon {...props} />;
    case 'equipment_ahu':
    case 'equipment_appliance_adapter':
      return <AhuEquipmentIcon {...props} />;
    case 'equipment_draft_control':
      return <CondensateFittingIcon {...props} />;
    case 'equipment_hood_connection':
      return <HoodEquipmentIcon {...props} />;
    case 'equipment_pcu':
    case 'equipment_dpf':
    case 'equipment_catalytic_converter':
      return <FilterEquipmentIcon {...props} />;
    case 'equipment_engine_silencer':
      return <SilencerEquipmentIcon {...props} />;
    case 'equipment_support_layout':
    case 'equipment_trapeze_run':
      return <SupportToolEquipmentIcon {...props} />;
    case 'accessory_damper_manual':
    case 'accessory_damper_motorized':
    case 'accessory_damper_fire':
    case 'accessory_damper_smoke_fire':
      return <DamperAccessoryIcon {...props} />;
    case 'accessory_turning_vanes':
    case 'accessory_support_hanger':
    case 'accessory_support_trapeze':
    case 'accessory_support_strap':
    case 'accessory_support_cable':
    case 'accessory_support_bracket':
    case 'accessory_support_clamp':
    case 'accessory_support_pedestal':
    case 'accessory_support_roof':
    case 'accessory_support_brace':
    case 'accessory_support_anchor':
    case 'accessory_roof_curb':
      return <SupportAccessoryIcon {...props} />;
    case 'accessory_sound_attenuator':
      return <SilencerEquipmentIcon {...props} />;
    case 'accessory_access_door':
      return <AccessDoorAccessoryIcon {...props} />;
    case 'accessory_flexible_connector':
    case 'accessory_bellows':
      return <BellowsAccessoryIcon {...props} />;
    case 'accessory_grd':
      return <GrdAccessoryIcon {...props} />;
    case 'accessory_condensate_trap':
    case 'accessory_grease_reservoir':
      return <CondensateFittingIcon {...props} />;
    case 'accessory_suppression_coupling':
      return <FlangeHardwareIcon {...props} />;
    case 'accessory_wall_thimble':
    case 'accessory_vented_thimble':
    case 'accessory_penetration_wrap':
      return <ThimbleAccessoryIcon {...props} />;
    case 'accessory_roof_flashing':
    case 'accessory_rain_cap':
    case 'accessory_screened_termination':
    case 'accessory_mitre_termination':
      return <RoofTerminationAccessoryIcon {...props} />;
    case 'accessory_insulation_blanket':
      return <FlatOvalDuctIcon {...props} />;
    default:
      return null;
  }
}

type HvacCatalogIconProps = {
  iconKey: CatalogIconKey;
  className?: string;
  size?: number;
  strokeWidth?: number;
  'data-testid'?: string;
  'aria-hidden'?: boolean;
};

export function HvacCatalogIcon({
  iconKey,
  className,
  size = 18,
  strokeWidth = 2,
  'data-testid': dataTestId,
  'aria-hidden': ariaHidden,
}: HvacCatalogIconProps) {
  const commonProps: IconProps = {
    width: size,
    height: size,
    className,
    strokeWidth,
    'data-testid': dataTestId,
    'data-icon-key': iconKey,
    'aria-hidden': ariaHidden,
  };

  const svgIcon = renderSvgIcon(iconKey, commonProps);
  if (svgIcon) {
    return svgIcon;
  }

  const LucideIcon = iconKey === 'equipment'
    ? Cog
    : iconKey === 'accessory'
      ? Wrench
      : iconKey.startsWith('duct_boiler')
        ? Flame
        : iconKey.startsWith('duct_grease')
          ? CookingPot
          : Gauge;

  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      data-testid={dataTestId}
      data-icon-key={iconKey}
      aria-hidden={ariaHidden}
    />
  );
}
