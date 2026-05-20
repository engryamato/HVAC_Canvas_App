import type { DuctRun } from '@/core/schema';
import type { RenderContext } from './RoomRenderer';
import { DuctRunGeometryService } from '../services/DuctRunGeometryService';

export function renderDuctRun(run: DuctRun, context: RenderContext): void {
  const { ctx, zoom, isSelected, isHovered, selectedSegmentIndexes = [], overlayColor } = context;
  const geometry = DuctRunGeometryService.getGeometry(run);
  const halfThickness = geometry.thicknessPx / 2;
  const outerHalfThickness = halfThickness + 2 / zoom;

  ctx.save();
  ctx.fillStyle = overlayColor ?? (isSelected ? 'rgba(25, 118, 210, 0.08)' : 'rgba(75, 85, 99, 0.04)');
  if (isHovered && !isSelected && !overlayColor) {
    ctx.fillStyle = 'rgba(75, 85, 99, 0.08)';
  }
  ctx.fillRect(0, -halfThickness, geometry.lengthPx, geometry.thicknessPx);

  for (const segmentGeometry of geometry.segmentGeometries) {
    const segmentStart = projectStation(geometry, segmentGeometry.start);
    const segmentEnd = projectStation(geometry, segmentGeometry.end);

    if (selectedSegmentIndexes.includes(segmentGeometry.segment.index)) {
      ctx.fillStyle = 'rgba(25, 118, 210, 0.18)';
      ctx.fillRect(segmentStart, -halfThickness, segmentEnd - segmentStart, geometry.thicknessPx);
    }

    if (segmentGeometry.segment.index > 0) {
      const stationPx = segmentStart;
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
  ctx.moveTo(0, -outerHalfThickness);
  ctx.lineTo(0, outerHalfThickness);
  ctx.moveTo(geometry.lengthPx, -outerHalfThickness);
  ctx.lineTo(geometry.lengthPx, outerHalfThickness);
  ctx.strokeStyle = isSelected ? '#1976D2' : (overlayColor ?? '#4B5563');
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.font = `${Math.max(10 / zoom, 8)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(run.props.name, geometry.lengthPx / 2, -halfThickness - 6 / zoom);
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

export default renderDuctRun;
