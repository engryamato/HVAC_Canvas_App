import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Tauri API modules for testing
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}))

vi.mock('@tauri-apps/api/fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  readDir: vi.fn(),
  createDir: vi.fn(),
  copyFile: vi.fn(),
  exists: vi.fn()
}))

vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn().mockResolvedValue('/Users/test'),
  documentDir: vi.fn().mockResolvedValue('/Users/test/Documents'),
  tempDir: vi.fn().mockResolvedValue('/tmp'),
  join: vi.fn((...paths: string[]) => paths.join('/'))
}))

vi.mock('@tauri-apps/api/dialog', () => ({
  save: vi.fn(),
  open: vi.fn(),
  message: vi.fn(),
  ask: vi.fn(),
  confirm: vi.fn()
}))

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    close: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn()
  }
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
}

// Mock HTMLCanvasElement.prototype.getContext for jsdom
// This is needed because jsdom doesn't implement canvas
const createMockCanvasContext = (): CanvasRenderingContext2D => {
  const mockContext = {
    // Canvas state
    canvas: { width: 800, height: 600 },

    // State methods
    save: vi.fn(),
    restore: vi.fn(),

    // Transformations
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),

    // Compositing
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',

    // Drawing rectangles
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),

    // Drawing paths
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    rect: vi.fn(),

    // Drawing paths (fill/stroke)
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    isPointInPath: vi.fn(() => false),
    isPointInStroke: vi.fn(() => false),

    // Text
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2 })),

    // Line styles
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
    lineDashOffset: 0,

    // Text styles
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',

    // Fill and stroke styles
    fillStyle: '#000000',
    strokeStyle: '#000000',

    // Shadows
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,

    // Image drawing
    drawImage: vi.fn(),

    // Pixel manipulation
    createImageData: vi.fn(() => ({ width: 1, height: 1, data: new Uint8ClampedArray(4) })),
    getImageData: vi.fn(() => ({ width: 1, height: 1, data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),

    // Gradients and patterns
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(() => null),

    // Path2D
    createConicGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),

    // Misc
    getTransform: vi.fn(() => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })),
    getContextAttributes: vi.fn(() => ({})),
  };

  return mockContext as unknown as CanvasRenderingContext2D;
};

// Apply the mock to HTMLCanvasElement prototype
HTMLCanvasElement.prototype.getContext = vi.fn(function(
  this: HTMLCanvasElement,
  contextId: string
) {
  if (contextId === '2d') {
    return createMockCanvasContext();
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock URL.createObjectURL and revokeObjectURL for file download tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

