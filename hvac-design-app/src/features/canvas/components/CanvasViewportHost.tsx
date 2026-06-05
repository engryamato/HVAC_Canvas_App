'use client';

import React from 'react';
import { CanvasContainer } from './CanvasContainer';

interface CanvasViewportHostProps {
  className?: string;
}

export function CanvasViewportHost({ className = '' }: CanvasViewportHostProps): React.ReactElement {
  return <CanvasContainer className={className} />;
}

export default CanvasViewportHost;
