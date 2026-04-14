'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';

interface ServiceListProps {
  searchQuery: string;
}

export function ServiceList({ searchQuery }: ServiceListProps) {
  const components = useUnifiedCatalogStore((state) => state.components);
  const activeComponentId = useUnifiedCatalogStore((state) => state.activeComponentId);
  const activateComponent = useUnifiedCatalogStore((state) => state.activateComponent);
  const duplicateComponent = useUnifiedCatalogStore((state) => state.duplicateComponent);
  const deleteComponent = useUnifiedCatalogStore((state) => state.deleteComponent);
  
  const [filterType, setFilterType] = useState<'all' | 'supply' | 'return' | 'exhaust'>('all');

  // Derive the view model from unified catalog components.
  const catalogComponents = useMemo(() => {
    return components
      .filter((component) => Boolean(component.systemType))
      .map((component) => adaptComponentToService(component));
  }, [components]);

  // Filter by system type
  const typeFilteredComponents = useMemo(() => {
    if (filterType === 'all') {
      return catalogComponents;
    }
    return catalogComponents.filter((component) => component.systemType === filterType);
  }, [catalogComponents, filterType]);

  // Filter by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) {
      return typeFilteredComponents;
    }
    
    const query = searchQuery.toLowerCase();
    return typeFilteredComponents.filter((component) =>
      component.name.toLowerCase().includes(query) ||
      component.systemType.toLowerCase().includes(query) ||
      component.material.toLowerCase().includes(query)
    );
  }, [searchQuery, typeFilteredComponents]);

  const handleClone = (id: string) => {
    duplicateComponent(id);
  };

  const handleDelete = (id: string) => {
    if (globalThis.confirm('Delete this component?')) {
      deleteComponent(id);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'supply', 'return', 'exhaust'] as const).map((type) => (
          <Button
            key={type}
            variant={filterType === type ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs capitalize"
            onClick={() => setFilterType(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Catalog component cards */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {filteredComponents.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-sm text-slate-500">
            <div className="text-center">
              <p className="font-medium">No components found</p>
              <p className="mt-1 text-xs">Try a different filter or search term</p>
            </div>
          </div>
        ) : (
          filteredComponents.map((component) => (
            <div
              key={component.id}
              className={`
                space-y-3 rounded-lg border p-4 transition-all
                ${
                  activeComponentId === component.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => activateComponent(component.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full shadow-sm"
                      style={{ backgroundColor: component.color ?? '#94a3b8' }}
                    />
                    <span className="font-medium text-sm text-slate-800">{component.name}</span>
                  </div>
                  {activeComponentId === component.id && (
                    <Badge variant="default" className="h-5 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {component.systemType} • {component.pressureClass} • {component.material}
                </p>
              </button>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleClone(component.id)}
                >
                  Clone
                </Button>
                {component.source === 'custom' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(component.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
