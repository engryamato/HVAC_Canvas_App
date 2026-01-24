import type { ToolMouseEvent, ToolKeyEvent } from '../BaseTool';

export function createMockToolEvent(overrides: Partial<ToolMouseEvent> = {}): ToolMouseEvent {
  return {
    x: 0,
    y: 0,
    screenX: 0,
    screenY: 0,
    button: 0,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    ...overrides,
  };
}

export function createMockKeyEvent(overrides: Partial<ToolKeyEvent> = {}): ToolKeyEvent {
  return {
    key: '',
    code: '',
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    repeat: false,
    ...overrides,
  };
}
