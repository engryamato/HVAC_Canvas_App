export interface Point {
  x: number;
  y: number;
}

export function normalizeAngleDegrees(angleDeg: number): number {
  return ((angleDeg % 360) + 360) % 360;
}

export function getAngleDegrees(start: Point, end: Point): number {
  return normalizeAngleDegrees(Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI));
}

function cleanCoordinate(value: number): number {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 1e-10 ? rounded : value;
}

export function constrainAngleToStep(start: Point, cursor: Point, stepDeg: number): Point {
  const dx = cursor.x - start.x;
  const dy = cursor.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return { ...start };
  }

  const rawAngle = normalizeAngleDegrees(Math.atan2(dy, dx) * (180 / Math.PI));
  const wrapThreshold = 360 - Math.ceil(stepDeg / 2);
  const snappedAngle = rawAngle >= wrapThreshold ? 0 : Math.round(rawAngle / stepDeg) * stepDeg;
  const radians = snappedAngle * (Math.PI / 180);

  return {
    x: cleanCoordinate(start.x + length * Math.cos(radians)),
    y: cleanCoordinate(start.y + length * Math.sin(radians)),
  };
}
