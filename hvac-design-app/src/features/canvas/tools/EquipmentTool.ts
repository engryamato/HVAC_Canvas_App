import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createEquipment, EQUIPMENT_TYPE_DEFAULTS } from '../entities/equipmentDefaults';
import { createEntity } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useToolStore } from '@/core/store/canvas.store';
import type { EquipmentType } from '@/core/schema/equipment.schema';

interface EquipmentToolState {
  currentPoint: { x: number; y: number } | null;
}

/**
 * Equipment tool for placing equipment on the canvas.
 * Click to place at cursor position with grid snapping.
 * Equipment type is stored in the canvas tool store.
 */
export class EquipmentTool extends BaseTool {
  readonly name = 'equipment';

  private state: EquipmentToolState = {
    currentPoint: null,
  };

  getCursor(): string {
    return 'crosshair';
  }

  /**
   * Get the currently selected equipment type from store
   */
  getSelectedType(): EquipmentType {
    return useToolStore.getState().selectedEquipmentType;
  }

  onActivate(): void {
    this.state.currentPoint = null;
  }

  onDeactivate(): void {
    this.state.currentPoint = null;
  }

  onMouseDown(event: ToolMouseEvent): void {
    console.log('EquipmentTool.onMouseDown', event.x, event.y, event.button);
    if (event.button !== 0) {
      return;
    }

    const snappedPoint = this.snapToGrid(event.x, event.y);
    console.log('EquipmentTool.snapped', snappedPoint);
    this.createEquipmentEntity(snappedPoint.x, snappedPoint.y);
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
    const selectedType = this.getSelectedType();
    const defaults = EQUIPMENT_TYPE_DEFAULTS[selectedType]!; // Non-null assertion: defaults always exist for all equipment types

    ctx.save();

    // Draw preview rectangle at cursor
    const x = currentPoint.x - defaults.width / 2;
    const y = currentPoint.y - defaults.depth / 2;

    ctx.fillStyle = 'rgba(255, 243, 224, 0.7)';
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);

    ctx.fillRect(x, y, defaults.width, defaults.depth);
    ctx.strokeRect(x, y, defaults.width, defaults.depth);

    // Draw type label
    ctx.font = `${10 / zoom}px sans-serif`;
    ctx.fillStyle = '#E65100';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedType.toUpperCase(), currentPoint.x, currentPoint.y);

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

  private createEquipmentEntity(x: number, y: number): void {
    const selectedType = this.getSelectedType();

    // Place equipment at the snapped position (corner, not centered)
    // This ensures the transform position is grid-aligned
    const equipment = createEquipment(selectedType, {
      x,
      y,
    });

    createEntity(equipment);
  }
}

export default EquipmentTool;
