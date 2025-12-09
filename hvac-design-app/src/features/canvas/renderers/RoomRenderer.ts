import type { Room } from '@/core/schema';

/**
 * Render context for entity rendering
 */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  zoom: number;
  isSelected: boolean;
  isHovered: boolean;
}

/**
 * Room colors
 */
const ROOM_COLORS = {
  fill: '#E3F2FD',
  stroke: '#1976D2',
  selectedStroke: '#1565C0',
  selectedFill: 'rgba(25, 118, 210, 0.1)',
  text: '#1976D2',
  dimensions: '#666666',
};

/**
 * Render a room entity on the canvas
 */
export function renderRoom(room: Room, context: RenderContext): void {
  const { ctx, zoom, isSelected, isHovered } = context;
  const { width, length, name } = room.props;

  ctx.save();

  // Draw room fill
  ctx.fillStyle = isSelected ? ROOM_COLORS.selectedFill : ROOM_COLORS.fill;
  ctx.fillRect(0, 0, width, length);

  // Draw room border
  ctx.strokeStyle = isSelected ? ROOM_COLORS.selectedStroke : ROOM_COLORS.stroke;
  ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;
  ctx.strokeRect(0, 0, width, length);

  // Draw room name label
  const fontSize = Math.max(12 / zoom, 10);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = ROOM_COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, width / 2, length / 2);

  // Show dimensions on hover or select
  if (isHovered || isSelected) {
    const dimFontSize = Math.max(10 / zoom, 8);
    ctx.font = `${dimFontSize}px sans-serif`;
    ctx.fillStyle = ROOM_COLORS.dimensions;

    // Width dimension (bottom)
    const widthFt = (width / 12).toFixed(1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${widthFt}'`, width / 2, length + 4 / zoom);

    // Height dimension (right)
    const lengthFt = (length / 12).toFixed(1);
    ctx.save();
    ctx.translate(width + 4 / zoom, length / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${lengthFt}'`, 0, 0);
    ctx.restore();
  }

  // Draw resize handles when selected
  if (isSelected) {
    renderResizeHandles(ctx, width, length, zoom);
  }

  ctx.restore();
}

/**
 * Render resize handles for a selected room
 */
function renderResizeHandles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number
): void {
  const handleSize = 8 / zoom;
  const halfHandle = handleSize / 2;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#1976D2';
  ctx.lineWidth = 1 / zoom;

  // Corner handles
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
  ];

  for (const corner of corners) {
    ctx.fillRect(corner.x - halfHandle, corner.y - halfHandle, handleSize, handleSize);
    ctx.strokeRect(corner.x - halfHandle, corner.y - halfHandle, handleSize, handleSize);
  }

  // Edge handles
  const edges = [
    { x: width / 2, y: 0 },
    { x: width / 2, y: height },
    { x: 0, y: height / 2 },
    { x: width, y: height / 2 },
  ];

  for (const edge of edges) {
    ctx.fillRect(edge.x - halfHandle, edge.y - halfHandle, handleSize, handleSize);
    ctx.strokeRect(edge.x - halfHandle, edge.y - halfHandle, handleSize, handleSize);
  }
}

export default renderRoom;
