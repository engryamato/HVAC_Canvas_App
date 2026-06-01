import type { Entity } from '@/core/schema';
import type { ConnectionPort } from '@/core/schema/equipment.schema';
import { resolveDuctConnectionProfile } from '../../services/ductConnectionProfile';
import { resolvePortFlow, type EquipmentPortWorldPosition } from '../../services/equipmentGeometry';

const PORT_COLORS: Record<ConnectionPort['role'], string> = {
  supply: '#2E7D32',
  return: '#1565C0',
  outdoor_air: '#00838F',
  exhaust: '#C62828',
  relief: '#6A1B9A',
  inline: '#757575',
};

export interface PortMarkerShape {
  type: 'circle' | 'rect';
  visualSize: number;
}

export function resolvePortMarkerShape(
  port: ConnectionPort,
  entitiesById: Record<string, Entity> = {},
  defaultSize = 17
): PortMarkerShape {
  const connected = port.connectedDuctId ? entitiesById[port.connectedDuctId] : undefined;
  if (connected?.type === 'duct' || connected?.type === 'duct_run') {
    const profile = resolveDuctConnectionProfile(connected);
    return {
      type: profile.markerKind === 'circle' ? 'circle' : 'rect',
      visualSize: profile.visualSize || defaultSize,
    };
  }

  return { type: 'circle', visualSize: defaultSize };
}

export function renderPortMarker(
  ctx: CanvasRenderingContext2D,
  port: ConnectionPort,
  pos: EquipmentPortWorldPosition,
  shape: PortMarkerShape,
  zoom: number,
  showLabel = false
): void {
  const color = PORT_COLORS[port.role];
  const lineWidth = 1.5 / zoom;
  const size = Math.max(shape.visualSize, 8);

  ctx.save();
  ctx.lineWidth = lineWidth;

  if (shape.type === 'circle') {
    const radius = size / 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 5 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    const width = size;
    const height = Math.max(8 / zoom, 8);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#CBD5E1';
    ctx.fillRect(pos.x - width / 2 - 3 / zoom, pos.y - height / 2 - 3 / zoom, width + 6 / zoom, height + 6 / zoom);
    ctx.strokeRect(pos.x - width / 2 - 3 / zoom, pos.y - height / 2 - 3 / zoom, width + 6 / zoom, height + 6 / zoom);
    ctx.fillStyle = color;
    ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);
  }

  drawFlowArrow(ctx, port, pos, color, zoom);

  if (showLabel && port.label) {
    ctx.font = `bold ${Math.max(9 / zoom, 7)}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(port.label, pos.x, pos.y - 22 / zoom);
  }

  ctx.restore();
}

function drawFlowArrow(
  ctx: CanvasRenderingContext2D,
  port: ConnectionPort,
  pos: EquipmentPortWorldPosition,
  color: string,
  zoom: number
): void {
  const edge = edgeVector(port.edge);
  const flow = resolvePortFlow(port);
  const dir = flow.direction === 'in' ? { x: -edge.x, y: -edge.y } : edge;
  if (flow.direction === 'both') {
    return;
  }

  const size = 5 / zoom;
  const offset = 14 / zoom;
  const tip = { x: pos.x + dir.x * (offset + size), y: pos.y + dir.y * (offset + size) };
  const base = { x: pos.x + dir.x * offset, y: pos.y + dir.y * offset };
  const perp = { x: -dir.y, y: dir.x };

  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(base.x + perp.x * size, base.y + perp.y * size);
  ctx.lineTo(base.x - perp.x * size, base.y - perp.y * size);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function edgeVector(edge: ConnectionPort['edge']): { x: number; y: number } {
  switch (edge) {
    case 'north':
      return { x: 0, y: -1 };
    case 'south':
      return { x: 0, y: 1 };
    case 'east':
      return { x: 1, y: 0 };
    case 'west':
      return { x: -1, y: 0 };
  }
}
