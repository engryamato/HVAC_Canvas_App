'use client';

import { useMemo, useState } from 'react';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useToolActions } from '@/core/store/canvas.store';
import type { FittingType } from '@/core/schema/fitting.schema';

export function UnifiedComponentBrowser() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  // Use the new unified V2 store
  const components = useComponentLibraryStoreV2((state) => state.components);
  const categories = useComponentLibraryStoreV2((state) => state.categories);
  const activeComponentId = useComponentLibraryStoreV2((state) => state.activeComponentId);
  const activateComponent = useComponentLibraryStoreV2((state) => state.activateComponent);
  const getFilteredComponents = useComponentLibraryStoreV2((state) => state.getFilteredComponents);
  
  const { setTool, setFittingType } = useToolActions();

  const filteredComponents = useMemo(() => {
    if (!query) return components;
    return getFilteredComponents();
  }, [query, components, getFilteredComponents]);

  const filteredIds = useMemo(
    () => new Set(filteredComponents.map((item) => item.id)),
    [filteredComponents]
  );

  const activateFromComponent = (componentId: string) => {
    const component = components.find((item) => item.id === componentId);
    if (!component) return;

    activateComponent(component.id);

    switch (component.category) {
      case 'duct':
        setTool('duct');
        break;
      case 'fitting':
        setFittingType((component.subtype ?? 'elbow_90') as FittingType);
        setTool('fitting');
        break;
      case 'equipment':
        setTool('equipment');
        break;
      default:
        setTool('select');
    }
  };

  const categoryNodes = useMemo(() => {
    const map = new Map<string, typeof categories[number]>();

    const flatten = (nodes: typeof categories) => {
      for (const node of nodes) {
        map.set(node.id, node);
        flatten(node.subcategories ?? []);
      }
    };

    flatten(categories);

    const candidateRoots = categories.filter(
      (cat) => !cat.parentId || !map.has(cat.parentId)
    );
    return candidateRoots.length > 0 ? candidateRoots : categories;
  }, [categories]);

  const renderNode = (categoryId: string, depth = 0) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return null;

    const children = category.subcategories ?? [];
    const categoryItems = components.filter(
      (item) => item.category === category.id && filteredIds.has(item.id)
    );
    const isExpanded = expanded[category.id] ?? true;

    if (categoryItems.length === 0 && children.length === 0) return null;

    return (
      <div key={category.id} className="space-y-1">
        <button
          type="button"
          onClick={() =>
            setExpanded((prev) => ({ ...prev, [category.id]: !isExpanded }))
          }
          className="flex w-full items-center justify-between rounded px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          style={{ paddingLeft: `${8 + depth * 10}px` }}
        >
          <span>{category.name}</span>
          {children.length > 0 && (
            <span className="text-[10px] text-slate-500">
              {isExpanded ? '▾' : '▸'}
            </span>
          )}
        </button>

        {isExpanded && (
          <div className="space-y-1">
            {categoryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => activateFromComponent(item.id)}
                className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  activeComponentId === item.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                style={{ paddingLeft: `${12 + (depth + 1) * 10}px` }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.manufacturer && (
                    <span className="text-[10px] text-slate-400">
                      {item.manufacturer}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {children.map((child) => renderNode(child.id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-3 border-b border-slate-200">
        <input
          type="text"
          placeholder="Search components..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {categoryNodes.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8">
            No categories available
          </div>
        ) : (
          <div className="space-y-1">
            {categoryNodes.map((node) => renderNode(node.id))}
          </div>
        )}
      </div>

      {activeComponentId && (
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">Active Component</div>
          <div className="text-sm font-medium text-slate-800">
            {components.find((c) => c.id === activeComponentId)?.name || 'Unknown'}
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedComponentBrowser;
