import type { Fitting } from '@/core/schema';
import { ProfessionalRenderingHelper } from '../utils';
import type { RenderContext } from './RoomRenderer';
import {
  deriveDynamicFittingSymbol,
  type DynamicBranchFittingProps,
  type DynamicFittingSymbolSpec,
  type DynamicRectToRoundFittingProps,
  type DynamicSingleSizeFittingProps,
} from './fittingSymbolModel';

const FITTING_COLORS = {
  stroke: '#2E7D32',
  selectedStroke: '#1565C0',
  fill: 'rgba(232, 245, 233, 0.9)',
  text: '#1B5E20',
};

export function renderFitting(fitting: Fitting, context: RenderContext): void {
  const { ctx, zoom, isSelected, entitiesById = {}, showFittingLabels = false, backgroundColor = '#ffffff' } = context;
  const helper = new ProfessionalRenderingHelper(ctx, zoom);
  const spec = deriveDynamicFittingSymbol(fitting, entitiesById);
  const stroke = isSelected ? FITTING_COLORS.selectedStroke : FITTING_COLORS.stroke;

  ctx.save();
  renderOverlapMask(ctx, spec, backgroundColor);
  ctx.strokeStyle = stroke;
  ctx.fillStyle = FITTING_COLORS.fill;
  ctx.lineWidth = (isSelected ? 2.5 : 2) / zoom;

  switch (spec.kind) {
    case 'elbow_90':
      helper.drawElbow({ x: 0, y: 0 }, spec.props.size * 1.4, 90, spec.props.size);
      break;
    case 'elbow_45':
      helper.drawElbow({ x: 0, y: 0 }, spec.props.size * 1.6, 45, spec.props.size);
      break;
    case 'elbow_mitered':
      drawMiteredElbow(ctx, spec.props, zoom);
      break;
    case 'reducer':
      helper.drawReducer({ x: -28, y: 0 }, { x: 28, y: 0 }, spec.props.inletSize, spec.props.outletSize);
      drawEndTicks(ctx, zoom, [-28, 28], [spec.props.inletSize, spec.props.outletSize], stroke);
      break;
    case 'tee':
      drawTee(ctx, helper, spec.props, zoom, stroke);
      break;
    case 'wye':
      drawWye(ctx, spec.props, zoom, stroke);
      break;
    case 'end_cap':
      drawEndCap(ctx, spec.props, zoom, stroke);
      break;
    case 'rect_to_round':
      drawRectToRound(ctx, spec.props, zoom, stroke);
      break;
    case 'offset':
      drawOffset(ctx, spec.props, zoom, stroke);
      break;
  }

  if (showFittingLabels) {
    renderFittingLabel(ctx, spec, zoom);
  }

  ctx.restore();
}

function renderOverlapMask(
  ctx: CanvasRenderingContext2D,
  spec: DynamicFittingSymbolSpec,
  backgroundColor: string
): void {
  const halfSize = getFittingMaskHalfSize(spec) + 4;
  ctx.save();
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
  ctx.restore();
}

function getFittingMaskHalfSize(spec: DynamicFittingSymbolSpec): number {
  switch (spec.kind) {
    case 'reducer':
      return Math.max(spec.props.inletSize, spec.props.outletSize, 56) / 2;
    case 'tee':
    case 'wye':
      return Math.max(spec.props.mainSize, spec.props.branchSize, 64) / 2;
    case 'rect_to_round':
      return Math.max(spec.props.rectWidth, spec.props.rectHeight, spec.props.roundSize, 64) / 2;
    default:
      return Math.max(spec.props.size, 40) / 2;
  }
}

function drawMiteredElbow(
  ctx: CanvasRenderingContext2D,
  props: DynamicSingleSizeFittingProps,
  zoom: number
): void {
  const half = props.size / 2;
  ctx.beginPath();
  ctx.moveTo(-half, half);
  ctx.lineTo(10, half);
  ctx.lineTo(26, half);
  ctx.lineTo(26, -4);
  ctx.lineTo(half, -4);
  ctx.lineTo(half, -30 - half);
  ctx.lineTo(-4, -30 - half);
  ctx.lineTo(-4, -half);
  ctx.lineTo(-half, -half);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(26, half);
  ctx.lineTo(-4, -half);
  ctx.stroke();

  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([10 / zoom, 5 / zoom, 2 / zoom, 5 / zoom]);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(16, 0);
  ctx.lineTo(16, -20);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTee(
  ctx: CanvasRenderingContext2D,
  helper: ProfessionalRenderingHelper,
  props: DynamicBranchFittingProps,
  zoom: number,
  stroke: string
): void {
  helper.drawTee({ x: 0, y: 0 }, props.mainSize, 'top');
  const branchHalf = props.branchSize / 2;
  ctx.beginPath();
  ctx.moveTo(-branchHalf, 0);
  ctx.lineTo(branchHalf, 0);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.25 / zoom;
  ctx.stroke();
}

function drawWye(
  ctx: CanvasRenderingContext2D,
  props: DynamicBranchFittingProps,
  zoom: number,
  stroke: string
): void {
  const mainHalf = props.mainSize / 2;
  const branchHalf = props.branchSize / 2;
  ctx.beginPath();
  ctx.moveTo(-32, -mainHalf);
  ctx.lineTo(0, -mainHalf);
  ctx.lineTo(28, -26 - branchHalf);
  ctx.lineTo(48, -26 - branchHalf);
  ctx.lineTo(20, -mainHalf);
  ctx.lineTo(52, -mainHalf);
  ctx.lineTo(52, mainHalf);
  ctx.lineTo(-32, mainHalf);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, mainHalf);
  ctx.lineTo(48, -26 + branchHalf);
  ctx.lineTo(28, -26 + branchHalf);
  ctx.lineTo(0, mainHalf);
  ctx.stroke();
}

function drawEndCap(
  ctx: CanvasRenderingContext2D,
  props: DynamicSingleSizeFittingProps,
  zoom: number,
  stroke: string
): void {
  const half = props.size / 2;
  ctx.beginPath();
  ctx.rect(-32, -half, 44, props.size);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(12, -half - 2 / zoom);
  ctx.lineTo(12, half + 2 / zoom);
  ctx.lineWidth = 3 / zoom;
  ctx.stroke();
}

function drawRectToRound(
  ctx: CanvasRenderingContext2D,
  props: DynamicRectToRoundFittingProps,
  zoom: number,
  stroke: string
): void {
  const rectHalf = props.rectHeight / 2;
  const rectWidth = Math.max(props.rectWidth * 1.6, 20);
  const roundRadius = props.roundSize / 2;

  ctx.beginPath();
  ctx.rect(-42, -rectHalf, rectWidth, props.rectHeight);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-42 + rectWidth, -rectHalf);
  ctx.quadraticCurveTo(-4, -rectHalf, 20 - roundRadius, -roundRadius);
  ctx.moveTo(-42 + rectWidth, rectHalf);
  ctx.quadraticCurveTo(-4, rectHalf, 20 - roundRadius, roundRadius);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(20, 0, roundRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawOffset(
  ctx: CanvasRenderingContext2D,
  props: DynamicSingleSizeFittingProps,
  zoom: number,
  stroke: string
): void {
  const half = props.size / 2;
  ctx.beginPath();
  ctx.moveTo(-42, 10 - half);
  ctx.lineTo(-14, 10 - half);
  ctx.lineTo(16, -10 - half);
  ctx.lineTo(42, -10 - half);
  ctx.lineTo(42, -10 + half);
  ctx.lineTo(16, -10 + half);
  ctx.lineTo(-14, 10 + half);
  ctx.lineTo(-42, 10 + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();
}

function drawEndTicks(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  xPositions: [number, number],
  widths: [number, number],
  stroke: string
): void {
  ctx.beginPath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2 / zoom;
  ctx.moveTo(xPositions[0], -widths[0] / 2 - 2 / zoom);
  ctx.lineTo(xPositions[0], widths[0] / 2 + 2 / zoom);
  ctx.moveTo(xPositions[1], -widths[1] / 2 - 2 / zoom);
  ctx.lineTo(xPositions[1], widths[1] / 2 + 2 / zoom);
  ctx.stroke();
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
