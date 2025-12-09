// Math utilities
export {
  type Point,
  distance,
  distanceSquared,
  clamp,
  snapToGrid,
  snapPointToGrid,
  degreesToRadians,
  radiansToDegrees,
  lerp,
  lerpPoint,
  normalizeAngle,
  angleBetweenPoints,
  rotatePoint,
  addPoints,
  subtractPoints,
  scalePoint,
  approximately,
} from './math';

// Bounds utilities
export {
  type Bounds,
  getBoundsCenter,
  boundsContainsPoint,
  boundsIntersect,
  boundsContainsBounds,
  mergeBounds,
  expandBounds,
  boundsFromPoints,
  getBoundsCorners,
  getBoundsArea,
  isEmptyBounds,
  translateBounds,
  scaleBounds,
} from './bounds';

