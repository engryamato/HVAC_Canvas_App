'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface MinimapProps {
  onUndock?: () => void;
}

export function Minimap({ onUndock }: MinimapProps): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-sm p-2"
      data-testid="minimap"
      role="group"
      aria-label="Minimap"
    >
      <div className="text-xs font-medium text-slate-600">Minimap</div>
      <div className="w-32 h-20 bg-slate-100 border border-dashed border-slate-300 rounded" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndock}
        data-testid="minimap-undock"
        className="h-7"
      >
        Undock
      </Button>
    </div>
  );
}

export default Minimap;
