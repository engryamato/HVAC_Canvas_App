/**
 * Viewport Constants
 *
 * Centralized constants for canvas viewport behavior.
 * These values are used by viewportStore and any components that need
 * to reference zoom/pan limits.
 */

/** Minimum zoom level (10% = 0.1) */
export const MIN_ZOOM = 0.1;

/** Maximum zoom level (400% = 4.0) */
export const MAX_ZOOM = 4.0;

/** Default zoom step for zoom in/out operations */
export const ZOOM_STEP = 0.1;

/** Default zoom level (100% = 1.0) */
export const DEFAULT_ZOOM = 1.0;

/** Default grid size in pixels at zoom=1 (1/4 inch at 96 DPI) */
export const DEFAULT_GRID_SIZE = 24;

/** Grid size options for user preference */
export const GRID_SIZE_OPTIONS = [12, 24, 48, 96] as const;

/** Zoom level presets for quick access */
export const ZOOM_PRESETS = {
  FIT: 'fit',
  '25%': 0.25,
  '50%': 0.5,
  '75%': 0.75,
  '100%': 1.0,
  '150%': 1.5,
  '200%': 2.0,
  '400%': 4.0,
} as const;
