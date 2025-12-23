import { describe, it, expect, beforeEach } from 'vitest';
import { useViewportStore } from '../viewportStore';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '@/core/constants/viewport';

describe('ViewportStore', () => {
  beforeEach(() => {
    useViewportStore.getState().resetView();
  });

  describe('pan', () => {
    it('should pan by delta values', () => {
      useViewportStore.getState().pan(100, 50);
      const state = useViewportStore.getState();
      expect(state.panX).toBe(100);
      expect(state.panY).toBe(50);
    });

    it('should accumulate pan values', () => {
      useViewportStore.getState().pan(100, 50);
      useViewportStore.getState().pan(50, 25);
      const state = useViewportStore.getState();
      expect(state.panX).toBe(150);
      expect(state.panY).toBe(75);
    });
  });

  describe('setPan', () => {
    it('should set absolute pan values', () => {
      useViewportStore.getState().pan(100, 100);
      useViewportStore.getState().setPan(50, 25);
      const state = useViewportStore.getState();
      expect(state.panX).toBe(50);
      expect(state.panY).toBe(25);
    });
  });

  describe('zoomTo', () => {
    it('should set zoom level', () => {
      useViewportStore.getState().zoomTo(2);
      expect(useViewportStore.getState().zoom).toBe(2);
    });

    it('should clamp zoom to minimum', () => {
      useViewportStore.getState().zoomTo(0.01);
      expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);
    });

    it('should clamp zoom to maximum', () => {
      useViewportStore.getState().zoomTo(10);
      expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
    });

    it('should adjust pan when zooming toward center point', () => {
      useViewportStore.getState().setPan(0, 0);
      useViewportStore.getState().zoomTo(2, 100, 100);
      const state = useViewportStore.getState();
      // Pan should be adjusted to keep center point stable
      expect(state.panX).toBe(-100);
      expect(state.panY).toBe(-100);
    });
  });

  describe('zoomIn', () => {
    it('should increase zoom by step', () => {
      const initialZoom = useViewportStore.getState().zoom;
      useViewportStore.getState().zoomIn();
      expect(useViewportStore.getState().zoom).toBeCloseTo(initialZoom + ZOOM_STEP);
    });

    it('should not exceed maximum zoom', () => {
      useViewportStore.getState().zoomTo(MAX_ZOOM);
      useViewportStore.getState().zoomIn();
      expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
    });
  });

  describe('zoomOut', () => {
    it('should decrease zoom by step', () => {
      const initialZoom = useViewportStore.getState().zoom;
      useViewportStore.getState().zoomOut();
      expect(useViewportStore.getState().zoom).toBeCloseTo(initialZoom - ZOOM_STEP);
    });

    it('should not go below minimum zoom', () => {
      useViewportStore.getState().zoomTo(MIN_ZOOM);
      useViewportStore.getState().zoomOut();
      expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);
    });
  });

  describe('fitToContent', () => {
    it('should center on bounds and reset zoom', () => {
      const bounds = { x: 100, y: 100, width: 200, height: 200 };
      const canvasDimensions = { width: 400, height: 400 };
      useViewportStore.getState().fitToContent(bounds, canvasDimensions);
      const state = useViewportStore.getState();
      expect(state.panX).toBe(-100); // canvasWidth/2 - centerX * zoom
      expect(state.panY).toBe(-100); // canvasHeight/2 - centerY * zoom
      expect(state.zoom).toBe(1.5); // zoom to fit with padding
    });
  });

  describe('resetView', () => {
    it('should reset to initial state', () => {
      useViewportStore.getState().pan(100, 100);
      useViewportStore.getState().zoomTo(2);
      useViewportStore.getState().resetView();
      const state = useViewportStore.getState();
      expect(state.panX).toBe(0);
      expect(state.panY).toBe(0);
      expect(state.zoom).toBe(1);
    });
  });

  describe('grid controls', () => {
    it('should toggle grid visibility', () => {
      const initial = useViewportStore.getState().gridVisible;
      useViewportStore.getState().toggleGrid();
      expect(useViewportStore.getState().gridVisible).toBe(!initial);
    });

    it('should set grid size', () => {
      useViewportStore.getState().setGridSize(48);
      expect(useViewportStore.getState().gridSize).toBe(48);
    });

    it('should toggle snap to grid', () => {
      const initial = useViewportStore.getState().snapToGrid;
      useViewportStore.getState().toggleSnap();
      expect(useViewportStore.getState().snapToGrid).toBe(!initial);
    });
  });
});
