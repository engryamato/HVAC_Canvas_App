import type { Equipment } from '@/core/schema';
import type { EquipmentType } from '@/core/schema/equipment.schema';
import type { RenderContext } from './RoomRenderer';
import { ProfessionalRenderingHelper } from '../utils';

/**
 * Equipment colors by type
 * Matches EquipmentTypeSchema: 'hood' | 'fan' | 'diffuser' | 'damper' | 'air_handler'
 */
const EQUIPMENT_COLORS: Record<EquipmentType, { fill: string; stroke: string }> = {
  hood: { fill: '#FFF3E0', stroke: '#E65100' },
  fan: { fill: '#E3F2FD', stroke: '#1565C0' },
  diffuser: { fill: '#E8F5E9', stroke: '#388E3C' },
  damper: { fill: '#FBE9E7', stroke: '#BF360C' },
  air_handler: { fill: '#ECEFF1', stroke: '#37474F' },
  furnace: { fill: '#FFF8E1', stroke: '#FF8F00' },
  rtu: { fill: '#E0F7FA', stroke: '#006064' },
};

/**
 * Render an equipment entity on the canvas
 */
export function renderEquipment(equipment: Equipment, context: RenderContext): void {
  const { ctx, zoom, isSelected } = context;
  const { width, depth, name, equipmentType } = equipment.props;
  const colors = EQUIPMENT_COLORS[equipmentType];

  const helper = new ProfessionalRenderingHelper(ctx, zoom);

  ctx.save();

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
    case 'air_handler':
    case 'furnace':
    case 'rtu':
      helperType = 'AHU';
      break;
  }

  helper.drawEquipmentSymbol(helperType, symbolBounds);

  // Draw name label
  const fontSize = Math.max(10 / zoom, 8);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = colors.stroke;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(name, width / 2, -4 / zoom);

  ctx.restore();
}

export default renderEquipment;
