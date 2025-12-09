'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useViewportStore } from '../store/viewportStore';

interface UseViewportOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * Hook to handle pan and zoom interactions on the canvas.
 * - Middle mouse drag or Space + left drag for panning
 * - Mouse wheel for zooming (centered on cursor)
 */
export function useViewport({ canvasRef }: UseViewportOptions) {
  const { pan, zoomIn, zoomOut } = useViewportStore();
  const isPanning = useRef(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });
  const isSpacePressed = useRef(false);

  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();
      const { panX, panY, zoom } = useViewportStore.getState();

      return {
        x: (screenX - rect.left - panX) / zoom,
        y: (screenY - rect.top - panY) / zoom,
      };
    },
    [canvasRef]
  );

  /**
   * Handle mouse wheel for zoom
   */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.deltaY < 0) {
        zoomIn(mouseX, mouseY);
      } else {
        zoomOut(mouseX, mouseY);
      }
    },
    [canvasRef, zoomIn, zoomOut]
  );

  /**
   * Handle mouse down for pan start
   */
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Middle mouse button or Space + left click
    if (e.button === 1 || (e.button === 0 && isSpacePressed.current)) {
      isPanning.current = true;
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  /**
   * Handle mouse move for pan
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning.current) {
        return;
      }

      const deltaX = e.clientX - lastPanPosition.current.x;
      const deltaY = e.clientY - lastPanPosition.current.y;

      pan(deltaX, deltaY);

      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    },
    [pan]
  );

  /**
   * Handle mouse up for pan end
   */
  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  /**
   * Handle key down for space key
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        isSpacePressed.current = true;
        // Change cursor to grab
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
    },
    [canvasRef]
  );

  /**
   * Handle key up for space key
   */
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        // Reset cursor
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    },
    [canvasRef]
  );

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    canvasRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    handleKeyUp,
  ]);

  return {
    screenToCanvas,
    isPanning: isPanning.current,
  };
}

export default useViewport;
