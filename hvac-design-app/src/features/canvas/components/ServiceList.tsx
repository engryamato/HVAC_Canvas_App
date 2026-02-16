'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';

interface ServiceListProps {
  searchQuery: string;
}

export function ServiceList({ searchQuery }: ServiceListProps) {
  const components = useComponentLibraryStoreV2((state) => state.components);
  const activeComponentId = useComponentLibraryStoreV2((state) => state.activeComponentId);
  const activateComponent = useComponentLibraryStoreV2((state) => state.activateComponent);
  const duplicateComponent = useComponentLibraryStoreV2((state) => state.duplicateComponent);
  const deleteComponent = useComponentLibraryStoreV2((state) => state.deleteComponent);
  
  const [filterType, setFilterType] = useState<'all' | 'supply' | 'return' | 'exhaust'>('all');

  // Get services from components
  const services = useMemo(() => {
    return components
      .filter((component) => Boolean(component.systemType))
      .map((component) => adaptComponentToService(component));
  }, [components]);

  // Filter by system type
  const typeFilteredServices = useMemo(() => {
    if (filterType === 'all') {
      return services;
    }
    return services.filter((service) => service.systemType === filterType);
  }, [services, filterType]);

  // Filter by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return typeFilteredServices;
    }
    
    const query = searchQuery.toLowerCase();
    return typeFilteredServices.filter((service) =>
      service.name.toLowerCase().includes(query) ||
      service.systemType.toLowerCase().includes(query) ||
      service.material.toLowerCase().includes(query)
    );
  }, [typeFilteredServices, searchQuery]);

  const handleClone = (id: string) => {
    duplicateComponent(id);
  };

  const handleDelete = (id: string) => {
    if (globalThis.confirm('Delete this service?')) {
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

      {/* Service Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {filteredServices.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-sm text-slate-500">
            <div className="text-center">
              <p className="font-medium">No services found</p>
              <p className="mt-1 text-xs">Try a different filter or search term</p>
            </div>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className={`
                space-y-3 rounded-lg border p-4 transition-all
                ${
                  activeComponentId === service.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => activateComponent(service.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full shadow-sm"
                      style={{ backgroundColor: service.color ?? '#94a3b8' }}
                    />
                    <span className="font-medium text-sm text-slate-800">{service.name}</span>
                  </div>
                  {activeComponentId === service.id && (
                    <Badge variant="default" className="h-5 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {service.systemType} • {service.pressureClass} • {service.material}
                </p>
              </button>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleClone(service.id)}
                >
                  Clone
                </Button>
                {service.source === 'custom' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(service.id)}
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
