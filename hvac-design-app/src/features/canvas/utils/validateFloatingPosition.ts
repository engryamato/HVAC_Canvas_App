export type FloatingPosition = {
  x: number;
  y: number;
};

export type FloatingPanelDimensions = {
  width: number;
  height: number;
};

export type ViewportDimensions = {
  width: number;
  height: number;
};

const DEFAULT_MARGIN_PX = 50;
const EXTERNAL_MONITOR_THRESHOLD_PX = 100;

export function validateFloatingPosition(
  position: FloatingPosition | null | undefined,
  panel: FloatingPanelDimensions,
  viewport: ViewportDimensions,
  marginPx: number = DEFAULT_MARGIN_PX
): FloatingPosition {
  const safeMarginPx = isFiniteNumber(marginPx) ? Math.max(0, marginPx) : DEFAULT_MARGIN_PX;

  if (!position || !isFiniteNumber(position.x) || !isFiniteNumber(position.y)) {
    return getCenteredPosition(panel, viewport);
  }

  if (
    !isFiniteNumber(panel.width) ||
    !isFiniteNumber(panel.height) ||
    !isFiniteNumber(viewport.width) ||
    !isFiniteNumber(viewport.height)
  ) {
    return getCenteredPosition(panel, viewport);
  }

  const minX = -(panel.width - safeMarginPx);
  const maxX = viewport.width - safeMarginPx;
  const minY = -(panel.height - safeMarginPx);
  const maxY = viewport.height - safeMarginPx;

  const isWithinBounds =
    position.x >= minX && position.x <= maxX && position.y >= minY && position.y <= maxY;

  if (!isWithinBounds) {
    return getCenteredPosition(panel, viewport);
  }

  const screenDimensions = getScreenAvailableDimensions();
  if (screenDimensions) {
    const isLikelyExternalMonitorPosition =
      position.x > screenDimensions.width + EXTERNAL_MONITOR_THRESHOLD_PX ||
      position.y > screenDimensions.height + EXTERNAL_MONITOR_THRESHOLD_PX ||
      position.x < -(screenDimensions.width + EXTERNAL_MONITOR_THRESHOLD_PX) ||
      position.y < -(screenDimensions.height + EXTERNAL_MONITOR_THRESHOLD_PX);

    if (isLikelyExternalMonitorPosition) {
      console.warn(
        '[validateFloatingPosition] Floating inspector position appears off-screen (possibly disconnected monitor). Resetting to center.',
        {
          position,
          viewport,
          screen: screenDimensions,
        }
      );

      return getCenteredPosition(panel, viewport);
    }
  }

  return { x: position.x, y: position.y };
}

function getScreenAvailableDimensions(): ViewportDimensions | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const width = window.screen?.availWidth;
  const height = window.screen?.availHeight;

  if (!isFiniteNumber(width) || !isFiniteNumber(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
}

function getCenteredPosition(
  panel: FloatingPanelDimensions,
  viewport: ViewportDimensions
): FloatingPosition {
  const width = isFiniteNumber(panel.width) ? panel.width : 0;
  const height = isFiniteNumber(panel.height) ? panel.height : 0;
  const viewportWidth = isFiniteNumber(viewport.width) ? viewport.width : 0;
  const viewportHeight = isFiniteNumber(viewport.height) ? viewport.height : 0;

  return {
    x: Math.max(0, (viewportWidth - width) / 2),
    y: Math.max(0, (viewportHeight - height) / 2),
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
