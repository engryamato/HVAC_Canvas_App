'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSelectedFittingType, useToolActions } from '@/core/store/canvas.store';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import type { FittingType } from '@/core/schema/fitting.schema';
import { resolveFittingType } from '../tools/catalogPlacement';

const FITTING_TYPES: Array<{ id: FittingType; label: string }> = [
  { id: 'elbow_90', label: 'Elbow 90°' },
  { id: 'elbow_45', label: 'Elbow 45°' },
  { id: 'tee', label: 'Tee' },
  { id: 'reducer', label: 'Reducer' },
  { id: 'cap', label: 'Cap' },
];

export const FittingTypeSelector: React.FC = () => {
  const selectedType = useSelectedFittingType();
  const { setFittingType } = useToolActions();

  const handleSelectType = (type: FittingType) => {
    setFittingType(type);

    const catalogStore = useComponentLibraryStoreV2.getState();
    const found = catalogStore.catalogEntries.find((entry) => {
      if (!entry.placeable || entry.category !== 'fitting') {
        return false;
      }

      try {
        return resolveFittingType(entry) === type;
      } catch {
        return false;
      }
    });

    if (found) {
      catalogStore.selectEntry(found.id);
      return;
    }

    const activeEntry = catalogStore.getActiveEntry();
    if (activeEntry?.category === 'fitting') {
      catalogStore.selectEntry(null);
    }
  };

  return (
    <div
      className="fitting-type-selector flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200"
      data-testid="fitting-type-selector"
      role="toolbar"
      aria-label="Fitting type selection"
    >
      <span className="text-xs font-medium text-slate-600">Fitting Type:</span>
      <div className="flex gap-1">
        {FITTING_TYPES.map((type) => (
          <Button
            key={type.id}
            variant={selectedType === type.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectType(type.id)}
            className={cn('h-7 px-2 text-xs')}
            data-testid={`fitting-type-${type.id}`}
            aria-pressed={selectedType === type.id}
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
