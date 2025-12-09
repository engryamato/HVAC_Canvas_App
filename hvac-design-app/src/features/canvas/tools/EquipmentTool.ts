import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createEquipment, EQUIPMENT_TYPE_DEFAULTS } from '../entities/equipmentDefaults';
import { createEntity } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import type { EquipmentType } from '@/core/schema/equipment.schema';

interface EquipmentToolState {
  selectedType: EquipmentType;
  currentPoint: { x: number; y: number } | null;
}

/**
 * Equipment tool for placing equipment on the canvas.
 * Click to place at cursor position with grid snapping.
 */
export class EquipmentTool extends BaseTool {
  readonly name = 'equipment';

  private state: EquipmentToolState = {
    selectedType: 'fan',
    currentPoint: null,
  };

  getCursor(): string {
    return 'crosshair';
  }

  /**
   * Get the currently selected equipment type
   */
  getSelectedType(): EquipmentType {
    return this.state.selectedType;
  }

  /**
   * Set the equipment type to place
   */
  setSelectedType(type: EquipmentType): void {
    this.state.selectedType = type;
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
    const { currentPoint, selectedType } = this.state;
    const defaults = EQUIPMENT_TYPE_DEFAULTS[selectedType];

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
    const defaults = EQUIPMENT_TYPE_DEFAULTS[this.state.selectedType];

    // Center the equipment on the click point
    const equipment = createEquipment(this.state.selectedType, {
      x: x - defaults.width / 2,
      y: y - defaults.depth / 2,
    });

    createEntity(equipment);
  }
}

export default EquipmentTool;
