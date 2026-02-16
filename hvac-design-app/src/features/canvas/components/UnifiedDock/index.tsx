'use client';

import React from 'react';
import { DockRail } from './DockRail';
import { DockDrawer } from './DockDrawer';

interface UnifiedDockProps {
  className?: string;
}

export function UnifiedDock({ className = '' }: UnifiedDockProps) {
  return (
    <div className={`flex h-full z-30 ${className}`}>
      <DockRail />
      <DockDrawer />
    </div>
  );
}
