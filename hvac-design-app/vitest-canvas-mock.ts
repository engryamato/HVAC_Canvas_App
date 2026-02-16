const createCanvasContextMock = () => ({
  canvas: null,
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
  HTMLCanvasElement.prototype.getContext = function getContext() {
    const context = createCanvasContextMock();
    context.canvas = this;
    return context as unknown as CanvasRenderingContext2D;
  };
}
