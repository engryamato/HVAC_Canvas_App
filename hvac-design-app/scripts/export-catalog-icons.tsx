import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HvacCatalogIcon } from '../src/features/canvas/components/catalogIcons';
import type { CatalogIconKey } from '../src/features/canvas/components/catalogIcons';

const ICON_KEYS: CatalogIconKey[] = [
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
];

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  'public',
  'branding',
  'hvac-library',
  'catalog-icons'
);

function buildSvg(iconKey: CatalogIconKey): string {
  const markup = renderToStaticMarkup(
    <HvacCatalogIcon iconKey={iconKey} size={64} strokeWidth={1.8} aria-hidden />
  );

  return markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all(
    ICON_KEYS.map(async (iconKey) => {
      const filePath = path.join(OUTPUT_DIR, `${iconKey}.svg`);
      await fs.writeFile(filePath, buildSvg(iconKey), 'utf8');
    })
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    iconCount: ICON_KEYS.length,
    icons: ICON_KEYS,
  };

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  process.stdout.write(`Exported ${ICON_KEYS.length} icons to ${OUTPUT_DIR}\n`);
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
