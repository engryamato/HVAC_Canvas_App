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
 * SMACNA / CAD plan-style fitting rendering.
 *
 * Visual goals (ductwork wrap-up pass):
 *  - Walls continue the duct double-line look exactly: same stroke color and
 *    weight as the duct renderer, opaque white sheet-metal fill that cleanly
 *    covers the duct lines underneath.
 *  - Multi-part bodies (tee main + branch, wye body + cone) render as ONE
 *    merged outline: every part is stroked at double width first, then every
 *    part is filled, leaving a uniform half-width outline only on the true
 *    perimeter of the union — no wall lines crossing branch openings.
 *  - A transverse joint line is drawn across each opening (the connection
 *    seam), like the flange/joint marks on professional plan drawings.
 *  - Connection points get a compact port marker instead of the old dashed
 *    debug bubble + text label.
 */
const FITTING_COLORS = {
  stroke: '#424242', // matches DUCT_COLORS.round.stroke for seamless walls
  selectedStroke: '#1976D2',
  fill: '#FFFFFF',
  text: '#424242',
  centerline: '#90A4AE', // muted blue-grey CAD centerline
  joint: '#424242',
  port: '#1976D2',
};

/** Wall weight (screen px) — matches the duct renderer's double-line weight. */
const WALL_WEIGHT = 2;
const SELECTED_WALL_WEIGHT = 3;

export function renderFitting(fitting: Fitting, context: RenderContext): void {
  const { ctx, zoom, isSelected, entitiesById = {}, showFittingLabels = false } = context;
  const geometry = buildFittingGeometry(fitting);
  const stroke = isSelected ? FITTING_COLORS.selectedStroke : FITTING_COLORS.stroke;
  const weight = (isSelected ? SELECTED_WALL_WEIGHT : WALL_WEIGHT) / zoom;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawBodyUnion(ctx, geometry.body, stroke, weight);
  drawCenterlines(ctx, geometry.centerlines, zoom);
  drawAccents(ctx, geometry.accents, stroke, zoom);
  drawOpenings(ctx, geometry.openings, stroke, weight, zoom, isSelected);

  if (showFittingLabels) {
    renderFittingLabel(ctx, deriveDynamicFittingSymbol(fitting, entitiesById), zoom);
  }

  ctx.restore();
}

/**
 * Render all closed body parts as a merged silhouette:
 *  pass 1 — stroke every closed part at 2× wall weight;
 *  pass 2 — fill every closed part with opaque white.
 * The fill covers the inner half of every stroke plus any stroke segment that
 * crosses another part (e.g. the tee main wall through the branch root), so
 * exactly one uniform wall line survives around the union perimeter. Open
 * parts (quad transition walls) are stroked normally afterwards.
 */
function drawBodyUnion(
  ctx: CanvasRenderingContext2D,
  parts: FittingGeometry['body'],
  stroke: string,
  weight: number
): void {
  const closed = parts.filter(isClosedPart);
  const open = parts.filter((part) => !isClosedPart(part));

  ctx.strokeStyle = stroke;
  ctx.lineWidth = weight * 2;
  for (const part of closed) {
    tracePart(ctx, part);
    ctx.stroke();
  }

  ctx.fillStyle = FITTING_COLORS.fill;
  for (const part of closed) {
    tracePart(ctx, part);
    ctx.fill();
  }

  // Stroke-only parts drawn at normal weight on top of the filled body.
  ctx.lineWidth = weight;
  for (const part of open) {
    tracePart(ctx, part);
    ctx.stroke();
  }
}

function isClosedPart(part: FittingBodyPart): boolean {
  if (part.kind === 'quad') {
    return false;
  }
  if ((part.kind === 'polygon' || part.kind === 'circle') && part.fill === false) {
    return false;
  }
  return true;
}

function tracePart(ctx: CanvasRenderingContext2D, part: FittingBodyPart): void {
  ctx.beginPath();
  switch (part.kind) {
    case 'polygon': {
      if (part.points.length === 0) {
        return;
      }
      ctx.moveTo(part.points[0].x, part.points[0].y);
      for (let i = 1; i < part.points.length; i += 1) {
        ctx.lineTo(part.points[i].x, part.points[i].y);
      }
      ctx.closePath();
      break;
    }
    case 'arcBand': {
      ctx.arc(part.center.x, part.center.y, part.outerRadius, part.startAngle, part.endAngle);
      ctx.arc(part.center.x, part.center.y, part.innerRadius, part.endAngle, part.startAngle, true);
      ctx.closePath();
      break;
    }
    case 'circle': {
      ctx.arc(part.center.x, part.center.y, part.radius, 0, Math.PI * 2);
      break;
    }
    case 'quad': {
      ctx.moveTo(part.from.x, part.from.y);
      ctx.quadraticCurveTo(part.control.x, part.control.y, part.to.x, part.to.y);
      break;
    }
  }
}

function drawCenterlines(
  ctx: CanvasRenderingContext2D,
  centerlines: FittingGeometry['centerlines'],
  zoom: number
): void {
  if (centerlines.length === 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = FITTING_COLORS.centerline;
  ctx.lineWidth = 1 / zoom;
  // CAD center-line dash: long-short-long.
  ctx.setLineDash([10 / zoom, 3 / zoom, 2 / zoom, 3 / zoom]);
  ctx.beginPath();
  for (const line of centerlines) {
    ctx.moveTo(line.from.x, line.from.y);
    ctx.lineTo(line.to.x, line.to.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawAccents(
  ctx: CanvasRenderingContext2D,
  accents: FittingGeometry['accents'],
  stroke: string,
  zoom: number
): void {
  if (accents.length === 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6 / zoom;
  ctx.beginPath();
  for (const line of accents) {
    ctx.moveTo(line.from.x, line.from.y);
    ctx.lineTo(line.to.x, line.to.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawOpenings(
  ctx: CanvasRenderingContext2D,
  openings: FittingOpening[],
  stroke: string,
  weight: number,
  zoom: number,
  isSelected: boolean
): void {
  for (const opening of openings) {
    drawJointLine(ctx, opening, stroke, weight);
    drawPortMarker(ctx, opening, zoom, isSelected);
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

/**
 * Transverse joint line across the opening — the connection seam where the
 * duct meets the fitting, slightly wider than the opening like a drawn flange.
 */
function drawJointLine(
  ctx: CanvasRenderingContext2D,
  opening: FittingOpening,
  stroke: string,
  weight: number
): void {
  const { x, y } = opening.position;
  const half = portOpeningSize(opening) / 2 + weight; // slight flange overhang
  const px = -opening.direction.y;
  const py = opening.direction.x;

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = weight * 1.4;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x - px * half, y - py * half);
  ctx.lineTo(x + px * half, y + py * half);
  ctx.stroke();
  ctx.restore();
}

/**
 * Compact magnetic-port marker: a small white-filled ring with a colored core.
 * Screen-constant size, no dashed halo, no text label — legible without
 * looking like debug overlay. Slightly larger when the fitting is selected.
 */
function drawPortMarker(
  ctx: CanvasRenderingContext2D,
  opening: FittingOpening,
  zoom: number,
  isSelected: boolean
): void {
  const { x, y } = opening.position;
  const ringR = (isSelected ? 5 : 4) / zoom;
  const coreR = (isSelected ? 2.2 : 1.8) / zoom;

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = FITTING_COLORS.port;
  ctx.lineWidth = 1.2 / zoom;
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = FITTING_COLORS.port;
  ctx.beginPath();
  ctx.arc(x, y, coreR, 0, Math.PI * 2);
  ctx.fill();
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
