import { captureCanvasSnapshot } from './canvasSnapshot';
import type { ExportResult } from './types';

export interface SvgExportOptions {
  includeGrid: boolean;
  includeDimensions: boolean;
  includeLabels: boolean;
}

export async function exportCanvasToSVG(options: SvgExportOptions): Promise<ExportResult> {
  if (typeof document === 'undefined') {
    return { success: false, error: 'Document unavailable' };
  }

  const canvasArea = document.querySelector('[data-testid="canvas-area"]');
  if (!canvasArea) {
    return { success: false, error: 'Canvas area not found' };
  }

  const restoreLayers = hideExportLayers(options);
  const svgElements = Array.from(canvasArea.querySelectorAll('svg')) as SVGSVGElement[];
  const snapshot = await captureCanvasSnapshot();
  restoreLayers();

  if (svgElements.length === 0 && !snapshot) {
    return { success: false, error: 'No SVG content found' };
  }

  try {
    const rect = canvasArea.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const svgDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', null);
    const root = svgDoc.documentElement;
    root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    root.setAttribute('width', `${width}`);
    root.setAttribute('height', `${height}`);
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);

    if (snapshot?.dataUrl) {
      const image = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('href', snapshot.dataUrl);
      image.setAttribute('width', `${width}`);
      image.setAttribute('height', `${height}`);
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      root.appendChild(image);
    }

    svgElements.forEach((element) => {
      const layer = element.getAttribute('data-export-layer') ?? '';
      if (!shouldIncludeLayer(layer, options)) {
        return;
      }

      const cloned = element.cloneNode(true) as SVGSVGElement;
      inlineComputedStyles(cloned, element);

      const elementRect = element.getBoundingClientRect();
      const offsetX = elementRect.left - rect.left;
      const offsetY = elementRect.top - rect.top;
      const group = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${offsetX} ${offsetY})`);
      group.appendChild(cloned);
      root.appendChild(group);
    });

    const serializer = new XMLSerializer();
    const svgMarkup = serializer.serializeToString(root);
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });

    return { success: true, data: blob, fileSize: blob.size };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SVG export failed';
    return { success: false, error: message };
  }
}

function shouldIncludeLayer(layer: string, options: SvgExportOptions) {
  if (layer === 'grid') {
    return options.includeGrid;
  }

  if (layer === 'dimensions') {
    return options.includeDimensions;
  }

  if (layer === 'labels') {
    return options.includeLabels;
  }

  return layer === '';
}

function inlineComputedStyles(clonedRoot: SVGSVGElement, originalRoot: SVGSVGElement) {
  const originalElements = [originalRoot, ...Array.from(originalRoot.querySelectorAll('*'))];
  const clonedElements = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))];

  for (let index = 0; index < clonedElements.length; index += 1) {
    const originalElement = originalElements[index] as Element | undefined;
    const clonedElement = clonedElements[index] as Element | undefined;
    if (!originalElement || !clonedElement) {
      continue;
    }

    const computed = window.getComputedStyle(originalElement);
    const style = Array.from(computed)
      .map((property) => `${property}:${computed.getPropertyValue(property)}`)
      .join(';');
    clonedElement.setAttribute('style', style);
  }
}

function hideExportLayers(options: SvgExportOptions) {
  if (typeof document === 'undefined') {
    return () => undefined;
  }

  const layers = Array.from(document.querySelectorAll('[data-export-layer]')) as HTMLElement[];
  const previous = layers.map((layer) => ({
    element: layer,
    display: layer.style.display,
  }));

  layers.forEach((layer) => {
    const name = layer.getAttribute('data-export-layer') ?? '';
    if (!shouldIncludeLayer(name, options)) {
      layer.style.display = 'none';
    }
  });

  return () => {
    previous.forEach(({ element, display }) => {
      element.style.display = display;
    });
  };
}
