import type { Fitting } from '@/core/schema';
import type { RenderContext } from './RoomRenderer';
import { deriveDynamicFittingSymbol, type DynamicFittingSymbolSpec } from './fittingSymbolModel';
import {
  buildFittingGeometry,
  type FittingBodyPart,
  type FittingGeometry,
  type FittingOpening,
} from '../services/connectionPoints';

/**
 * Fitting visual colors — dark charcoal palette matching the duct renderer.
 * Normal stroke is near-black #2D2D2D, selected is blue #1976D2. Fill is
 * near-white so the fitting body cleanly covers underlying duct lines.
 */
const FITTING_COLORS = {
  stroke: '#2D2D2D',
  selectedStroke: '#1976D2',
  fill: 'rgba(255, 255, 255, 0.92)',
  text: '#424242',
  centerline: '#1565C0',
  magneticPoint: '#1976D2',
};

/**
 * Render a fitting entirely from its shared parametric geometry (PR-8). Body,
 * centerlines, accents, opening end-lines, and magnetic markers all derive from
 * the same `buildFittingGeometry` output the resolver uses for snapping, so the
 * drawn openings line up exactly with the magnetic ports and connected ducts.
 */
export function renderFitting(fitting: Fitting, context: RenderContext): void {
  const { ctx, zoom, isSelected, entitiesById = {}, showFittingLabels = false } = context;
  const geometry = buildFittingGeometry(fitting);
  const stroke = isSelected ? FITTING_COLORS.selectedStroke : FITTING_COLORS.stroke;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawBody(ctx, geometry.body, stroke, zoom, isSelected);
  drawCenterlines(ctx, geometry.centerlines, zoom);
  drawAccents(ctx, geometry.accents, stroke, zoom);
  drawOpenings(ctx, geometry.openings, zoom);

  if (showFittingLabels) {
    renderFittingLabel(ctx, deriveDynamicFittingSymbol(fitting, entitiesById), zoom);
  }

  ctx.restore();
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  parts: FittingGeometry['body'],
  stroke: string,
  zoom: number,
  isSelected: boolean
): void {
  ctx.fillStyle = FITTING_COLORS.fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = (isSelected ? 2.5 : 2) / zoom;

  for (const part of parts) {
    drawBodyPart(ctx, part);
  }
}

function drawBodyPart(ctx: CanvasRenderingContext2D, part: FittingBodyPart): void {
  switch (part.kind) {
    case 'polygon': {
      if (part.points.length === 0) {
        return;
      }
      ctx.beginPath();
      ctx.moveTo(part.points[0].x, part.points[0].y);
      for (let i = 1; i < part.points.length; i += 1) {
        ctx.lineTo(part.points[i].x, part.points[i].y);
      }
      ctx.closePath();
      if (part.fill !== false) {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case 'arcBand': {
      ctx.beginPath();
      ctx.arc(part.center.x, part.center.y, part.outerRadius, part.startAngle, part.endAngle);
      ctx.arc(part.center.x, part.center.y, part.innerRadius, part.endAngle, part.startAngle, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'circle': {
      ctx.beginPath();
      ctx.arc(part.center.x, part.center.y, part.radius, 0, Math.PI * 2);
      if (part.fill !== false) {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case 'quad': {
      ctx.beginPath();
      ctx.moveTo(part.from.x, part.from.y);
      ctx.quadraticCurveTo(part.control.x, part.control.y, part.to.x, part.to.y);
      ctx.stroke();
      break;
    }
  }
}

function drawCenterlines(ctx: CanvasRenderingContext2D, centerlines: FittingGeometry['centerlines'], zoom: number): void {
  if (centerlines.length === 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = FITTING_COLORS.centerline;
  ctx.lineWidth = 1.2 / zoom;
  ctx.setLineDash([8 / zoom, 5 / zoom]);
  ctx.beginPath();
  for (const line of centerlines) {
    ctx.moveTo(line.from.x, line.from.y);
    ctx.lineTo(line.to.x, line.to.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawAccents(ctx: CanvasRenderingContext2D, accents: FittingGeometry['accents'], stroke: string, zoom: number): void {
  if (accents.length === 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  for (const line of accents) {
    ctx.moveTo(line.from.x, line.from.y);
    ctx.lineTo(line.to.x, line.to.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawOpenings(ctx: CanvasRenderingContext2D, openings: FittingOpening[], zoom: number): void {
  for (const opening of openings) {
    drawPortEndLine(ctx, opening, zoom);
    drawMagneticPortMarker(ctx, opening, zoom);
  }
}

function portOpeningSize(opening: FittingOpening): number {
  const profile = opening.profile;
  if (!profile) {
    return 12;
  }
  if (profile.shape === 'round' || profile.shape === 'flexible') {
    return profile.diameter ?? 12;
  }
  if (profile.shape === 'rectangular' || profile.shape === 'flat_oval') {
    return profile.height ?? profile.width ?? 12;
  }
  return 12;
}

function drawPortEndLine(ctx: CanvasRenderingContext2D, opening: FittingOpening, zoom: number): void {
  const { x, y } = opening.position;
  const half = portOpeningSize(opening) / 2;
  // Perpendicular to the facing direction — a straight top-view end line.
  const px = -opening.direction.y;
  const py = opening.direction.x;

  ctx.save();
  ctx.strokeStyle = FITTING_COLORS.stroke;
  ctx.lineWidth = 2.4 / zoom;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - px * half, y - py * half);
  ctx.lineTo(x + px * half, y + py * half);
  ctx.stroke();
  ctx.restore();
}

function drawMagneticPortMarker(ctx: CanvasRenderingContext2D, opening: FittingOpening, zoom: number): void {
  const { x, y } = opening.position;
  const dir = opening.direction;
  const mag = FITTING_COLORS.magneticPoint;
  // Marker radii are screen-constant (divided by zoom) so they stay legible at
  // any scale, while the end line above stays geometry-scale.
  const outerR = 14 / zoom;
  const midR = 6 / zoom;
  const coreR = 2.5 / zoom;

  ctx.save();

  ctx.fillStyle = 'rgba(25, 118, 210, 0.06)';
  ctx.strokeStyle = mag;
  ctx.lineWidth = 1.3 / zoom;
  ctx.setLineDash([5 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.arc(x, y, outerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(25, 118, 210, 0.20)';
  ctx.lineWidth = 1.8 / zoom;
  ctx.beginPath();
  ctx.arc(x, y, midR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = mag;
  ctx.beginPath();
  ctx.arc(x, y, coreR, 0, Math.PI * 2);
  ctx.fill();

  const labelOffset = outerR + 8 / zoom;
  ctx.fillStyle = mag;
  ctx.font = `${9 / zoom}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opening.id, x + dir.x * labelOffset, y + dir.y * labelOffset);

  ctx.restore();
}

function renderFittingLabel(ctx: CanvasRenderingContext2D, spec: DynamicFittingSymbolSpec, zoom: number): void {
  ctx.save();
  ctx.font = `${Math.max(9 / zoom, 8)}px sans-serif`;
  ctx.fillStyle = FITTING_COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  switch (spec.kind) {
    case 'reducer':
      ctx.fillText(`${spec.props.inletLabel} to ${spec.props.outletLabel}`, 0, -26 / zoom);
      break;
    case 'tee':
    case 'wye':
      ctx.fillText(`${spec.props.mainLabel} / ${spec.props.branchLabel}`, 0, -26 / zoom);
      break;
    case 'rect_to_round':
      ctx.fillText(`${spec.props.rectLabel} to ${spec.props.roundLabel}`, 0, -26 / zoom);
      break;
    default:
      ctx.fillText(spec.props.label, 0, -26 / zoom);
      break;
  }

  ctx.restore();
}

export default renderFitting;
