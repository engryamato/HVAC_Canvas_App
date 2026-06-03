import type { EquipmentType } from '@/core/schema/equipment.schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';

const FITTING_TYPE_BY_KEY: Record<string, FittingType> = {
  elbow: 'elbow_90',
  radius: 'elbow_90',
  elbow_90: 'elbow_90',
  elbow_45: 'elbow_45',
  mitered: 'elbow_mitered',
  mitered_elbow: 'elbow_mitered',
  elbow_mitered: 'elbow_mitered',
  tee: 'tee',
  tee_cross: 'tee',
  cross: 'tee',
  reducer: 'reducer',
  concentric: 'reducer',
  reducer_tapered: 'reducer_tapered',
  eccentric: 'reducer_eccentric',
  reducer_eccentric: 'reducer_eccentric',
  wye: 'wye',
  wye_lateral: 'wye',
  transition: 'transition_square_to_round',
  square_to_round: 'transition_square_to_round',
  transition_square_to_round: 'transition_square_to_round',
  end_cap: 'cap',
  cap: 'cap',
  takeoff: 'end_boot',
  spin_in: 'end_boot',
  tap: 'end_boot',
  bellmouth: 'end_boot',
  end_boot: 'end_boot',
};

const EQUIPMENT_TYPE_BY_KEY: Record<string, EquipmentType> = {
  terminal_box: 'damper',
  fan_coil: 'fan',
  exhaust_fan: 'fan',
  ahu_connection: 'air_handler',
  hood_connection: 'hood',
  upblast_fan: 'fan',
  utility_set_fan: 'fan',
  pcu: 'air_handler',
  draft_control: 'damper',
  appliance_adapter: 'furnace',
  silencer: 'fan',
  dpf: 'furnace',
  catalytic_converter: 'furnace',
  damper: 'damper',
  grd: 'diffuser',
  diffuser: 'diffuser',
  access_door: 'damper',
  connector: 'damper',
  turning_vanes: 'damper',
  support_bracket: 'damper',
  rain_cap: 'damper',
  wall_thimble: 'damper',
  screened_termination: 'damper',
  roof_curb: 'air_handler',
  penetration_wrap: 'damper',
  vented_thimble: 'damper',
  bellows: 'damper',
  insulation_blanket: 'damper',
  wall_sleeve: 'damper',
  mitre_termination: 'damper',
  spring_isolation_hanger: 'damper',
  auto_hanger_spacing: 'damper',
  continuous_trapeze_run: 'damper',
  clevis_hanger: 'damper',
  trapeze_hanger: 'damper',
  strap_hanger: 'damper',
  cable_suspension: 'damper',
  wall_bracket: 'damper',
  riser_clamp: 'damper',
  floor_support: 'damper',
  roof_support: 'damper',
  rigid_seismic_brace: 'damper',
  cable_seismic_brace: 'damper',
  wedge_anchor: 'damper',
  beam_clamp: 'damper',
};

function getPlacementKeys(component: UnifiedComponentDefinition): string[] {
  return [component.subtype, component.typeId, component.type]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
}

export function isEquipmentLike(component: UnifiedComponentDefinition): boolean {
  return component.componentClass === 'equipment' || component.componentClass === 'accessory';
}

export function resolveFittingType(component: UnifiedComponentDefinition): FittingType {
  for (const key of getPlacementKeys(component)) {
    const resolved = FITTING_TYPE_BY_KEY[key];
    if (resolved) {
      return resolved;
    }
  }

  return 'elbow_90';
}

export function resolveEquipmentType(component: UnifiedComponentDefinition): EquipmentType {
  for (const key of getPlacementKeys(component)) {
    const resolved = EQUIPMENT_TYPE_BY_KEY[key];
    if (resolved) {
      return resolved;
    }
  }

  return 'fan';
}
