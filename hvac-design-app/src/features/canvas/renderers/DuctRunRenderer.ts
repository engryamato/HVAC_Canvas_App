import type { DuctRun } from '@/core/schema';
import type { RenderContext } from './RoomRenderer';
import { DuctRunGeometryService } from '../services/DuctRunGeometryService';
import { useSelectionStore } from '../store/selectionStore';

export function renderDuctRun(run: DuctRun, context: RenderContext): void {
  const { ctx, zoom, isSelected } = context;
  const geometry = DuctRunGeometryService.getGeometry(run);
  const selectedSegmentIndexes = useSelectionStore
    .getState()
    .selectedSegments.filter((segment) => segment.runId === run.id)
    .map((segment) => segment.segmentIndex);
  const halfThickness = geometry.thicknessPx / 2;

  ctx.save();
  ctx.strokeStyle = isSelected ? '#1976D2' : '#4B5563';
  ctx.lineWidth = 2 / zoom;

  ctx.beginPath();
  ctx.moveTo(0, -halfThickness);
  ctx.lineTo(geometry.lengthPx, -halfThickness);
  ctx.moveTo(0, halfThickness);
  ctx.lineTo(geometry.lengthPx, halfThickness);
  ctx.moveTo(0, -halfThickness - 2 / zoom);
  ctx.lineTo(0, halfThickness + 2 / zoom);
  ctx.moveTo(geometry.lengthPx, -halfThickness - 2 / zoom);
  ctx.lineTo(geometry.lengthPx, halfThickness + 2 / zoom);
  ctx.stroke();

  for (const segmentGeometry of geometry.segmentGeometries) {
    if (segmentGeometry.segment.index > 0) {
      const stationPx = segmentGeometry.segment.startStation * 12;
      ctx.beginPath();
      ctx.moveTo(stationPx, -halfThickness);
      ctx.lineTo(stationPx, halfThickness);
      ctx.stroke();
    }

    if (selectedSegmentIndexes.includes(segmentGeometry.segment.index)) {
      ctx.fillStyle = 'rgba(25, 118, 210, 0.18)';
      ctx.fillRect(
        segmentGeometry.segment.startStation * 12,
        -halfThickness,
        segmentGeometry.segment.length * 12,
        geometry.thicknessPx
      );
    }
  }

  ctx.fillStyle = '#111827';
  ctx.font = `${Math.max(10 / zoom, 8)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(run.props.name, geometry.lengthPx / 2, -halfThickness - 6 / zoom);
  ctx.restore();
}

export default renderDuctRun;
