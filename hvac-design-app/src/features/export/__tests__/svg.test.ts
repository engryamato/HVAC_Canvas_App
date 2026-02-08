import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportCanvasToSVG } from '../svg';
import { captureCanvasSnapshot } from '../canvasSnapshot';

vi.mock('../canvasSnapshot', () => ({
  captureCanvasSnapshot: vi.fn(),
}));

describe('exportCanvasToSVG', () => {
  const originalImage = global.Image;

  beforeEach(() => {
    vi.clearAllMocks();

    global.Image = class MockImage {
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public decoding = 'auto';
      public complete = false;

      set src(_value: string) {
        this.complete = true;
        if (this.onload) {
          this.onload();
        }
      }
    } as unknown as typeof Image;
  });

  afterEach(() => {
    global.Image = originalImage;
  });

  it('returns an error when canvas area is missing', async () => {
    const querySpy = vi.spyOn(document, 'querySelector').mockReturnValueOnce(null);

    const result = await exportCanvasToSVG({
      includeGrid: true,
      includeDimensions: true,
      includeLabels: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas area not found');
    querySpy.mockRestore();
  });

  it('exports SVG including selected layers', async () => {
    vi.mocked(captureCanvasSnapshot).mockResolvedValueOnce({
      dataUrl: 'data:image/png;base64,abc',
      widthPx: 300,
      heightPx: 200,
    });

    const canvasArea = document.createElement('div');
    canvasArea.setAttribute('data-testid', 'canvas-area');
    const canvasRect = { left: 0, top: 0, width: 300, height: 200 } as DOMRect;
    vi.spyOn(canvasArea, 'getBoundingClientRect').mockReturnValue(canvasRect);

    const svgBase = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgBase.setAttribute('data-export-layer', '');
    vi.spyOn(svgBase, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 200 } as DOMRect);
    svgBase.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));

    const svgGrid = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgGrid.setAttribute('data-export-layer', 'grid');
    vi.spyOn(svgGrid, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 200 } as DOMRect);

    canvasArea.appendChild(svgBase);
    canvasArea.appendChild(svgGrid);

    const querySpy = vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === '[data-testid="canvas-area"]') {
        return canvasArea;
      }
      return null;
    });

    const queryAllSpy = vi.spyOn(canvasArea, 'querySelectorAll').mockImplementation((selector: string) => {
      if (selector === 'svg') {
        return [svgBase, svgGrid] as unknown as NodeListOf<SVGSVGElement>;
      }
      return [] as unknown as NodeListOf<SVGSVGElement>;
    });

    const result = await exportCanvasToSVG({
      includeGrid: false,
      includeDimensions: false,
      includeLabels: false,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);

    querySpy.mockRestore();
    queryAllSpy.mockRestore();
  });
});
