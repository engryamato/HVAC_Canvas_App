import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportCanvasToPNG } from '../png';
import { captureCanvasSnapshot } from '../canvasSnapshot';

vi.mock('../canvasSnapshot', () => ({
  captureCanvasSnapshot: vi.fn(),
}));

describe('exportCanvasToPNG', () => {
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

  it('returns an error when snapshot is unavailable', async () => {
    vi.mocked(captureCanvasSnapshot).mockResolvedValueOnce(null);

    const result = await exportCanvasToPNG({
      quality: 'medium',
      includeGrid: false,
      includeDimensions: false,
      includeLabels: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Canvas snapshot unavailable');
  });

  it('exports a PNG blob with scaled dimensions', async () => {
    vi.mocked(captureCanvasSnapshot).mockResolvedValueOnce({
      dataUrl: 'data:image/png;base64,abc',
      widthPx: 200,
      heightPx: 100,
    });

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement');
    let createdCanvas: HTMLCanvasElement | null = null;

    createElementSpy.mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement;
        const context = {
          drawImage: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          setTransform: vi.fn(),
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
        } as unknown as CanvasRenderingContext2D;

        canvas.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement['getContext'];
        canvas.toBlob = vi.fn((callback) => callback(new Blob(['png']))) as unknown as HTMLCanvasElement['toBlob'];
        createdCanvas = canvas;
        return canvas as unknown as HTMLElement;
      }

      return originalCreateElement(tagName);
    });

    const result = await exportCanvasToPNG({
      quality: 'high',
      includeGrid: false,
      includeDimensions: false,
      includeLabels: false,
    });

    createElementSpy.mockRestore();

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);

    const canvas = createdCanvas as HTMLCanvasElement | null;
    expect(canvas?.width).toBe(600);
    expect(canvas?.height).toBe(300);
  });
});
