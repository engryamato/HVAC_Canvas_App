'use client';

import React from 'react';
import { useActiveViewMode } from '../store/viewModeStore';
import { CanvasContainer } from './CanvasContainer';
import { ThreeViewport } from './ThreeViewport';

interface CanvasViewportHostProps {
  className?: string;
}

export function CanvasViewportHost({ className = '' }: CanvasViewportHostProps): React.ReactElement {
  const activeViewMode = useActiveViewMode();

  if (activeViewMode === '3d') {
    return <ThreeViewport className={className} />;
  }

  return <CanvasContainer className={className} />;
}

export default CanvasViewportHost;
