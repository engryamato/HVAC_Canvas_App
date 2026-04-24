const createCanvasContextMock = () => ({
  canvas: null as HTMLCanvasElement | null,
  strokeStyle: '#000000',
  fillStyle: '#000000',
  lineWidth: 1,
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  setLineDash: () => {},
});

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (function getContext(
    this: HTMLCanvasElement,
    contextId: string
  ) {
    if (contextId !== '2d') {
      return null;
    }

    const context = createCanvasContextMock();
    context.canvas = this;
    return context as unknown as CanvasRenderingContext2D;
  }) as unknown as HTMLCanvasElement['getContext'];
}
