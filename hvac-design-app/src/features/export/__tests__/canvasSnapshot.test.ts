import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureCanvasSnapshot } from '../canvasSnapshot';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('canvasSnapshot', () => {
  it('returns null when canvas-area is not found', async () => {
    const snapshot = await captureCanvasSnapshot();
    expect(snapshot).toBeNull();
  });

  it('returns null in SSR (document undefined)', async () => {
    const originalDocument = globalThis.document;
    vi.stubGlobal('document', undefined as any);

    try {
      const snapshot = await captureCanvasSnapshot();
      expect(snapshot).toBeNull();
    } finally {
      vi.stubGlobal('document', originalDocument as any);
    }
  });

  it('captures canvas and svg layers into a PNG', async () => {
    const drawImage = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'canvas') {
        Object.assign(element, {
          getContext: vi.fn(() => ({ drawImage })),
          toDataURL: vi.fn(() => 'data:image/png;base64,AAA'),
        });
      }
      return element;
    });

    const OriginalImage = globalThis.Image;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      decoding = 'async';
      complete = false;
      private _src = '';

      set src(value: string) {
        this._src = value;
        this.complete = true;
        queueMicrotask(() => this.onload?.());
      }

      get src() {
        return this._src;
      }
    }
    vi.stubGlobal('Image', MockImage as any);

    const canvasArea = document.createElement('div');
    canvasArea.setAttribute('data-testid', 'canvas-area');
    Object.defineProperty(canvasArea, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(canvasArea, 'clientHeight', { value: 300, configurable: true });
    canvasArea.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => '',
    } as any);

    const layerCanvas = document.createElement('canvas');
    layerCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => '',
    } as any);
    canvasArea.appendChild(layerCanvas);

    const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgOverlay.setAttribute('width', '400');
    svgOverlay.setAttribute('height', '300');
    svgOverlay.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => '',
    } as any);
    canvasArea.appendChild(svgOverlay);

    document.body.appendChild(canvasArea);

    const snapshot = await captureCanvasSnapshot();

    vi.stubGlobal('Image', OriginalImage as any);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.dataUrl).toContain('data:image/png');
    expect(snapshot?.widthPx).toBe(400);
    expect(snapshot?.heightPx).toBe(300);

    expect(drawImage).toHaveBeenCalledTimes(2);
  });
});

