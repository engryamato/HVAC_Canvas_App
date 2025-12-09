'use client';

import { useState, useCallback } from 'react';
import type { Bounds } from '@/core/geometry/bounds';
import { boundsFromPoints } from '@/core/geometry/bounds';

interface MarqueeState {
  isActive: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  bounds: Bounds | null;
}

/**
 * Hook for managing marquee (rectangular) selection state.
 */
export function useMarquee() {
  const [state, setState] = useState<MarqueeState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    bounds: null,
  });

  /**
   * Start marquee selection at a point
   */
  const startMarquee = useCallback((x: number, y: number) => {
    setState({
      isActive: true,
      startPoint: { x, y },
      currentPoint: { x, y },
      bounds: null,
    });
  }, []);

  /**
   * Update marquee selection as mouse moves
   */
  const updateMarquee = useCallback((x: number, y: number) => {
    setState((prev) => {
      if (!prev.isActive || !prev.startPoint) {
        return prev;
      }

      const bounds = boundsFromPoints(prev.startPoint, { x, y });

      return {
        ...prev,
        currentPoint: { x, y },
        bounds,
      };
    });
  }, []);

  /**
   * End marquee selection and return final bounds
   */
  const endMarquee = useCallback((): Bounds | null => {
    const finalBounds = state.bounds;

    setState({
      isActive: false,
      startPoint: null,
      currentPoint: null,
      bounds: null,
    });

    return finalBounds;
  }, [state.bounds]);

  /**
   * Cancel marquee selection without returning bounds
   */
  const cancelMarquee = useCallback(() => {
    setState({
      isActive: false,
      startPoint: null,
      currentPoint: null,
      bounds: null,
    });
  }, []);

  return {
    isActive: state.isActive,
    bounds: state.bounds,
    startMarquee,
    updateMarquee,
    endMarquee,
    cancelMarquee,
  };
}

export default useMarquee;
