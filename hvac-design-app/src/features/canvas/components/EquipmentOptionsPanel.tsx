'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EQUIPMENT_CATEGORY_MAP,
  EQUIPMENT_TYPE_ABBREV,
  EQUIPMENT_TYPE_LABELS,
} from '@/core/schema/equipment.schema';
import type { EquipmentCategory, EquipmentType } from '@/core/schema/equipment.schema';
import {
  useEquipmentPlacementDraft,
  useToolActions,
  type EquipmentPlacementDraft,
} from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  air_handling: 'Air Handling',
  terminal_units: 'Terminal Units',
  fans: 'Fans',
  air_devices: 'Air Devices',
  dampers: 'Dampers',
  heating: 'Heating',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as EquipmentCategory[];

export function EquipmentOptionsPanel() {
  const draft = useEquipmentPlacementDraft();
  const {
    setEquipmentPlacementDraft,
    resetEquipmentPlacementDraft,
    applyEquipmentCatalogEntry,
    setEquipmentPlacementDialogOpen,
    setStatusMessage,
  } = useToolActions();
  const catalogEntries = useUnifiedCatalogStore((state) => state.catalogEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setEquipmentPlacementDialogOpen(true);
    return () => setEquipmentPlacementDialogOpen(false);
  }, [setEquipmentPlacementDialogOpen]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return catalogEntries.filter((entry) => {
      if (entry.componentClass !== 'equipment') return false;
      if (selectedCategory !== 'all' && entry.categoryId !== selectedCategory) return false;
      if (!query) return true;
      return [entry.name, entry.typeId, ...(entry.tags ?? [])].join(' ').toLowerCase().includes(query);
    });
  }, [catalogEntries, searchQuery, selectedCategory]);

  const typeOptionGroups = useMemo(
    () =>
      ALL_CATEGORIES.map((category) => ({
        label: CATEGORY_LABELS[category],
        types: EQUIPMENT_CATEGORY_MAP[category],
      })),
    []
  );

  const patch = useCallback(
    (partial: Partial<EquipmentPlacementDraft>) => setEquipmentPlacementDraft(partial),
    [setEquipmentPlacementDraft]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => undefined, 150);
  }, []);

  const handleSelectEntry = useCallback(
    (entryId: string) => {
      if (entryId === '__custom__') {
        setEquipmentPlacementDraft({ catalogEntryId: null });
        return;
      }
      const entry = catalogEntries.find((candidate) => candidate.id === entryId);
      if (entry) {
        applyEquipmentCatalogEntry(entry);
      }
    },
    [applyEquipmentCatalogEntry, catalogEntries, setEquipmentPlacementDraft]
  );

  const handleTypeChange = useCallback(
    (type: EquipmentType) => {
      resetEquipmentPlacementDraft(type);
    },
    [resetEquipmentPlacementDraft]
  );

  const handleCapacityUnitChange = useCallback(
    (unit: 'CFM' | 'm3/h') => {
      if (unit === draft.capacityUnit) return;
      patch({
        capacityUnit: unit,
        capacity: unit === 'm3/h' ? Math.round(draft.capacity * 1.699) : Math.round(draft.capacity / 1.699),
      });
    },
    [draft.capacity, draft.capacityUnit, patch]
  );

  const handlePlace = useCallback(() => {
    setEquipmentPlacementDialogOpen(false);
    setStatusMessage(`Placing ${draft.name} - click canvas to place`);
  }, [draft.name, setEquipmentPlacementDialogOpen, setStatusMessage]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-sm" data-testid="equipment-options-panel">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1.4fr_auto]">
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Equipment</div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="h-9 pl-8"
              placeholder="Search catalog"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as EquipmentCategory | 'all')}>
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                {ALL_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={draft.catalogEntryId ?? '__custom__'} onValueChange={handleSelectEntry}>
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Catalog item" />
              </SelectTrigger>
              <SelectContent>
                {filteredEntries.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="space-y-1">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Name</Label>
            <Input className="h-9" value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Type</Label>
            <Select value={draft.equipmentType} onValueChange={(value) => handleTypeChange(value as EquipmentType)}>
              <SelectTrigger className="h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptionGroups.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {EQUIPMENT_TYPE_LABELS[type]} ({EQUIPMENT_TYPE_ABBREV[type]})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Airflow</Label>
            <Input
              className="h-9"
              min={0}
              type="number"
              value={draft.capacity}
              onChange={(event) => patch({ capacity: Number(event.target.value) })}
            />
          </label>
          <label className="space-y-1">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Unit</Label>
            <Select value={draft.capacityUnit} onValueChange={(value) => handleCapacityUnitChange(value as 'CFM' | 'm3/h')}>
              <SelectTrigger className="h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CFM">CFM</SelectItem>
                <SelectItem value="m3/h">m3/h</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Static</Label>
            <Input
              className="h-9"
              min={0}
              step={0.05}
              type="number"
              value={draft.staticPressure}
              onChange={(event) => patch({ staticPressure: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className="flex min-w-32 flex-col justify-end gap-2">
          <div className="grid grid-cols-3 gap-1">
            {(['width', 'depth', 'height'] as const).map((field) => (
              <label key={field} className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-500">{field[0].toUpperCase()}</Label>
                <Input
                  className="h-9"
                  min={1}
                  type="number"
                  value={draft[field]}
                  onChange={(event) => patch({ [field]: Number(event.target.value) })}
                />
              </label>
            ))}
          </div>
          <Button type="button" className="h-9" onClick={handlePlace}>
            Place
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EquipmentOptionsPanel;
