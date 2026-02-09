'use client';

import type { Bounds } from '@/core/geometry/bounds';

interface SelectionMarqueeProps {
  bounds: Bounds | null;
  isActive: boolean;
}

/**
 * Visual overlay for marquee (rectangular) selection.
 * Renders a dashed rectangle showing the current selection area.
 */
export function SelectionMarquee({ bounds, isActive }: SelectionMarqueeProps) {
  if (!isActive || !bounds) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-500/10"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      }}
    />
  );
}

export default SelectionMarquee;

