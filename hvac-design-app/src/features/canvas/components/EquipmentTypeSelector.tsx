'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSelectedEquipmentType, useToolActions } from '@/core/store/canvas.store';
import type { EquipmentType } from '@/core/schema/equipment.schema';

const EQUIPMENT_TYPES: Array<{ id: EquipmentType; label: string }> = [
  { id: 'hood', label: 'Hood' },
  { id: 'fan', label: 'Fan' },
  { id: 'diffuser', label: 'Diffuser' },
  { id: 'damper', label: 'Damper' },
  { id: 'air_handler', label: 'Air Handler' },
  { id: 'furnace', label: 'Furnace' },
  { id: 'rtu', label: 'RTU' },
];

export const EquipmentTypeSelector: React.FC = () => {
  const selectedType = useSelectedEquipmentType();
  const { setEquipmentType } = useToolActions();

  return (
    <div
      className="equipment-type-selector flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200"
      data-testid="equipment-type-selector"
      role="toolbar"
      aria-label="Equipment type selection"
    >
      <span className="text-xs font-medium text-slate-600">Equipment Type:</span>
      <div className="flex gap-1">
        {EQUIPMENT_TYPES.map((type) => (
          <Button
            key={type.id}
            variant={selectedType === type.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEquipmentType(type.id)}
            className={cn('h-7 px-2 text-xs')}
            data-testid={`equipment-type-${type.id}`}
            aria-pressed={selectedType === type.id}
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
