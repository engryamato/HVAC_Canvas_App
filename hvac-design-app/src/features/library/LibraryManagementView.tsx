'use client';

import { useMemo, useState } from 'react';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';

export function LibraryManagementView() {
  const components = useComponentLibraryStoreV2((state) => state.components);
  const categories = useComponentLibraryStoreV2((state) => state.categories);
  const addComponent = useComponentLibraryStoreV2((state) => state.addComponent);
  const updateComponent = useComponentLibraryStoreV2((state) => state.updateComponent);
  const deleteComponent = useComponentLibraryStoreV2((state) => state.deleteComponent);
  const duplicateComponent = useComponentLibraryStoreV2((state) => state.duplicateComponent);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => components.find((item) => item.id === selectedId), [components, selectedId]);

  const handleCreate = () => {
    const firstCategory = categories[0]?.id ?? 'uncategorized';
    const now = new Date();

    const newComponent: UnifiedComponentDefinition = {
      id: `custom-${Date.now()}`,
      name: 'New Custom Component',
      category: firstCategory as 'duct' | 'fitting' | 'equipment' | 'accessory',
      type: 'accessory',
      materials: [],
      engineeringProperties: {
        frictionFactor: 0.0005,
        maxVelocity: 2000,
      },
      pricing: {
        materialCost: 0,
        laborUnits: 0,
        wasteFactor: 0.1,
      },
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    addComponent(newComponent);
  };

  return (
    <div className="grid h-full grid-cols-[280px_1fr] gap-3 p-3">
      <div className="space-y-2 rounded border p-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Components</h3>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={handleCreate}>
            Add
          </button>
        </div>
        <div className="space-y-1 overflow-y-auto">
          {components.map((component) => (
            <button
              key={component.id}
              type="button"
              onClick={() => setSelectedId(component.id)}
              className={`w-full rounded border px-2 py-1 text-left text-xs ${
                selectedId === component.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200'
              }`}
            >
              <div className="font-medium">{component.name}</div>
              <div className="text-[11px]">{component.type}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded border p-3">
        <div className="flex flex-wrap gap-2">
          {selected ? (
            <>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => duplicateComponent(selected.id)}>
                Duplicate
              </button>
              <button type="button" className="rounded border px-2 py-1 text-xs text-red-700" onClick={() => deleteComponent(selected.id)}>
                Delete
              </button>
            </>
          ) : null}
        </div>

        {selected ? (
          <div className="space-y-2">
            <label className="block text-xs font-medium">Name</label>
            <input
              className="w-full rounded border px-2 py-1 text-sm"
              value={selected.name}
              onChange={(event) => updateComponent(selected.id, { name: event.target.value, updatedAt: new Date() })}
            />
            <label className="block text-xs font-medium">Description</label>
            <textarea
              className="h-24 w-full rounded border px-2 py-1 text-sm"
              value={selected.description ?? ''}
              onChange={(event) => updateComponent(selected.id, { description: event.target.value, updatedAt: new Date() })}
            />
          </div>
        ) : (
          <div className="text-sm text-slate-500">Select a component to edit.</div>
        )}
      </div>
    </div>
  );
}

export default LibraryManagementView;
