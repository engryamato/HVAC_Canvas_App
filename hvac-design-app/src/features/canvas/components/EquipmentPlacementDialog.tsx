'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Search } from 'lucide-react';
import {
  EQUIPMENT_CATEGORY_MAP,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_ABBREV,
} from '@/core/schema/equipment.schema';
import type { EquipmentCategory, EquipmentType } from '@/core/schema/equipment.schema';
import type { EquipmentPlacementDraft } from '@/core/store/canvas.store';
import {
  useEquipmentPlacementDraft,
  useToolActions,
} from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  air_handling:   'Air Handling',
  terminal_units: 'Terminal Units',
  fans:           'Fans',
  air_devices:    'Air Devices',
  dampers:        'Dampers',
  heating:        'Heating',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as EquipmentCategory[];

/** Increment the trailing number in a name: "AHU-1" → "AHU-2" */
function autoIncrementName(name: string): string {
  return name.replace(/(\d+)$/, (_, n) => String(Number(n) + 1));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EquipmentPlacementDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EquipmentPlacementDialog({
  open,
  onConfirm,
  onCancel,
}: EquipmentPlacementDialogProps) {
  const draft = useEquipmentPlacementDraft();
  const {
    setEquipmentPlacementDraft,
    resetEquipmentPlacementDraft,
    applyEquipmentCatalogEntry,
  } = useToolActions();

  const catalogEntries = useUnifiedCatalogStore((s) => s.catalogEntries);

  // ── Local search state ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [open]);

  // ── Filtered equipment list ──────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return catalogEntries.filter((e) => {
      if (e.componentClass !== 'equipment') {return false;}
      // Category filter
      if (selectedCategory !== 'all' && e.categoryId !== selectedCategory) {return false;}
      // Search filter
      if (q) {
        const hay = [e.name, e.typeId, ...(e.tags ?? [])].join(' ').toLowerCase();
        if (!hay.includes(q)) {return false;}
      }
      return true;
    });
  }, [catalogEntries, searchQuery, selectedCategory]);

  // ── Search debounce ──────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) {clearTimeout(searchTimerRef.current);}
    searchTimerRef.current = setTimeout(() => {
      // Debounced — state already set above; no extra action needed
    }, 150);
  }, []);

  // ── Equipment selection ──────────────────────────────────────────────────
  const handleSelectEntry = useCallback(
    (entryId: string) => {
      if (entryId === '__custom__') {
        setEquipmentPlacementDraft({ catalogEntryId: null });
        return;
      }
      const entry = catalogEntries.find((e) => e.id === entryId);
      if (entry) {applyEquipmentCatalogEntry(entry);}
    },
    [catalogEntries, applyEquipmentCatalogEntry, setEquipmentPlacementDraft]
  );

  // ── Equipment type change ────────────────────────────────────────────────
  const handleTypeChange = useCallback(
    (type: EquipmentType) => {
      resetEquipmentPlacementDraft(type);
    },
    [resetEquipmentPlacementDraft]
  );

  // ── Field patches ────────────────────────────────────────────────────────
  const patch = useCallback(
    (partial: Partial<EquipmentPlacementDraft>) => setEquipmentPlacementDraft(partial),
    [setEquipmentPlacementDraft]
  );

  // ── Place button ─────────────────────────────────────────────────────────
  const handlePlace = useCallback(() => {
    onConfirm();
    // Pre-increment name so next placement is already incremented
    setEquipmentPlacementDraft({ name: autoIncrementName(draft.name) });
  }, [onConfirm, setEquipmentPlacementDraft, draft.name]);

  // ── CFM unit conversion ──────────────────────────────────────────────────
  const handleCapacityUnitChange = useCallback(
    (unit: 'CFM' | 'm3/h') => {
      if (unit === draft.capacityUnit) {return;}
      const converted =
        unit === 'm3/h'
          ? Math.round(draft.capacity * 1.699)
          : Math.round(draft.capacity / 1.699);
      patch({ capacityUnit: unit, capacity: converted });
    },
    [draft.capacity, draft.capacityUnit, patch]
  );

  // ── Currently selected entry ID ──────────────────────────────────────────
  const selectedEntryId = draft.catalogEntryId ?? '__custom__';

  // ── Grouped equipment type options ───────────────────────────────────────
  const typeOptionGroups = useMemo(() => {
    return ALL_CATEGORIES.map((cat) => ({
      label: CATEGORY_LABELS[cat],
      types: EQUIPMENT_CATEGORY_MAP[cat],
    }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place Equipment</DialogTitle>
        </DialogHeader>

        {/* ── SEARCH & SELECT section ─────────────────────────────────── */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Search & Select
          </p>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by name, model, type…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <Select
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as EquipmentCategory | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              {ALL_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Equipment selector */}
          {filteredEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">
              No equipment found. Configure specs below.
            </p>
          ) : (
            <Select value={selectedEntryId} onValueChange={handleSelectEntry}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment…" />
              </SelectTrigger>
              <SelectContent>
                {filteredEntries.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <span>{e.name}</span>
                      {e.keySpec && (
                        <span className="text-xs text-muted-foreground">{e.keySpec}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">
                  <span className="text-muted-foreground">＋ Custom (not in catalog)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div className="border-t my-2" />

        {/* ── CONFIGURE section ───────────────────────────────────────── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Configure: {EQUIPMENT_TYPE_LABELS[draft.equipmentType]}
          </p>

          {/* Identity */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium mb-1">Identity</legend>

            <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
              <Label htmlFor="eq-name" className="text-right text-sm">Name</Label>
              <Input
                id="eq-name"
                className="col-span-2"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
              />

              <Label htmlFor="eq-type" className="text-right text-sm">Type</Label>
              <div className="col-span-2">
                <Select value={draft.equipmentType} onValueChange={(v) => handleTypeChange(v as EquipmentType)}>
                  <SelectTrigger id="eq-type">
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
              </div>

              <Label htmlFor="eq-mfr" className="text-right text-sm">Manufacturer</Label>
              <Input
                id="eq-mfr"
                className="col-span-2"
                placeholder="Optional"
                value={draft.manufacturer}
                onChange={(e) => patch({ manufacturer: e.target.value })}
              />

              <Label htmlFor="eq-model" className="text-right text-sm">Model</Label>
              <Input
                id="eq-model"
                className="col-span-2"
                placeholder="Optional"
                value={draft.model}
                onChange={(e) => patch({ model: e.target.value })}
              />

              <Label htmlFor="eq-tag" className="text-right text-sm">Location Tag</Label>
              <Input
                id="eq-tag"
                className="col-span-2"
                placeholder="e.g. ROOF-1"
                value={draft.locationTag}
                onChange={(e) => patch({ locationTag: e.target.value })}
              />
            </div>
          </fieldset>

          {/* Performance */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium mb-1">Performance</legend>

            {/* CFM — large, prominent */}
            <div>
              <Label className="text-sm mb-1 block">Airflow</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1 h-14 text-xl text-center font-semibold"
                  type="number"
                  min={0}
                  value={draft.capacity}
                  onChange={(e) => patch({ capacity: Number(e.target.value) })}
                />
                <Select
                  value={draft.capacityUnit}
                  onValueChange={(v) => handleCapacityUnitChange(v as 'CFM' | 'm3/h')}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CFM">CFM</SelectItem>
                    <SelectItem value="m3/h">m³/h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Static pressure */}
            <div className="grid grid-cols-3 items-center gap-x-4">
              <Label className="text-right text-sm">Static Pressure</Label>
              <Input
                className="col-span-1"
                type="number"
                min={0}
                step={0.05}
                value={draft.staticPressure}
                onChange={(e) => patch({ staticPressure: Number(e.target.value) })}
              />
              <Select
                value={draft.staticPressureUnit}
                onValueChange={(v) => patch({ staticPressureUnit: v as 'in_wg' | 'Pa' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_wg">in w.g.</SelectItem>
                  <SelectItem value="Pa">Pa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          {/* Dimensions */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-1">Dimensions (inches)</legend>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="eq-w" className="text-xs text-muted-foreground block mb-1">Width</Label>
                <Input
                  id="eq-w"
                  type="number"
                  min={1}
                  value={draft.width}
                  onChange={(e) => patch({ width: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="eq-d" className="text-xs text-muted-foreground block mb-1">Depth</Label>
                <Input
                  id="eq-d"
                  type="number"
                  min={1}
                  value={draft.depth}
                  onChange={(e) => patch({ depth: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="eq-h" className="text-xs text-muted-foreground block mb-1">Height</Label>
                <Input
                  id="eq-h"
                  type="number"
                  min={1}
                  value={draft.height}
                  onChange={(e) => patch({ height: Number(e.target.value) })}
                />
              </div>
            </div>
          </fieldset>

          {/* Engineering System */}
          <div className="grid grid-cols-3 items-center gap-x-4">
            <Label className="text-right text-sm">Eng. System</Label>
            <div className="col-span-2">
              <Select
                value={draft.engineeringSystem}
                onValueChange={(v) =>
                  patch({ engineeringSystem: v as EquipmentPlacementDraft['engineeringSystem'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_duct">Standard Duct</SelectItem>
                  <SelectItem value="universal">Universal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handlePlace}>
            Place Equipment ✓
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EquipmentPlacementDialog;
