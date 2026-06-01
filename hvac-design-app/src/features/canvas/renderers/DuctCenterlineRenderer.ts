import type { Duct, DuctRun } from '@/core/schema';
import { getDuctCenterline } from '../services/connectionPoints';

/**
 * Draws the authored (uncut) design centerline for a duct/run as a world-space
 * overlay. Toggled by the "Show Centerline" preference. The centerline is the
 * reference used for angle detection, fitting placement, and cutback, so showing
 * it lets the user see the true geometry independent of any applied cutback.
 *
 * Must be called in WORLD space (no per-entity transform active), since the
 * design centerline points are world coordinates.
 */
const CENTERLINE_COLOR = '#D81B60'; // magenta — distinct from duct + fitting blues
const NODE_COLOR = '#AD1457';

export function renderDuctCenterline(ctx: CanvasRenderingContext2D, duct: Duct | DuctRun, zoom: number): void {
  const { start, end } = getDuctCenterline(duct);

  ctx.save();
  ctx.strokeStyle = CENTERLINE_COLOR;
  ctx.lineWidth = 1.2 / zoom;
  ctx.setLineDash([7 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = NODE_COLOR;
  const r = 2.5 / zoom;
  for (const point of [start, end]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export default renderDuctCenterline;
