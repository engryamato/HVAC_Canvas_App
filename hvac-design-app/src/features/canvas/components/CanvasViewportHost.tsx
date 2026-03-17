'use client';

import React from 'react';
import { CanvasContainer } from './CanvasContainer';

// 3D View suspended — ThreeViewport is not loaded

interface CanvasViewportHostProps {
  className?: string;
}

export function CanvasViewportHost({ className = '' }: CanvasViewportHostProps): React.ReactElement {
  // 3D view is currently suspended; always render the 2D plan canvas
  return <CanvasContainer className={className} />;
}

export default CanvasViewportHost;
