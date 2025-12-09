import type { Duct } from '@/core/schema';
import type { RenderContext } from './RoomRenderer';

/**
 * Duct colors
 */
const DUCT_COLORS = {
  round: {
    fill: '#E0E0E0',
    stroke: '#424242',
    selectedStroke: '#1976D2',
  },
  rectangular: {
    fill: '#EEEEEE',
    stroke: '#616161',
    selectedStroke: '#1976D2',
  },
  arrow: '#757575',
  text: '#424242',
};

/**
 * Render a duct entity on the canvas
 */
export function renderDuct(duct: Duct, context: RenderContext): void {
  const { ctx, zoom, isSelected } = context;
  const { shape, length, airflow, name } = duct.props;

  // Convert length from feet to pixels (12 inches per foot)
  const lengthPixels = length * 12;

  ctx.save();

  if (shape === 'round') {
    renderRoundDuct(ctx, duct, lengthPixels, zoom, isSelected);
  } else {
    renderRectangularDuct(ctx, duct, lengthPixels, zoom, isSelected);
  }

  // Draw airflow direction arrow
  renderAirflowArrow(ctx, lengthPixels, zoom, airflow);

  // Draw duct label
  renderDuctLabel(ctx, name, duct.props, lengthPixels, zoom);

  ctx.restore();
}

/**
 * Render a round duct
 */
function renderRoundDuct(
  ctx: CanvasRenderingContext2D,
  duct: Duct,
  lengthPixels: number,
  zoom: number,
  isSelected: boolean
): void {
  const diameter = 'diameter' in duct.props ? (duct.props.diameter ?? 12) : 12;
  const halfDiameter = diameter / 2;

  ctx.fillStyle = DUCT_COLORS.round.fill;
  ctx.strokeStyle = isSelected ? DUCT_COLORS.round.selectedStroke : DUCT_COLORS.round.stroke;
  ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

  // Draw duct as a rounded rectangle (simulating round duct in 2D)
  ctx.beginPath();
  ctx.roundRect(-halfDiameter, -halfDiameter, lengthPixels + diameter, diameter, halfDiameter);
  ctx.fill();
  ctx.stroke();
}

/**
 * Render a rectangular duct
 */
function renderRectangularDuct(
  ctx: CanvasRenderingContext2D,
  duct: Duct,
  lengthPixels: number,
  zoom: number,
  isSelected: boolean
): void {
  const width = 'width' in duct.props ? (duct.props.width ?? 12) : 12;
  const halfWidth = width / 2;

  ctx.fillStyle = DUCT_COLORS.rectangular.fill;
  ctx.strokeStyle = isSelected
    ? DUCT_COLORS.rectangular.selectedStroke
    : DUCT_COLORS.rectangular.stroke;
  ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

  ctx.fillRect(0, -halfWidth, lengthPixels, width);
  ctx.strokeRect(0, -halfWidth, lengthPixels, width);
}

/**
 * Render airflow direction arrow
 */
function renderAirflowArrow(
  ctx: CanvasRenderingContext2D,
  lengthPixels: number,
  zoom: number,
  airflow: number
): void {
  const arrowX = lengthPixels * 0.7;
  const arrowSize = Math.min(12 / zoom, 10);

  ctx.fillStyle = DUCT_COLORS.arrow;
  ctx.beginPath();
  ctx.moveTo(arrowX, 0);
  ctx.lineTo(arrowX - arrowSize, -arrowSize / 2);
  ctx.lineTo(arrowX - arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();

  // Draw CFM label near arrow
  const fontSize = Math.max(9 / zoom, 7);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = DUCT_COLORS.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${airflow} CFM`, arrowX + 4 / zoom, 0);
}

/**
 * Render duct size label
 */
function renderDuctLabel(
  ctx: CanvasRenderingContext2D,
  name: string,
  props: Duct['props'],
  lengthPixels: number,
  zoom: number
): void {
  const fontSize = Math.max(10 / zoom, 8);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = DUCT_COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // Size label
  let sizeLabel: string;
  if (props.shape === 'round' && 'diameter' in props) {
    sizeLabel = `${props.diameter}"Ø`;
  } else if ('width' in props && 'height' in props) {
    sizeLabel = `${props.width}"×${props.height}"`;
  } else {
    sizeLabel = '';
  }

  ctx.fillText(`${name} (${sizeLabel})`, lengthPixels / 2, -8 / zoom);
}

export default renderDuct;
