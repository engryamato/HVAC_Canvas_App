import type { Equipment } from '@/core/schema';
import type { RenderContext } from '../RoomRenderer';

export function renderRTUSymbol(equipment: Equipment, context: RenderContext): void {
  const { ctx, zoom, isSelected } = context;
  const { width, depth, name } = equipment.props;

  drawBody(ctx, width, depth, zoom, isSelected);
  drawTag(ctx, width, depth, name, zoom);

  if (zoom < 0.4) {
    return;
  }

  drawPlenums(ctx, width, depth, zoom);

  if (zoom < 0.8) {
    return;
  }

  drawInternalSections(ctx, width, depth, zoom);
}

function drawBody(ctx: CanvasRenderingContext2D, width: number, depth: number, zoom: number, isSelected: boolean): void {
  ctx.fillStyle = '#E0F7FA';
  ctx.strokeStyle = isSelected ? '#1976D2' : '#006064';
  ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;
  ctx.fillRect(0, 0, width, depth);
  ctx.strokeRect(0, 0, width, depth);

  ctx.setLineDash([5 / zoom, 5 / zoom]);
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1 / zoom;
  ctx.strokeRect(6 / zoom, 6 / zoom, Math.max(0, width - 12 / zoom), Math.max(0, depth - 12 / zoom));
  ctx.setLineDash([]);
}

function drawTag(ctx: CanvasRenderingContext2D, width: number, depth: number, name: string, zoom: number): void {
  ctx.font = `bold ${Math.max(10 / zoom, 8)}px sans-serif`;
  ctx.fillStyle = '#004D40';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, width / 2, depth / 2);
}

function drawPlenums(ctx: CanvasRenderingContext2D, width: number, depth: number, zoom: number): void {
  const plenumY = depth * 0.68;
  const plenumH = Math.max(depth * 0.18, 10 / zoom);
  const gap = width * 0.08;
  const plenumW = (width - gap * 3) / 2;

  ctx.lineWidth = 1 / zoom;
  ctx.strokeStyle = '#0F172A';

  ctx.fillStyle = 'rgba(46, 125, 50, 0.16)';
  ctx.fillRect(gap, plenumY, plenumW, plenumH);
  ctx.strokeRect(gap, plenumY, plenumW, plenumH);

  ctx.fillStyle = 'rgba(21, 101, 192, 0.16)';
  ctx.fillRect(gap * 2 + plenumW, plenumY, plenumW, plenumH);
  ctx.strokeRect(gap * 2 + plenumW, plenumY, plenumW, plenumH);
}

function drawInternalSections(ctx: CanvasRenderingContext2D, width: number, depth: number, zoom: number): void {
  const inset = 10 / zoom;
  const condenserY = depth * 0.16;
  const condenserH = depth * 0.22;

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.2 / zoom;
  ctx.strokeRect(inset, condenserY, width - inset * 2, condenserH);

  for (let x = inset + 6 / zoom; x < width - inset; x += 8 / zoom) {
    ctx.beginPath();
    ctx.moveTo(x, condenserY + condenserH - 4 / zoom);
    ctx.lineTo(x + 8 / zoom, condenserY + 4 / zoom);
    ctx.stroke();
  }

  const fanRadius = Math.max(Math.min(width, depth) * 0.055, 4 / zoom);
  for (const cx of [width * 0.4, width * 0.6]) {
    ctx.beginPath();
    ctx.arc(cx, condenserY + condenserH / 2, fanRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  const lowerY = depth * 0.45;
  ctx.strokeRect(inset, lowerY, width * 0.32, depth * 0.14);
  ctx.beginPath();
  ctx.arc(inset + width * 0.16, lowerY + depth * 0.07, Math.max(4 / zoom, depth * 0.035), 0, Math.PI * 2);
  ctx.stroke();

  const louverX = width * 0.5;
  ctx.strokeRect(louverX, lowerY, width * 0.36, depth * 0.14);
  for (let y = lowerY + 5 / zoom; y < lowerY + depth * 0.14; y += 5 / zoom) {
    ctx.beginPath();
    ctx.moveTo(louverX + 4 / zoom, y);
    ctx.lineTo(louverX + width * 0.36 - 4 / zoom, y);
    ctx.stroke();
  }
}
