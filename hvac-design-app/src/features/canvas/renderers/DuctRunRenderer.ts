import type { DuctEndType, DuctRun, DuctSegment, InsulationType } from '@/core/schema';
import type { RenderContext } from './RoomRenderer';
import { DuctRunGeometryService } from '../services/DuctRunGeometryService';
import { inchesToPixels } from '@/core/constants/coordinates';
import { canvasPerformanceService } from '../services';
import { ProfessionalRenderingHelper } from '../utils';

export function renderDuctRun(run: DuctRun, context: RenderContext): void {
  const { ctx, zoom, isSelected, isHovered, selectedSegmentIndexes = [], overlayColor } = context;
  const geometry = DuctRunGeometryService.getGeometry(run);
  const halfThickness = geometry.thicknessPx / 2;
  const helper = new ProfessionalRenderingHelper(ctx, zoom);
  const perfHints = canvasPerformanceService.getPerformanceHints();

  ctx.save();
  ctx.fillStyle = overlayColor ?? (isSelected ? 'rgba(25, 118, 210, 0.08)' : 'rgba(75, 85, 99, 0.04)');
  if (isHovered && !isSelected && !overlayColor) {
    ctx.fillStyle = 'rgba(75, 85, 99, 0.08)';
  }
  ctx.fillRect(0, -halfThickness, geometry.lengthPx, geometry.thicknessPx);

  for (const segmentGeometry of geometry.segmentGeometries) {
    const segmentStart = projectStation(geometry, segmentGeometry.start);
    const segmentEnd = projectStation(geometry, segmentGeometry.end);
    const settings = getSegmentRenderSettings(run, segmentGeometry.segment);
    const insulationThicknessPx = settings.insulationType ? inchesToPixels(settings.insulationThickness) : 0;

    if (settings.insulationType === 'wrap') {
      if (perfHints.enableHatching) {
        helper.drawWrapInsulation(segmentStart, segmentEnd, halfThickness, insulationThicknessPx, ctx, zoom);
      } else {
        drawInsulationFallback(ctx, segmentStart, segmentEnd, halfThickness, insulationThicknessPx, zoom, 'wrap');
      }
    }

    if (
      settings.insulationType === 'double_wall_perforated' ||
      settings.insulationType === 'double_wall_non_perforated'
    ) {
      if (perfHints.enableHatching) {
        helper.drawDoubleWallInsulation(
          segmentStart,
          segmentEnd,
          halfThickness,
          insulationThicknessPx,
          settings.insulationType === 'double_wall_perforated',
          ctx,
          zoom
        );
      } else {
        drawInsulationFallback(ctx, segmentStart, segmentEnd, halfThickness, insulationThicknessPx, zoom, settings.insulationType);
      }
    }

    if (selectedSegmentIndexes.includes(segmentGeometry.segment.index)) {
      ctx.fillStyle = 'rgba(25, 118, 210, 0.18)';
      ctx.fillRect(segmentStart, -halfThickness, segmentEnd - segmentStart, geometry.thicknessPx);
    }

    if (segmentGeometry.segment.index > 0) {
      const stationPx = segmentStart;
      const previousSegment = run.props.segments[segmentGeometry.segment.index - 1];
      const outerHalfThickness = Math.max(
        previousSegment ? getSegmentOuterHalfThickness(run, previousSegment, halfThickness, zoom) : halfThickness + 2 / zoom,
        getSegmentOuterHalfThickness(run, segmentGeometry.segment, halfThickness, zoom)
      );
      ctx.beginPath();
      ctx.moveTo(stationPx, -outerHalfThickness);
      ctx.lineTo(stationPx, outerHalfThickness);
      ctx.strokeStyle = isSelected ? '#1976D2' : '#6B7280';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
    }
  }

  ctx.beginPath();
  ctx.moveTo(0, -halfThickness);
  ctx.lineTo(geometry.lengthPx, -halfThickness);
  ctx.moveTo(0, halfThickness);
  ctx.lineTo(geometry.lengthPx, halfThickness);
  ctx.strokeStyle = isSelected ? '#1976D2' : (overlayColor ?? '#4B5563');
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();

  for (const segmentGeometry of geometry.segmentGeometries) {
    const segmentStart = projectStation(geometry, segmentGeometry.start);
    const segmentEnd = projectStation(geometry, segmentGeometry.end);
    const settings = getSegmentRenderSettings(run, segmentGeometry.segment);
    const insulationThicknessPx = settings.insulationType ? inchesToPixels(settings.insulationThickness) : 0;

    if (settings.insulationType === 'liner') {
      if (perfHints.enableHatching) {
        helper.drawLinerInsulation(segmentStart, segmentEnd, halfThickness, insulationThicknessPx, ctx, zoom);
      } else {
        drawInsulationFallback(ctx, segmentStart, segmentEnd, halfThickness, insulationThicknessPx, zoom, 'liner');
      }
    }
  }

  for (const segmentGeometry of geometry.segmentGeometries) {
    const segmentStart = projectStation(geometry, segmentGeometry.start);
    const segmentEnd = projectStation(geometry, segmentGeometry.end);
    const settings = getSegmentRenderSettings(run, segmentGeometry.segment);
    const outerHalfThickness = getSegmentOuterHalfThickness(run, segmentGeometry.segment, halfThickness, zoom);

    helper.drawDuctEnd(segmentStart, outerHalfThickness, settings.startEndType, zoom, ctx);
    helper.drawDuctEnd(segmentEnd, outerHalfThickness, settings.endEndType, zoom, ctx);
  }

  ctx.fillStyle = '#111827';
  ctx.font = `${Math.max(10 / zoom, 8)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(run.props.name, geometry.lengthPx / 2, -halfThickness - 6 / zoom);

  for (const segmentGeometry of geometry.segmentGeometries) {
    const settings = getSegmentRenderSettings(run, segmentGeometry.segment);
    if (!settings.insulationType) {
      continue;
    }

    const segmentStart = projectStation(geometry, segmentGeometry.start);
    const segmentEnd = projectStation(geometry, segmentGeometry.end);
    const outerHalfThickness = getSegmentOuterHalfThickness(run, segmentGeometry.segment, halfThickness, zoom);
    ctx.fillStyle = '#B45309';
    ctx.font = `${Math.max(8 / zoom, 7)}px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(
      `${getInsulationTag(settings.insulationType)} ${settings.insulationThickness}"`,
      (segmentStart + segmentEnd) / 2,
      outerHalfThickness + 5 / zoom
    );
  }

  ctx.strokeStyle = isSelected ? '#1976D2' : (overlayColor ?? '#4B5563');
  ctx.restore();
}

function projectStation(
  geometry: ReturnType<typeof DuctRunGeometryService.getGeometry>,
  point: { x: number; y: number }
): number {
  const dx = point.x - geometry.start.x;
  const dy = point.y - geometry.start.y;
  return dx * geometry.direction.x + dy * geometry.direction.y;
}

function drawInsulationFallback(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  halfThickness: number,
  thicknessPx: number,
  zoom: number,
  insulationType: InsulationType
): void {
  const stripeOffset = insulationType === 'wrap' ? halfThickness + Math.max(thicknessPx, 2 / zoom) : halfThickness;
  ctx.save();
  ctx.strokeStyle = '#FFD166';
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash?.([]);
  ctx.beginPath();
  ctx.moveTo(startX, -stripeOffset);
  ctx.lineTo(endX, -stripeOffset);
  ctx.moveTo(startX, stripeOffset);
  ctx.lineTo(endX, stripeOffset);
  ctx.stroke();
  ctx.restore();
}

interface SegmentRenderSettings {
  insulationType?: InsulationType;
  insulationThickness: number;
  startEndType: DuctEndType;
  endEndType: DuctEndType;
}

function getSegmentRenderSettings(run: DuctRun, segment: DuctSegment): SegmentRenderSettings {
  const insulationType =
    run.props.shape === 'flexible' && segment.insulationType && segment.insulationType !== 'wrap'
      ? undefined
      : segment.insulationType ?? run.props.insulationType;

  return {
    insulationType,
    insulationThickness: segment.insulationThickness ?? run.props.insulationThickness ?? 1,
    startEndType: segment.startEndType ?? run.props.startEndType ?? 'flange',
    endEndType: segment.endEndType ?? run.props.endEndType ?? 'flange',
  };
}

function getSegmentOuterHalfThickness(
  run: DuctRun,
  segment: DuctSegment,
  halfThickness: number,
  zoom: number
): number {
  const settings = getSegmentRenderSettings(run, segment);
  const insulationThicknessPx = settings.insulationType ? inchesToPixels(settings.insulationThickness) : 0;
  const capHalfThickness = settings.insulationType === 'wrap' ? halfThickness + insulationThicknessPx : halfThickness;
  return capHalfThickness + 2 / zoom;
}

function getInsulationTag(insulationType: InsulationType): string {
  switch (insulationType) {
    case 'liner':
      return 'LNR';
    case 'wrap':
      return 'WRP';
    case 'double_wall_perforated':
      return 'DW-P';
    case 'double_wall_non_perforated':
      return 'DW-NP';
  }
}

export default renderDuctRun;
