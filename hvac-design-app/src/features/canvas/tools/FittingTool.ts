import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createFitting, FITTING_TYPE_LABELS } from '../entities/fittingDefaults';
import { createEntity, validateAndRecord } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import type { FittingType } from '@/core/schema/fitting.schema';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';

interface FittingToolState {
  currentPoint: { x: number; y: number } | null;
}

/**
 * Fitting tool for placing fittings on the canvas.
 * Click to place at cursor position with grid snapping.
 * Fitting type is stored in the canvas tool store.
 */
export class FittingTool extends BaseTool {
  readonly name = 'fitting';

  private state: FittingToolState = {
    currentPoint: null,
  };

  getCursor(): string {
    return 'crosshair';
  }

  /**
   * Get the currently active component from the library
   */
  getActiveComponent() {
    return useComponentLibraryStoreV2.getState().getActiveComponent();
  }

  onActivate(): void {
    this.state.currentPoint = null;
  }

  onDeactivate(): void {
    this.state.currentPoint = null;
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const snappedPoint = this.snapToGrid(event.x, event.y);
    this.createFittingEntity(snappedPoint.x, snappedPoint.y);
  }

  onMouseMove(event: ToolMouseEvent): void {
    const snappedPoint = this.snapToGrid(event.x, event.y);
    this.state.currentPoint = snappedPoint;
  }

  onMouseUp(_event: ToolMouseEvent): void {
    // Single click placement, nothing to do on mouse up
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      this.state.currentPoint = null;
    }
  }

  render(context: ToolRenderContext): void {
    if (!this.state.currentPoint) {
      return;
    }

    const { ctx, zoom } = context;
    const currentPoint = this.state.currentPoint;
    const activeComponent = this.getActiveComponent();
    
    // Only render if a fitting is selected
    if (!activeComponent || activeComponent.category !== 'fitting') {
        return;
    }

    const type = (activeComponent.subtype as FittingType) || 'elbow_90';
    const label = FITTING_TYPE_LABELS[type] || activeComponent.name;

    ctx.save();

    // Draw fitting preview as a small diamond/square rotated 45 degrees
    const size = 12; // Base size in pixels
    const x = currentPoint.x;
    const y = currentPoint.y;

    ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);

    // Draw diamond shape
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw type label
    ctx.font = `${10 / zoom}px sans-serif`;
    ctx.fillStyle = '#E65100';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x, y + size + 4 / zoom);

    ctx.restore();
  }

  protected reset(): void {
    this.state.currentPoint = null;
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const { snapToGrid, gridSize } = useViewportStore.getState();
    if (!snapToGrid) {
      return { x, y };
    }
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  private createFittingEntity(x: number, y: number): void {
    const activeComponent = this.getActiveComponent();
    if (!activeComponent || activeComponent.category !== 'fitting') {
        console.warn('No active fitting selected');
        return;
    }

    const type = (activeComponent.subtype as FittingType) || 'elbow_90';
    const activeService = activeComponent ? adaptComponentToService(activeComponent) : null;

    const fitting = createFitting(type, {
      x,
      y,
      serviceId: activeService?.id || activeComponent.id,
      catalogItemId: activeComponent.id,
    });

    createEntity(fitting);
    validateAndRecord(fitting.id);
  }
}

export default FittingTool;
