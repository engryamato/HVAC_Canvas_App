'use client';

import { useMemo, useState } from 'react';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useToolActions } from '@/core/store/canvas.store';
import type { FittingType } from '@/core/schema/fitting.schema';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';

export function LibraryManagementView() {
  const components = useComponentLibraryStoreV2((state) => state.components);
  const categories = useComponentLibraryStoreV2((state) => state.categories);
  const addComponent = useComponentLibraryStoreV2((state) => state.addComponent);
  const updateComponent = useComponentLibraryStoreV2((state) => state.updateComponent);
  const deleteComponent = useComponentLibraryStoreV2((state) => state.deleteComponent);
  const duplicateComponent = useComponentLibraryStoreV2((state) => state.duplicateComponent);
  const activateComponent = useComponentLibraryStoreV2((state) => state.activateComponent);

  const { setTool, setFittingType } = useToolActions();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => components.find((item) => item.id === selectedId),
    [components, selectedId]
  );

  const handleCreate = () => {
    const firstCategory = categories[0]?.id ?? 'uncategorized';
    const now = new Date();

    addComponent({
      id: `custom-${Date.now()}`,
      name: 'New Custom Component',
      category: firstCategory,
      type: 'accessory',
      materials: [],
      engineeringProperties: {
        frictionFactor: 0.0005,
        maxVelocity: 2000,
      },
      pricing: {
        materialCost: 0,
        laborUnits: 0,
        wasteFactor: 0,
      },
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    } as UnifiedComponentDefinition);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this library component?')) {
      return;
    }
    deleteComponent(id);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const activateForTooling = (component: UnifiedComponentDefinition) => {
    activateComponent(component.id);

    if (component.type === 'duct') {
      setTool('duct');
      return;
    }

    if (component.type === 'fitting') {
      setFittingType((component.subtype ?? 'elbow_90') as FittingType);
      setTool('fitting');
      return;
    }

    if (component.type === 'equipment') {
      setTool('equipment');
      return;
    }

    setTool('select');
  };

  return (
    <div className="grid h-full grid-cols-[320px_1fr] gap-3 p-3" data-testid="library-management-view">
      <aside className="space-y-2 rounded border p-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Library Components</h3>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={handleCreate}>
            Add
          </button>
        </div>

        <div className="max-h-[540px] space-y-1 overflow-y-auto">
          {components.map((component) => (
            <button
              key={component.id}
              type="button"
              onClick={() => setSelectedId(component.id)}
              className={`w-full rounded border px-2 py-1 text-left text-xs ${
                selectedId === component.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200'
              }`}
              data-testid={`library-item-${component.id}`}
            >
              <div className="font-medium">{component.name}</div>
              <div className="text-[11px]">
                {component.type} · {component.category}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-3 rounded border p-3">
        {selected ? (
          <div className="space-y-3 rounded border border-slate-200 p-3" data-testid="library-editor">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => duplicateComponent(selected.id)}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs text-red-700"
                onClick={() => handleDelete(selected.id)}
              >
                Delete
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => activateForTooling(selected)}
              >
                Activate in Tooling
              </button>
            </div>

            <label htmlFor="library-component-name" className="block text-xs font-medium">
              Name
            </label>
            <input
              id="library-component-name"
              className="w-full rounded border px-2 py-1 text-sm"
              value={selected.name}
              title="Component name"
              onChange={(event) => updateComponent(selected.id, { name: event.target.value })}
            />

            <label htmlFor="library-component-category" className="block text-xs font-medium">
              Category
            </label>
            <input
              id="library-component-category"
              className="w-full rounded border px-2 py-1 text-sm"
              value={selected.category}
              title="Component category"
              onChange={(event) => updateComponent(selected.id, { category: (event.target.value || 'uncategorized') as 'duct' | 'fitting' | 'equipment' | 'accessory' })}
            />

            <label htmlFor="library-component-description" className="block text-xs font-medium">
              Description
            </label>
            <textarea
              id="library-component-description"
              className="h-24 w-full rounded border px-2 py-1 text-sm"
              value={selected.description ?? ''}
              title="Component description"
              onChange={(event) => updateComponent(selected.id, { description: event.target.value })}
            />
          </div>
        ) : (
          <div className="rounded border border-dashed p-4 text-sm text-slate-500">Select a component to edit.</div>
        )}
      </section>
    </div>
  );
}

export default LibraryManagementView;
