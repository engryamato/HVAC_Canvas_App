import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createRoom } from '../entities/roomDefaults';
import { createEntity } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useSelectionStore } from '../store/selectionStore';

/**
 * Minimum room size in inches (12" x 12")
 */
const MIN_ROOM_SIZE = 12;

interface RoomToolState {
  mode: 'idle' | 'placing' | 'dragging';
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}

/**
 * Room tool for creating rooms with two-click placement.
 * First click sets corner, mouse move shows preview, second click confirms.
 */
export class RoomTool extends BaseTool {
  readonly name = 'room';

  private state: RoomToolState = {
    mode: 'idle',
    startPoint: null,
    currentPoint: null,
  };

  getCursor(): string {
    return 'crosshair';
  }

  onActivate(): void {
    this.reset();
  }

  onDeactivate(): void {
    this.reset();
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const snappedPoint = this.snapToGrid(event.x, event.y);

    if (this.state.mode === 'idle') {
      // First click: set start corner and enter dragging mode
      this.state = {
        mode: 'dragging',
        startPoint: snappedPoint,
        currentPoint: snappedPoint,
      };
    } else if (this.state.mode === 'placing' && this.state.startPoint) {
      // Second click: confirm room (two-click mode)
      this.createRoomEntity(this.state.startPoint, snappedPoint);
      this.reset();
    }
  }

  onMouseMove(event: ToolMouseEvent): void {
    if (this.state.mode === 'dragging' || this.state.mode === 'placing') {
      const snappedPoint = this.snapToGrid(event.x, event.y);
      this.state.currentPoint = snappedPoint;
    }
  }

  onMouseUp(event: ToolMouseEvent): void {
    if (this.state.mode === 'dragging' && this.state.startPoint) {
      const snappedPoint = this.snapToGrid(event.x, event.y);
      const dx = Math.abs(snappedPoint.x - this.state.startPoint.x);
      const dy = Math.abs(snappedPoint.y - this.state.startPoint.y);
      
      // If dragged beyond minimum size, create room immediately
      if (dx >= MIN_ROOM_SIZE && dy >= MIN_ROOM_SIZE) {
        this.createRoomEntity(this.state.startPoint, snappedPoint);
        this.reset();
      } else {
        // If not dragged enough, switch to placing mode for two-click behavior
        this.state.mode = 'placing';
      }
    }
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      this.reset();
    }
  }

  render(context: ToolRenderContext): void {
    if ((this.state.mode !== 'placing' && this.state.mode !== 'dragging') || !this.state.startPoint || !this.state.currentPoint) {
      return;
    }

    const { ctx, zoom } = context;
    const { startPoint, currentPoint } = this.state;

    // Calculate room dimensions
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    // Check minimum size
    const isValid = width >= MIN_ROOM_SIZE && height >= MIN_ROOM_SIZE;

    ctx.save();

    // Draw preview rectangle
    ctx.fillStyle = isValid ? 'rgba(227, 242, 253, 0.7)' : 'rgba(255, 200, 200, 0.5)';
    ctx.strokeStyle = isValid ? '#1976D2' : '#D32F2F';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);

    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Draw dimensions label
    const widthFt = (width / 12).toFixed(1);
    const heightFt = (height / 12).toFixed(1);
    ctx.font = `${12 / zoom}px sans-serif`;
    ctx.fillStyle = isValid ? '#1976D2' : '#D32F2F';
    ctx.textAlign = 'center';
    ctx.fillText(`${widthFt}' × ${heightFt}'`, x + width / 2, y + height / 2);

    ctx.restore();
  }

  protected reset(): void {
    this.state = {
      mode: 'idle',
      startPoint: null,
      currentPoint: null,
    };
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

  private createRoomEntity(start: { x: number; y: number }, end: { x: number; y: number }): void {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const length = Math.abs(end.y - start.y);

    // Enforce minimum size
    if (width < MIN_ROOM_SIZE || length < MIN_ROOM_SIZE) {
      return;
    }

    const room = createRoom({ x, y, width, length });
    createEntity(room);
    useSelectionStore.getState().select(room.id);
  }
}

export default RoomTool;
