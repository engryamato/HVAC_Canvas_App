import type { Duct } from '@/core/schema';
import type { RenderContext } from './RoomRenderer';
import { ProfessionalRenderingHelper } from '../utils';
import { canvasPerformanceService } from '../services';

/**
 * Duct colors
 */
const DUCT_COLORS = {
  round: {
    stroke: '#424242',
    selectedStroke: '#1976D2',
  },
  rectangular: {
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
  const { shape, length, airflow, name, insulated, insulationThickness } = duct.props;
  
  // Convert length from feet to pixels (12 inches per foot)
  const lengthPixels = length * 12;

  const helper = new ProfessionalRenderingHelper(ctx, zoom);
  const perfHints = canvasPerformanceService.getPerformanceHints();

  ctx.save();

  // Determine standard properties based on shape
  let width: number;
  if (shape === 'round') {
    width = 'diameter' in duct.props ? (duct.props.diameter ?? 12) : 12;
  } else {
    width = 'width' in duct.props ? (duct.props.width ?? 12) : 12;
  }

  const color = isSelected 
    ? (shape === 'round' ? DUCT_COLORS.round.selectedStroke : DUCT_COLORS.rectangular.selectedStroke)
    : (shape === 'round' ? DUCT_COLORS.round.stroke : DUCT_COLORS.rectangular.stroke);

  const weight = isSelected ? 3 : 2;

  // 1. Draw Insulation Hatching (if enabled and efficient)
  if (insulated && perfHints.enableHatching) {
    const hatchThickness = insulationThickness ? Math.max(insulationThickness, 1) : 1;
    // For rectangular ducts, we hatch the top surface if viewed from top
    // For now, simpler approximation: Fill the duct area with hatching
    // Offset y by -width/2 because standard drawing is centered on line
    
    helper.drawHatching(
      { x: 0, y: -width / 2, width: lengthPixels, height: width },
      hatchThickness, // hatch line thickness
      45 // angle
    );
  }

  // 2. Draw Double Lines (Main Body)
  // Top line
  // Start point is (0, -width/2) effectively for the top wall relative to centerline?
  // helper.drawDoubleLine draws *around* the centerline defined by start->end.
  // So we pass the centerline (0,0) to (length,0) and the full width.
  
  // NOTE: isSelected highlights BOTH lines.
  const lineOptions = {
    color,
    weight,
    style: 'solid' as const,
  };

  helper.drawDoubleLine(
    { x: 0, y: 0 },
    { x: lengthPixels, y: 0 },
    width,
    lineOptions
  );

  // 3. Draw Centerline (Round Ducts only)
  if (shape === 'round') {
    // Only draw centerline if detail level permits or always? Standards say yes.
    // Use lighter weight for centerline
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 / zoom;
    helper.setLineStyle('centerline');
    ctx.moveTo(0, 0);
    ctx.lineTo(lengthPixels, 0);
    ctx.stroke();
    helper.setLineStyle('solid'); // Reset
  }

  // 4. Draw Flanges at ends
  // Flange is a line perpendicular to duct at start and end
  // Length usually extends slightly beyond width, or matches width. SMACNA often shows them matching or slightly sticking out.
  // Let's make them match width for cleanliness + 2px extra (1px each side)
  const flangeHalfHeight = (width / 2) + (2 / zoom);
  
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / zoom;
  
  // Start Flange
  ctx.moveTo(0, -flangeHalfHeight);
  ctx.lineTo(0, flangeHalfHeight);
  
  // End Flange
  ctx.moveTo(lengthPixels, -flangeHalfHeight);
  ctx.lineTo(lengthPixels, flangeHalfHeight);
  
  ctx.stroke();

  // 5. Draw airflow direction arrow
  renderAirflowArrow(ctx, lengthPixels, zoom, airflow, DUCT_COLORS.arrow, DUCT_COLORS.text);

  // 6. Draw duct label
  renderDuctLabel(ctx, name, duct.props, lengthPixels, zoom, DUCT_COLORS.text);

  ctx.restore();
}

/**
 * Render airflow direction arrow
 */
function renderAirflowArrow(
  ctx: CanvasRenderingContext2D,
  lengthPixels: number,
  zoom: number,
  airflow: number,
  arrowColor: string,
  textColor: string
): void {
  const arrowX = lengthPixels * 0.7;
  const arrowSize = Math.min(12 / zoom, 10);

  ctx.fillStyle = arrowColor;
  ctx.beginPath();
  ctx.moveTo(arrowX, 0);
  ctx.lineTo(arrowX - arrowSize, -arrowSize / 2);
  ctx.lineTo(arrowX - arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();

  // Draw CFM label near arrow
  const fontSize = Math.max(9 / zoom, 7);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = textColor;
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
  zoom: number,
  textColor: string
): void {
  const fontSize = Math.max(10 / zoom, 8);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = textColor;
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
