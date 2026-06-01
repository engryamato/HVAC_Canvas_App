import type { Equipment } from '@/core/schema';
import type { EquipmentType } from '@/core/schema/equipment.schema';
import type { RenderContext } from './RoomRenderer';
import { ProfessionalRenderingHelper } from '../utils';
import { getPortWorldPosition } from '../services/equipmentGeometry';
import { renderRTUSymbol } from './equipment/RTUSymbol';
import { renderPortMarker, resolvePortMarkerShape } from './equipment/portMarkerRenderer';

/**
 * Equipment colors by type
 * Matches EquipmentTypeSchema: 'hood' | 'fan' | 'diffuser' | 'damper' | 'air_handler'
 */
const EQUIPMENT_COLORS: Record<EquipmentType, { fill: string; stroke: string }> = {
  hood: { fill: '#FFF3E0', stroke: '#E65100' },
  fan: { fill: '#E3F2FD', stroke: '#1565C0' },
  exhaust_fan: { fill: '#E3F2FD', stroke: '#1565C0' },
  diffuser: { fill: '#E8F5E9', stroke: '#388E3C' },
  grille: { fill: '#F1F8E9', stroke: '#558B2F' },
  damper: { fill: '#FBE9E7', stroke: '#BF360C' },
  fire_damper: { fill: '#FFEBEE', stroke: '#B71C1C' },
  smoke_damper: { fill: '#ECEFF1', stroke: '#455A64' },
  air_handler: { fill: '#ECEFF1', stroke: '#37474F' },
  vav_box: { fill: '#E8EAF6', stroke: '#303F9F' },
  fcu: { fill: '#E0F2F1', stroke: '#00695C' },
  mau: { fill: '#E1F5FE', stroke: '#0277BD' },
  erv: { fill: '#F3E5F5', stroke: '#6A1B9A' },
  furnace: { fill: '#FFF8E1', stroke: '#FF8F00' },
  unit_heater: { fill: '#FFF8E1', stroke: '#FF8F00' },
  rtu: { fill: '#E0F7FA', stroke: '#006064' },
};

/**
 * Render an equipment entity on the canvas
 */
export function renderEquipment(equipment: Equipment, context: RenderContext): void {
  const { ctx, zoom, isSelected, entitiesById = {} } = context;
  const { width, depth, name, equipmentType } = equipment.props;
  const colors = EQUIPMENT_COLORS[equipmentType];

  const helper = new ProfessionalRenderingHelper(ctx, zoom);

  ctx.save();

  if (equipmentType === 'rtu') {
    renderRTUSymbol(equipment, context);
  } else {
    // Draw equipment body
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = isSelected ? '#1976D2' : colors.stroke;
    ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

    ctx.fillRect(0, 0, width, depth);
    ctx.strokeRect(0, 0, width, depth);

    // Draw type-specific icon using ProfessionalRenderingHelper
    const iconSize = Math.min(width, depth) * 0.4;
    const symbolBounds = {
      x: (width - iconSize) / 2,
      y: (depth - iconSize) / 2,
      width: iconSize,
      height: iconSize,
    };

    let helperType: 'AHU' | 'Fan' | 'Hood' | 'Diffuser' | 'Damper' = 'AHU';
    switch (equipmentType) {
      case 'fan': helperType = 'Fan'; break;
      case 'hood': helperType = 'Hood'; break;
      case 'diffuser': helperType = 'Diffuser'; break;
      case 'damper': helperType = 'Damper'; break;
      case 'fire_damper':
      case 'smoke_damper':
        helperType = 'Damper';
        break;
      case 'air_handler':
      case 'furnace':
      case 'vav_box':
      case 'fcu':
      case 'mau':
      case 'exhaust_fan':
      case 'erv':
      case 'unit_heater':
      case 'grille':
        helperType = 'AHU';
        break;
    }

    helper.drawEquipmentSymbol(helperType, symbolBounds);
  }

  if (equipmentType !== 'rtu') {
    // Draw name label
    const fontSize = Math.max(10 / zoom, 8);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = colors.stroke;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(name, width / 2, -4 / zoom);
  }

  if (zoom > 0.4) {
    const bounds = { x: 0, y: 0, width, height: depth };
    for (const port of equipment.props.connectionPorts ?? []) {
      const pos = getPortWorldPosition(port, bounds);
      const shape = resolvePortMarkerShape(port, entitiesById);
      renderPortMarker(ctx, port, pos, shape, zoom, zoom > 1);
    }
  }

  ctx.restore();
}

export default renderEquipment;
