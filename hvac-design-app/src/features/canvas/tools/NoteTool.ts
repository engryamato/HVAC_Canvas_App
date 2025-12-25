import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createNote } from '../entities/noteDefaults';
import { createEntity } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';

interface NoteToolState {
  currentPoint: { x: number; y: number } | null;
}

/**
 * Note tool for placing text annotations on the canvas.
 * Click to place a note at cursor position with grid snapping.
 * Notes can be edited later through the inspector panel.
 */
export class NoteTool extends BaseTool {
  readonly name = 'note';

  private state: NoteToolState = {
    currentPoint: null,
  };

  getCursor(): string {
    return 'text';
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
    this.createNoteEntity(snappedPoint.x, snappedPoint.y);
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

    ctx.save();

    // Draw note preview
    const previewText = 'Click to add note';
    const fontSize = 14;
    const padding = 4;

    ctx.font = `${fontSize / zoom}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Measure text for background
    const metrics = ctx.measureText(previewText);
    const textWidth = metrics.width;
    const textHeight = fontSize / zoom;

    // Draw background
    ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.strokeStyle = '#F9A825';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);

    ctx.fillRect(
      currentPoint.x,
      currentPoint.y,
      textWidth + (padding * 2) / zoom,
      textHeight + (padding * 2) / zoom
    );
    ctx.strokeRect(
      currentPoint.x,
      currentPoint.y,
      textWidth + (padding * 2) / zoom,
      textHeight + (padding * 2) / zoom
    );

    // Draw text
    ctx.fillStyle = '#666666';
    ctx.fillText(previewText, currentPoint.x + padding / zoom, currentPoint.y + padding / zoom);

    // Draw note icon (small pin/tack)
    const iconX = currentPoint.x - 8 / zoom;
    const iconY = currentPoint.y;
    ctx.fillStyle = '#F9A825';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 3 / zoom, 0, Math.PI * 2);
    ctx.fill();

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

  private createNoteEntity(x: number, y: number): void {
    const note = createNote({
      x,
      y,
      content: 'New Note',
    });

    createEntity(note);
  }
}

export default NoteTool;
