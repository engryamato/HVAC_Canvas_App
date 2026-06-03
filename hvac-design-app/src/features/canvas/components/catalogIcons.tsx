'use client';

import type { ReactNode, SVGProps } from 'react';
import { Cog, Wrench } from 'lucide-react';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import type { CanvasTool } from '@/core/store/canvas.store';
import type { PlacementToolbarIconKey } from '@/features/canvas/tools/placementStrategies';

export type CatalogIconKey =
  | 'duct'
  | 'duct_rectangular'
  | 'duct_round'
  | 'duct_flat_oval'
  | 'duct_flexible'
  | 'fitting'
  | 'fitting_elbow'
  | 'fitting_elbow_radius'
  | 'fitting_elbow_90'
  | 'fitting_elbow_45'
  | 'fitting_elbow_long_radius'
  | 'fitting_mitered_elbow'
  | 'fitting_elbow_mitered'
  | 'fitting_tee'
  | 'fitting_tee_cross'
  | 'fitting_wye'
  | 'fitting_wye_lateral'
  | 'fitting_wye_engine'
  | 'fitting_reducer'
  | 'fitting_reducer_concentric'
  | 'fitting_reducer_eccentric'
  | 'fitting_reducer_increaser'
  | 'fitting_reducer_expander'
  | 'fitting_transition'
  | 'fitting_transition_square_to_round'
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
  | 'accessory_wall_thimble'
  | 'accessory_roof_flashing'
  | 'accessory_support_bracket'
  | 'accessory_rain_cap'
  | 'accessory_screened_termination'
  | 'accessory_suppression_coupling'
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
  'data-testid'?: string;
  'aria-hidden'?: boolean;
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


function ElbowFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 4v8c0 3.9 3.1 7 7 7h8" />
      <path d="M9 8v4c0 1.7 1.3 3 3 3h4" />
      <path d="M5 18h4" />
      <path d="M16 15v3" />
    </BaseSvg>
  );
}

function RadiusElbowFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 4v6c0 5 4 9 9 9h5" />
      <path d="M9 8v2c0 2.8 2.2 5 5 5h1" />
      <path d="M5 18h4" />
      <path d="M15 15v3" />
    </BaseSvg>
  );
}

function Elbow90FittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 4v11h11" />
      <path d="M9 8v3h3" />
      <path d="M5 18h4" />
      <path d="M16 15v3" />
    </BaseSvg>
  );
}

function Elbow45FittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 18v-5.5l8-8.5h6" />
      <path d="M9 18v-3.7l5.3-5.3H18" />
      <path d="M5 18h4" />
      <path d="M18 6v4" />
    </BaseSvg>
  );
}


function LongRadiusElbowFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 4v5c0 5.5 4.5 10 10 10h4" />
      <path d="M9 8v1c0 3.3 2.7 6 6 6h0" />
      <path d="M5 18h4" />
      <path d="M15 15v3" />
    </BaseSvg>
  );
}

function MiteredElbowFittingIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 4v6l8 8h7" />
      <path d="M9 8v2l5 5h2" />
      <path d="M5 18h4" />
      <path d="M16 15v3" />
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

function ThimbleAccessoryIcon(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="5" y="7" width="14" height="10" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </BaseSvg>
  );
}

type BadgeVariant =
  | 'radius'
  | 'ninety'
  | 'fortyfive'
  | 'drop'
  | 'long'
  | 'cross'
  | 'boot'
  | 'lateral'
  | 'engine'
  | 'concentric'
  | 'eccentric'
  | 'increaser'
  | 'expander'
  | 'square'
  | 'spin'
  | 'bell'
  | 'drain'
  | 'port'
  | 'coil'
  | 'fan'
  | 'control'
  | 'adapter'
  | 'hood'
  | 'upblast'
  | 'utility'
  | 'pcu'
  | 'dpf'
  | 'catalyst'
  | 'layout'
  | 'trapeze'
  | 'motor'
  | 'fire'
  | 'smoke'
  | 'vanes'
  | 'sound'
  | 'flex'
  | 'trap'
  | 'roof'
  | 'rain'
  | 'screen'
  | 'coupling'
  | 'reservoir'
  | 'curb'
  | 'wrap'
  | 'vent'
  | 'insulation'
  | 'mitre'
  | 'hanger'
  | 'strap'
  | 'cable'
  | 'clamp'
  | 'pedestal'
  | 'brace'
  | 'anchor';

function VariantBadge({ variant }: { variant: BadgeVariant }) {
  switch (variant) {
    case 'radius':
      return <path d="M16 4a4 4 0 0 1 4 4" />;
    case 'ninety':
      return <path d="M16 4h4v4" />;
    case 'fortyfive':
      return <path d="m16.5 4.5 3 3" />;
    case 'drop':
      return <path d="M18 4.5c1.1 1.5 1.6 2.4 1.6 3.2A1.6 1.6 0 0 1 18 9.3a1.6 1.6 0 0 1-1.6-1.6c0-.8.5-1.7 1.6-3.2Z" />;
    case 'long':
      return <path d="M15 4.5h5" />;
    case 'cross':
      return (
        <>
          <path d="M18 3.8v5.4" />
          <path d="M15.3 6.5h5.4" />
        </>
      );
    case 'boot':
      return <path d="M15.5 4.5h4v4h-2v1h-2Z" />;
    case 'lateral':
      return <path d="m15.5 8.5 4-4" />;
    case 'engine':
      return (
        <>
          <rect x="15.2" y="4.2" width="4.6" height="3.6" rx="0.8" />
          <path d="M16 8.8v1.2" />
          <path d="M19 8.8v1.2" />
        </>
      );
    case 'concentric':
      return (
        <>
          <circle cx="18" cy="6.5" r="2.6" />
          <circle cx="18" cy="6.5" r="1.2" />
        </>
      );
    case 'eccentric':
      return (
        <>
          <circle cx="18" cy="6.5" r="2.6" />
          <circle cx="19" cy="5.8" r="1.1" />
        </>
      );
    case 'increaser':
      return <path d="M15.5 6.5h5M18 4v5" />;
    case 'expander':
      return <path d="M18 4v5M16 5l2-2 2 2" />;
    case 'square':
      return <rect x="15.2" y="4.2" width="5.2" height="5.2" rx="0.8" />;
    case 'spin':
      return <path d="M18 3.8a2.8 2.8 0 1 1-2.2 4.6m2.2-4.6v1.8m0 0h1.8" />;
    case 'bell':
      return <path d="M16 8.5h4c0-1.9-.9-3-2-4-1.1 1-2 2.1-2 4Z" />;
    case 'drain':
      return <path d="M18 4v4m-2 0h4" />;
    case 'port':
      return (
        <>
          <circle cx="18" cy="6.5" r="2.2" />
          <circle cx="18" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </>
      );
    case 'coil':
      return <path d="M15.5 5c1.5-1 2.5 1 4 0M15.5 8c1.5-1 2.5 1 4 0" />;
    case 'fan':
      return (
        <>
          <circle cx="18" cy="6.5" r="0.8" />
          <path d="M18 4.4c.8 0 1.4.6 1.4 1.4-.8 0-1.4-.6-1.4-1.4Z" />
          <path d="M20.1 6.5c0 .8-.6 1.4-1.4 1.4 0-.8.6-1.4 1.4-1.4Z" />
          <path d="M18 8.6c-.8 0-1.4-.6-1.4-1.4.8 0 1.4.6 1.4 1.4Z" />
        </>
      );
    case 'control':
      return <path d="M15.8 6.5h4.4M18 4.2v4.6" />;
    case 'adapter':
      return <path d="M15.5 5.2h2.8l1.6 1.3-1.6 1.3h-2.8Z" />;
    case 'hood':
      return <path d="M15.5 5.2h5l-.9 1.8h-3.2Z" />;
    case 'upblast':
      return <path d="M18 9V4m-2 2 2-2 2 2" />;
    case 'utility':
      return <path d="M15.5 8.5h5l-1.4-4-2 1-2.2-1.8" />;
    case 'pcu':
      return <path d="M15.5 4.5h5v4h-5Z" />;
    case 'dpf':
      return <path d="M15.7 4.7h4.6M15.7 6.5h4.6M15.7 8.3h4.6" />;
    case 'catalyst':
      return <path d="m15.8 5.2 2.2-1.2 2.2 1.2v2.6L18 9l-2.2-1.2Z" />;
    case 'layout':
      return <path d="M15.5 4.5h5v5h-5ZM18 9.5v2" />;
    case 'trapeze':
      return <path d="M15.5 8.5h5M16.5 8.5V5h3V8.5" />;
    case 'motor':
      return <path d="M15.5 6.5h5m-2.5-2.5v5" />;
    case 'fire':
      return <path d="M18 4c1 1.1 1.7 2.3 1.7 3.4A1.7 1.7 0 0 1 18 9.1a1.7 1.7 0 0 1-1.7-1.7C16.3 6.3 17 5.1 18 4Z" />;
    case 'smoke':
      return <path d="M15.7 8.5c.5-2 1.5-1.2 2-2.8.5 1.6 1.5.8 2 2.8" />;
    case 'vanes':
      return <path d="M15.8 4.8h4.4M16.2 6.5h3.6M16.6 8.2h2.8" />;
    case 'sound':
      return <path d="M16 8.5V4.5M18 8.5v-3M20 8.5v-5" />;
    case 'flex':
      return <path d="M15.5 8c1.2-2.4 2.3 2.4 3.4 0s2.2 2.4 3.1 0" />;
    case 'trap':
      return <path d="M16 4.5v3c0 1 1 1.8 2 1.8s2-.8 2-1.8v-3" />;
    case 'roof':
      return <path d="M15.5 8.5h5l-2.5-3Z" />;
    case 'rain':
      return <path d="M16.2 4.8h3.6l-1.8 2.2ZM17 8.5l-.6 1M19 8.5l-.6 1" />;
    case 'screen':
      return <path d="M15.7 4.7h4.6v3.6h-4.6ZM17.2 4.7v3.6M18.8 4.7v3.6M15.7 6.5h4.6" />;
    case 'coupling':
      return <path d="M15.8 6.5h4.4M17 4.8v3.4M19 4.8v3.4" />;
    case 'reservoir':
      return <path d="M16 5.2h4v2.6c0 .6-.5 1.1-1.1 1.1h-1.8A1.1 1.1 0 0 1 16 7.8Z" />;
    case 'curb':
      return <path d="M15.8 4.8h4.4v3.8h-4.4ZM15.8 8.6l1.4-1.4h1.6l1.4 1.4" />;
    case 'wrap':
      return <path d="M15.8 4.8h4.4v3.6h-4.4ZM15.2 6.6h5.6" />;
    case 'vent':
      return <path d="M18 9V4m-1.8 1.8L18 4l1.8 1.8" />;
    case 'insulation':
      return <path d="M15.5 5.2h5M15.5 7.8h5" />;
    case 'mitre':
      return <path d="M16 8.5h4.5M20.5 4l-2.8 2.8" />;
    case 'hanger':
      return <path d="M18 4.2v2.6c0 .9-.7 1.7-1.7 1.7" />;
    case 'strap':
      return <path d="M16 4.5h4v4h-4Z" />;
    case 'cable':
      return <path d="M16 4.5c1.1 0 1.1 4 2 4s.9-4 2-4" />;
    case 'clamp':
      return <path d="M16 6.5a2 2 0 1 1 4 0M16 6.5h4" />;
    case 'pedestal':
      return <path d="M16.2 8.5h3.6M18 4.5v4" />;
    case 'brace':
      return <path d="m16 8.5 4-4" />;
    case 'anchor':
      return <path d="M18 4.5v4M16.2 6.3 18 4.5l1.8 1.8M16 8.5h4" />;
  }
}

function TeeVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M4 12h16" />
      <path d="M12 7v10" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function WyeVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M12 5v14" />
      <path d="M12 12 6 6" />
      <path d="M12 12 18 6" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function ReducerVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M4 10h6l4-3h6v10h-6l-4-3H4z" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function TransitionVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="4" y="8" width="6" height="8" rx="1" />
      <path d="M10 8l5 2v4l-5 2Z" />
      <circle cx="18" cy="12" r="2.5" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function TakeoffVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M4 12h16" />
      <path d="M12 12v6" />
      <path d="M9.5 18h5" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function CondensateVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M6 7h12" />
      <path d="M9 7v6c0 2 1.6 3.5 3.5 3.5S16 15 16 13V7" />
      <path d="M12.5 16.5v2" />
      <path d="M11 20h3" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function TerminalBoxVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="4" y="8" width="16" height="8" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" opacity="0.5" />
      <path d="M20 12h2" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function FanVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 6c2 0 3.5 1.5 3.5 3.5-2 0-3.5-1.5-3.5-3.5Z" />
      <path d="M17.5 12c0 2-1.5 3.5-3.5 3.5 0-2 1.5-3.5 3.5-3.5Z" />
      <path d="M12 18c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5Z" />
      <path d="M6.5 12c0-2 1.5-3.5 3.5-3.5 0 2-1.5-3.5-3.5 3.5Z" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function AhuVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="3.5" y="7" width="17" height="10" rx="2" />
      <path d="M8 7v10" />
      <path d="M16 7v10" />
      <path d="M5 12h2" />
      <path d="M17 12h2" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function HoodVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M4 9h16l-2.5 5H6.5Z" />
      <path d="M9 14v4" />
      <path d="M15 14v4" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function FilterVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 12h6" />
      <path d="M9 15h6" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function SilencerVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="5" y="8" width="14" height="8" rx="4" />
      <path d="M8 10v4" />
      <path d="M12 10v4" />
      <path d="M16 10v4" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function SupportVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M6 18h12" />
      <path d="M9 18v-7" />
      <path d="M15 18v-7" />
      <path d="M7 11h10" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function DamperVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="4" y="8" width="16" height="8" rx="1.5" />
      <path d="M7 10.5h10" />
      <path d="M7 13.5h10" />
      <path d="M12 8v8" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function GrdVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M7 10h10" />
      <path d="M7 12h10" />
      <path d="M7 14h10" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function BellowsVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M5 12h3" />
      <path d="M16 12h3" />
      <path d="M8 9h8" />
      <path d="M8 15h8" />
      <path d="M9.5 9v6" />
      <path d="M12 9v6" />
      <path d="M14.5 9v6" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function RoofTerminationVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <path d="M5 16h14" />
      <path d="M8 16v-5l4-3 4 3v5" />
      <path d="M12 5v3" />
      <VariantBadge variant={variant} />
    </BaseSvg>
  );
}

function ThimbleVariantIcon(props: IconProps & { variant: BadgeVariant }) {
  const { variant, ...svgProps } = props;
  return (
    <BaseSvg {...svgProps}>
      <rect x="5" y="7" width="14" height="10" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <VariantBadge variant={variant} />
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
  flat_oval: 'duct_flat_oval',
  flexible: 'duct_flexible',
};

const FITTING_ICON_BY_KEY: Record<string, CatalogIconKey> = {
  elbow: 'fitting_elbow',
  elbow_90: 'fitting_elbow',
  elbow_45: 'fitting_elbow',
  radius: 'fitting_elbow',
  standard_elbow: 'fitting_elbow',
  long_radius_elbow: 'fitting_elbow',
  mitered: 'fitting_mitered_elbow',
  mitered_elbow: 'fitting_mitered_elbow',
  tee: 'fitting_tee',
  cross: 'fitting_tee',
  tee_cross: 'fitting_tee',
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
  'fitting',
  'fitting_elbow',
  'fitting_elbow_radius',
  'fitting_elbow_90',
  'fitting_elbow_45',
  'fitting_elbow_long_radius',
  'fitting_mitered_elbow',
  'fitting_elbow_mitered',
  'fitting_tee',
  'fitting_tee_cross',
  'fitting_wye',
  'fitting_wye_lateral',
  'fitting_wye_engine',
  'fitting_reducer',
  'fitting_reducer_concentric',
  'fitting_reducer_eccentric',
  'fitting_reducer_increaser',
  'fitting_reducer_expander',
  'fitting_transition',
  'fitting_transition_square_to_round',
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
  'accessory_wall_thimble',
  'accessory_roof_flashing',
  'accessory_support_bracket',
  'accessory_rain_cap',
  'accessory_screened_termination',
  'accessory_suppression_coupling',
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
    case 'fitting':
    case 'fitting_elbow':
      return <ElbowFittingIcon {...props} />;
    case 'fitting_elbow_radius':
      return <RadiusElbowFittingIcon {...props} />;
    case 'fitting_elbow_90':
      return <Elbow90FittingIcon {...props} />;
    case 'fitting_elbow_45':
      return <Elbow45FittingIcon {...props} />;
    case 'fitting_elbow_long_radius':
      return <LongRadiusElbowFittingIcon {...props} />;
    case 'fitting_mitered_elbow':
      return <MiteredElbowFittingIcon {...props} />;
    case 'fitting_elbow_mitered':
      return <MiteredElbowFittingIcon {...props} />;
    case 'fitting_tee':
      return <TeeFittingIcon {...props} />;
    case 'fitting_tee_cross':
      return <TeeVariantIcon {...props} variant="cross" />;
      return <TeeVariantIcon {...props} variant="drop" />;
    case 'fitting_wye':
      return <WyeFittingIcon {...props} />;
    case 'fitting_wye_lateral':
      return <WyeVariantIcon {...props} variant="lateral" />;
    case 'fitting_wye_engine':
      return <WyeVariantIcon {...props} variant="engine" />;
    case 'fitting_reducer':
      return <ReducerFittingIcon {...props} />;
    case 'fitting_reducer_concentric':
      return <ReducerVariantIcon {...props} variant="concentric" />;
    case 'fitting_reducer_eccentric':
      return <ReducerVariantIcon {...props} variant="eccentric" />;
    case 'fitting_reducer_increaser':
      return <ReducerVariantIcon {...props} variant="increaser" />;
      return <ReducerVariantIcon {...props} variant="drop" />;
    case 'fitting_reducer_expander':
      return <ReducerVariantIcon {...props} variant="expander" />;
    case 'fitting_transition':
      return <TransitionFittingIcon {...props} />;
    case 'fitting_transition_square_to_round':
      return <TransitionVariantIcon {...props} variant="square" />;
      return <TransitionVariantIcon {...props} variant="drop" />;
    case 'fitting_end_cap':
      return <EndCapFittingIcon {...props} />;
    case 'fitting_takeoff':
      return <TakeoffFittingIcon {...props} />;
    case 'fitting_takeoff_spin_in':
      return <TakeoffVariantIcon {...props} variant="spin" />;
    case 'fitting_takeoff_bellmouth':
      return <TakeoffVariantIcon {...props} variant="bell" />;
    case 'fitting_condensate_drain':
      return <CondensateFittingIcon {...props} />;
    case 'fitting_test_port':
      return <CondensateVariantIcon {...props} variant="port" />;
    case 'fitting_flange_hardware':
      return <FlangeHardwareIcon {...props} />;
    case 'equipment_terminal_box':
      return <TerminalBoxEquipmentIcon {...props} />;
    case 'equipment_fan_coil':
      return <AhuVariantIcon {...props} variant="coil" />;
    case 'equipment_exhaust_fan':
      return <FanEquipmentIcon {...props} />;
    case 'equipment_upblast_fan':
      return <FanVariantIcon {...props} variant="upblast" />;
    case 'equipment_utility_set_fan':
      return <FanVariantIcon {...props} variant="utility" />;
    case 'equipment_ahu':
      return <AhuEquipmentIcon {...props} />;
    case 'equipment_draft_control':
      return <TerminalBoxVariantIcon {...props} variant="control" />;
    case 'equipment_appliance_adapter':
      return <AhuVariantIcon {...props} variant="adapter" />;
    case 'equipment_hood_connection':
      return <HoodVariantIcon {...props} variant="hood" />;
    case 'equipment_pcu':
      return <FilterEquipmentIcon {...props} />;
    case 'equipment_dpf':
      return <FilterVariantIcon {...props} variant="dpf" />;
    case 'equipment_catalytic_converter':
      return <FilterVariantIcon {...props} variant="catalyst" />;
    case 'equipment_engine_silencer':
      return <SilencerVariantIcon {...props} variant="engine" />;
    case 'equipment_support_layout':
      return <SupportToolEquipmentIcon {...props} />;
    case 'equipment_trapeze_run':
      return <SupportVariantIcon {...props} variant="trapeze" />;
    case 'accessory_damper_manual':
      return <DamperAccessoryIcon {...props} />;
    case 'accessory_damper_motorized':
      return <DamperVariantIcon {...props} variant="motor" />;
    case 'accessory_damper_fire':
      return <DamperVariantIcon {...props} variant="fire" />;
    case 'accessory_damper_smoke_fire':
      return <DamperVariantIcon {...props} variant="smoke" />;
    case 'accessory_turning_vanes':
      return <GrdVariantIcon {...props} variant="vanes" />;
    case 'accessory_support_hanger':
      return <SupportVariantIcon {...props} variant="hanger" />;
    case 'accessory_support_trapeze':
      return <SupportVariantIcon {...props} variant="trapeze" />;
    case 'accessory_support_strap':
      return <SupportVariantIcon {...props} variant="strap" />;
    case 'accessory_support_cable':
      return <SupportVariantIcon {...props} variant="cable" />;
    case 'accessory_support_bracket':
      return <SupportVariantIcon {...props} variant="square" />;
    case 'accessory_support_clamp':
      return <SupportVariantIcon {...props} variant="clamp" />;
    case 'accessory_support_pedestal':
      return <SupportVariantIcon {...props} variant="pedestal" />;
    case 'accessory_support_roof':
      return <SupportVariantIcon {...props} variant="roof" />;
    case 'accessory_support_brace':
      return <SupportVariantIcon {...props} variant="brace" />;
    case 'accessory_support_anchor':
      return <SupportVariantIcon {...props} variant="anchor" />;
    case 'accessory_roof_curb':
      return <SupportVariantIcon {...props} variant="curb" />;
    case 'accessory_sound_attenuator':
      return <SilencerVariantIcon {...props} variant="sound" />;
    case 'accessory_access_door':
      return <AccessDoorAccessoryIcon {...props} />;
    case 'accessory_flexible_connector':
      return <BellowsVariantIcon {...props} variant="flex" />;
    case 'accessory_bellows':
      return <BellowsVariantIcon {...props} variant="bell" />;
    case 'accessory_grd':
      return <GrdAccessoryIcon {...props} />;
    case 'accessory_suppression_coupling':
      return <SupportVariantIcon {...props} variant="coupling" />;
    case 'accessory_wall_thimble':
      return <ThimbleAccessoryIcon {...props} />;
    case 'accessory_vented_thimble':
      return <ThimbleVariantIcon {...props} variant="vent" />;
    case 'accessory_penetration_wrap':
      return <ThimbleVariantIcon {...props} variant="wrap" />;
    case 'accessory_roof_flashing':
      return <RoofTerminationVariantIcon {...props} variant="roof" />;
    case 'accessory_rain_cap':
      return <RoofTerminationVariantIcon {...props} variant="rain" />;
    case 'accessory_screened_termination':
      return <RoofTerminationVariantIcon {...props} variant="screen" />;
    case 'accessory_mitre_termination':
      return <RoofTerminationVariantIcon {...props} variant="mitre" />;
    case 'accessory_insulation_blanket':
      return <BellowsVariantIcon {...props} variant="insulation" />;
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
      : Wrench;

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
