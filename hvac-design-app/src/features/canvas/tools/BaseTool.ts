/**
 * Mouse event data passed to tool handlers
 */
export interface ToolMouseEvent {
  /** X coordinate in canvas space */
  x: number;
  /** Y coordinate in canvas space */
  y: number;
  /** X coordinate in screen space */
  screenX: number;
  /** Y coordinate in screen space */
  screenY: number;
  /** Whether shift key is pressed */
  shiftKey: boolean;
  /** Whether ctrl/cmd key is pressed */
  ctrlKey: boolean;
  /** Whether alt key is pressed */
  altKey: boolean;
  /** Mouse button (0=left, 1=middle, 2=right) */
  button: number;
}

/**
 * Keyboard event data passed to tool handlers
 */
export interface ToolKeyEvent {
  /** Key code */
  key: string;
  /** Key code (e.g., 'KeyA', 'Space') */
  code: string;
  /** Whether shift key is pressed */
  shiftKey: boolean;
  /** Whether ctrl/cmd key is pressed */
  ctrlKey: boolean;
  /** Whether alt key is pressed */
  altKey: boolean;
  /** Whether this is a repeat event */
  repeat: boolean;
}

/**
 * Render context for tool preview rendering
 */
export interface ToolRenderContext {
  ctx: CanvasRenderingContext2D;
  zoom: number;
  panX: number;
  panY: number;
}

/**
 * Base interface for all canvas tools.
 * Tools handle user interactions and create/modify entities.
 */
export interface ITool {
  /** Unique tool name */
  readonly name: string;

  /** Get cursor style for this tool */
  getCursor(): string;

  /** Called when tool is activated */
  onActivate(): void;

  /** Called when tool is deactivated */
  onDeactivate(): void;

  /** Handle mouse down event */
  onMouseDown(event: ToolMouseEvent): void;

  /** Handle mouse move event */
  onMouseMove(event: ToolMouseEvent): void;

  /** Handle mouse up event */
  onMouseUp(event: ToolMouseEvent): void;

  /** Handle key down event */
  onKeyDown(event: ToolKeyEvent): void;

  /** Handle key up event */
  onKeyUp(event: ToolKeyEvent): void;

  /** Render tool preview (e.g., placement preview) */
  render(context: ToolRenderContext): void;
}

/**
 * Abstract base class for tools with default implementations.
 */
export abstract class BaseTool implements ITool {
  abstract readonly name: string;

  getCursor(): string {
    return 'default';
  }

  onActivate(): void {
    // Override in subclass if needed
  }

  onDeactivate(): void {
    // Override in subclass if needed
  }

  onMouseDown(_event: ToolMouseEvent): void {
    // Override in subclass if needed
  }

  onMouseMove(_event: ToolMouseEvent): void {
    // Override in subclass if needed
  }

  onMouseUp(_event: ToolMouseEvent): void {
    // Override in subclass if needed
  }

  onKeyDown(_event: ToolKeyEvent): void {
    // Override in subclass if needed
  }

  onKeyUp(_event: ToolKeyEvent): void {
    // Override in subclass if needed
  }

  render(_context: ToolRenderContext): void {
    // Override in subclass if needed
  }

  /**
   * Reset tool state to initial
   */
  protected reset(): void {
    // Override in subclass if needed
  }
}

export default BaseTool;
