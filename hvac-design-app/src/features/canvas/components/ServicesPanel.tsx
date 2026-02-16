/**
 * ServicesPanel
 *
 * Displays baseline and custom services and allows activating, cloning, and deleting custom entries.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';

export function ServicesPanel() {
  const components = useComponentLibraryStoreV2((state) => state.components);
  const activeComponentId = useComponentLibraryStoreV2((state) => state.activeComponentId);
  const activateComponent = useComponentLibraryStoreV2((state) => state.activateComponent);
  const duplicateComponent = useComponentLibraryStoreV2((state) => state.duplicateComponent);
  const deleteComponent = useComponentLibraryStoreV2((state) => state.deleteComponent);
  const [filterType, setFilterType] = useState<'all' | 'supply' | 'return' | 'exhaust'>('all');

  const services = components
    .filter((component) => Boolean(component.systemType))
    .map((component) => adaptComponentToService(component));

  const filteredServices = services.filter((service) => {
    if (filterType === 'all') {
      return true;
    }
    return service.systemType === filterType;
  });

  const handleClone = (id: string) => {
    duplicateComponent(id);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="space-y-2">
        <h2 className="text-base font-semibold">Services</h2>
        <div className="flex flex-wrap gap-2">
          {(['all', 'supply', 'return', 'exhaust'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilterType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredServices.length === 0 ? (
          <div className="rounded border border-dashed p-4 text-sm text-slate-500">No services found for this filter.</div>
        ) : null}
        {filteredServices.map((service) => (
          <div
              key={service.id}
              className={cn(
                'rounded border p-3 space-y-2',
                activeComponentId === service.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
              )}
              data-testid={`service-card-${service.id}`}
            >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => activateComponent(service.id)}
              data-testid={`service-select-${service.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: service.color ?? '#94a3b8' }} />
                  <span className="font-medium text-sm">{service.name}</span>
                </div>
                {activeComponentId === service.id ? <span className="text-[11px] font-medium text-blue-700">Active</span> : null}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {service.systemType} • {service.pressureClass} • {service.material}
              </p>
            </button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleClone(service.id)}>
                Clone
              </Button>
              {service.source === 'custom' ? (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => deleteComponent(service.id)}>
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
