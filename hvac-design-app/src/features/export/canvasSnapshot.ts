'use client';

export interface CanvasSnapshot {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
}

export async function captureCanvasSnapshot(): Promise<CanvasSnapshot | null> {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvasArea = document.querySelector('[data-testid="canvas-area"]');
  if (!canvasArea) {
    return null;
  }

  const canvasElements = Array.from(canvasArea.querySelectorAll('canvas')) as HTMLCanvasElement[];
  const svgElements = Array.from(canvasArea.querySelectorAll('svg')) as SVGSVGElement[];
  if (canvasElements.length === 0 && svgElements.length === 0) {
    return null;
  }

  const width = Math.max(1, canvasArea.clientWidth);
  const height = Math.max(1, canvasArea.clientHeight);
  const composite = document.createElement('canvas');
  composite.width = width;
  composite.height = height;

  const ctx = composite.getContext('2d');
  if (!ctx) {
    return null;
  }

  canvasElements.forEach((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const areaRect = canvasArea.getBoundingClientRect();
    const offsetX = rect.left - areaRect.left;
    const offsetY = rect.top - areaRect.top;

    ctx.drawImage(canvas, offsetX, offsetY, rect.width, rect.height);
  });

  for (const svgElement of svgElements) {
    const svgImage = await renderSvgToImage(svgElement);
    if (!svgImage) {
      continue;
    }

    const rect = svgElement.getBoundingClientRect();
    const areaRect = canvasArea.getBoundingClientRect();
    const offsetX = rect.left - areaRect.left;
    const offsetY = rect.top - areaRect.top;

    ctx.drawImage(svgImage, offsetX, offsetY, rect.width, rect.height);
  }

  return {
    dataUrl: composite.toDataURL('image/png'),
    widthPx: composite.width,
    heightPx: composite.height,
  };
}

async function renderSvgToImage(svgElement: SVGSVGElement): Promise<HTMLImageElement | null> {
  const cloned = svgElement.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(cloned, svgElement);

  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(cloned);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

  const img = new Image();
  img.decoding = 'async';
  img.src = svgUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG image'));
  }).catch(() => null);

  return img.complete ? img : null;
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

