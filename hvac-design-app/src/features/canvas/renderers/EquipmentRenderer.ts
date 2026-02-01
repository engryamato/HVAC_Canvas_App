import type { Equipment } from '@/core/schema';
import type { EquipmentType } from '@/core/schema/equipment.schema';
import type { RenderContext } from './RoomRenderer';

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

  ctx.save();

  // Draw equipment body
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = isSelected ? '#1976D2' : colors.stroke;
  ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

  ctx.fillRect(0, 0, width, depth);
  ctx.strokeRect(0, 0, width, depth);

  // Draw type-specific icon
  renderEquipmentIcon(ctx, equipmentType, width, depth, zoom);

  // Draw name label
  const fontSize = Math.max(10 / zoom, 8);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = colors.stroke;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(name, width / 2, -4 / zoom);

  ctx.restore();
}

/**
 * Render equipment type-specific icon
 */
function renderEquipmentIcon(
  ctx: CanvasRenderingContext2D,
  type: EquipmentType,
  width: number,
  depth: number,
  zoom: number
): void {
  const centerX = width / 2;
  const centerY = depth / 2;
  const iconSize = Math.min(width, depth) * 0.4;

  ctx.save();

  switch (type) {
    case 'hood':
      renderHoodIcon(ctx, centerX, centerY, iconSize, zoom);
      break;
    case 'fan':
      renderFanIcon(ctx, centerX, centerY, iconSize, zoom);
      break;
    case 'diffuser':
      renderDiffuserIcon(ctx, centerX, centerY, iconSize, zoom);
      break;
    case 'damper':
      renderDamperIcon(ctx, centerX, centerY, iconSize, zoom);
      break;
    case 'air_handler':
      renderAhuIcon(ctx, centerX, centerY, iconSize, zoom);
      break;
    case 'furnace':
    case 'rtu':
      renderAhuIcon(ctx, centerX, centerY, iconSize, zoom);
      break;
  }

  ctx.restore();
}

function renderHoodIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void {
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 2 / zoom;
  // Exhaust arrow pointing up
  ctx.beginPath();
  ctx.moveTo(cx, cy + size / 2);
  ctx.lineTo(cx, cy - size / 2);
  ctx.moveTo(cx - size / 3, cy - size / 4);
  ctx.lineTo(cx, cy - size / 2);
  ctx.lineTo(cx + size / 3, cy - size / 4);
  ctx.stroke();
}

function renderFanIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void {
  ctx.strokeStyle = '#1565C0';
  ctx.lineWidth = 2 / zoom;
  // Circle with blades
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.stroke();
  // Blades
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (Math.cos(angle) * size) / 2.5, cy + (Math.sin(angle) * size) / 2.5);
    ctx.stroke();
  }
}

function renderDiffuserIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void {
  ctx.strokeStyle = '#388E3C';
  ctx.lineWidth = 1.5 / zoom;
  // Grid pattern
  const step = size / 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - size / 2, cy + i * step);
    ctx.lineTo(cx + size / 2, cy + i * step);
    ctx.moveTo(cx + i * step, cy - size / 2);
    ctx.lineTo(cx + i * step, cy + size / 2);
    ctx.stroke();
  }
}

function renderDamperIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void {
  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = 2 / zoom;
  // Horizontal lines (damper blades)
  ctx.beginPath();
  ctx.moveTo(cx - size / 2, cy - size / 4);
  ctx.lineTo(cx + size / 2, cy + size / 4);
  ctx.moveTo(cx - size / 2, cy + size / 4);
  ctx.lineTo(cx + size / 2, cy - size / 4);
  ctx.stroke();
}

function renderAhuIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void {
  ctx.strokeStyle = '#37474F';
  ctx.lineWidth = 2 / zoom;
  // Box with coil symbol
  ctx.beginPath();
  ctx.rect(cx - size / 2, cy - size / 2, size, size);
  ctx.stroke();
  // Coil
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const x = cx - size / 3 + i * (size / 3);
    ctx.moveTo(x, cy - size / 4);
    ctx.lineTo(x, cy + size / 4);
  }
  ctx.stroke();
}

export default renderEquipment;
