import { captureCanvasSnapshot } from './canvasSnapshot';
import type { ExportResult, PngQuality } from './types';

export interface PngExportOptions {
  quality: PngQuality;
  includeGrid: boolean;
  includeDimensions: boolean;
  includeLabels: boolean;
}

const QUALITY_SCALE: Record<PngQuality, number> = {
  low: 0.75,
  medium: 1.5,
  high: 3,
};

export async function exportCanvasToPNG(options: PngExportOptions): Promise<ExportResult> {
  const restoreLayers = hideExportLayers(options);
  const snapshot = await captureCanvasSnapshot();
  restoreLayers();
  if (!snapshot) {
    return { success: false, error: 'Canvas snapshot unavailable' };
  }

  try {
    const scale = QUALITY_SCALE[options.quality];
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(snapshot.widthPx * scale));
    canvas.height = Math.max(1, Math.round(snapshot.heightPx * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      return { success: false, error: 'Canvas context unavailable' };
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const baseImage = new Image();
    baseImage.decoding = 'async';
    baseImage.src = snapshot.dataUrl;

    await new Promise<void>((resolve, reject) => {
      baseImage.onload = () => resolve();
      baseImage.onerror = () => reject(new Error('Failed to load snapshot image'));
    });

    context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((output) => resolve(output), 'image/png');
    });

    if (!blob) {
      return { success: false, error: 'Failed to generate PNG blob' };
    }

    return { success: true, data: blob, fileSize: blob.size };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PNG export failed';
    return { success: false, error: message };
  }
}

function hideExportLayers() {
  if (typeof document === 'undefined') {
    return () => undefined;
  }

  const layers = Array.from(document.querySelectorAll('[data-export-layer]')) as HTMLElement[];
  const previous = layers.map((layer) => ({
    element: layer,
    display: layer.style.display,
  }));

  layers.forEach((layer) => {
    layer.style.display = 'none';
  });

  return () => {
    previous.forEach(({ element, display }) => {
      element.style.display = display;
    });
  };
}


function shouldIncludeLayer(layer: string, options: PngExportOptions) {
  if (layer === 'grid') {
    return options.includeGrid;
  }

  if (layer === 'dimensions') {
    return options.includeDimensions;
  }

  if (layer === 'labels') {
    return options.includeLabels;
  }

  return false;
}
