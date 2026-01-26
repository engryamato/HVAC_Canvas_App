'use client';

import React, { useMemo } from 'react';

const RULER_SIZE_PX = 20;
const TICK_SPACING_PX = 50;

function getTickBackground(direction: 'x' | 'y'): string {
  const tickColor = 'hsl(var(--foreground) / 0.18)';
  const lineDir = direction === 'x' ? 'to right' : 'to bottom';
  return `repeating-linear-gradient(${lineDir}, transparent, transparent ${TICK_SPACING_PX - 1}px, ${tickColor} ${TICK_SPACING_PX - 1}px, ${tickColor} ${TICK_SPACING_PX}px)`;
}

export function RulersOverlay(): React.ReactElement {
  const horizontalBackground = useMemo(() => getTickBackground('x'), []);
  const verticalBackground = useMemo(() => getTickBackground('y'), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="absolute left-0 top-0 w-full border-b bg-background/80"
        style={{
          height: RULER_SIZE_PX,
          backgroundImage: horizontalBackground,
        }}
      />
      <div
        className="absolute left-0 top-0 h-full border-r bg-background/80"
        style={{
          width: RULER_SIZE_PX,
          backgroundImage: verticalBackground,
        }}
      />
      <div
        className="absolute left-0 top-0 border-b border-r bg-background/80"
        style={{ width: RULER_SIZE_PX, height: RULER_SIZE_PX }}
      />
    </div>
  );
}

export default RulersOverlay;
