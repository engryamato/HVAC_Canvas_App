/**
 * ValidationDashboard
 *
 * Shows validation status grouped by service and allows navigating/fixing issues.
 */
import { useMemo, useState } from 'react';
import { useServiceStore } from '@/core/store/serviceStore';
import { useValidationStore } from '@/core/store/validationStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { Button } from '@/components/ui/button';
import { ResolutionWizard } from './ResolutionWizard';

export function ValidationDashboard() {
  const [resolveEntityId, setResolveEntityId] = useState<string | null>(null);
  const validationResults = useValidationStore((state) => state.validationResults);
  const exportBlockers = useValidationStore((state) => state.exportBlockers);
  const unresolvedCatalogItems = useValidationStore((state) => state.unresolvedCatalogItems);
  const services = useServiceStore((state) => state.services);
  const templates = useServiceStore((state) => state.baselineTemplates);
  const selectSingle = useSelectionStore((state) => state.selectSingle);

  const issuesByService = useMemo(() => {
    const grouped: Record<
      string,
      { serviceName: string; blockers: string[]; warnings: string[]; unresolved: string[] }
    > = {};

    Object.entries(validationResults).forEach(([entityId, result]) => {
      const serviceId = result.serviceId || 'unknown';
      const service = services[serviceId] || templates.find((t) => t.id === serviceId);
      const serviceName = service?.name || 'Unknown Service';

      if (!grouped[serviceId]) {
        grouped[serviceId] = { serviceName, blockers: [], warnings: [], unresolved: [] };
      }

      if (result.violations.some((v) => v.severity === 'blocker')) {
        grouped[serviceId].blockers.push(entityId);
      }
      if (result.violations.some((v) => v.severity === 'warning')) {
        grouped[serviceId].warnings.push(entityId);
      }
      if (result.catalogStatus === 'unresolved') {
        grouped[serviceId].unresolved.push(entityId);
      }
    });

    return grouped;
  }, [services, templates, validationResults]);

  const totalIssues = exportBlockers.length + unresolvedCatalogItems.length;

  const handleEntityClick = (entityId: string) => {
    selectSingle(entityId);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Validation Status</h3>
          {totalIssues === 0 ? (
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              All Clear
            </span>
          ) : (
            <span className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
              {totalIssues} Issue{totalIssues > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {exportBlockers.length} export blockers, {unresolvedCatalogItems.length} unresolved items
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.keys(issuesByService).length === 0 ? (
          <div className="rounded border border-dashed p-6 text-center text-sm text-slate-500">No validation issues</div>
        ) : (
          Object.entries(issuesByService).map(([serviceId, data]) => (
            <div key={serviceId} className="rounded border p-3 space-y-2">
              <div className="text-sm font-medium">{data.serviceName}</div>

              {data.blockers.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-700">{data.blockers.length} Critical</p>
                  {data.blockers.slice(0, 3).map((entityId) => (
                    <Button
                      key={entityId}
                      variant="ghost"
                      size="sm"
                      className="h-auto w-full justify-start px-2 py-1 text-xs"
                      onClick={() => handleEntityClick(entityId)}
                    >
                      {validationResults[entityId]?.violations[0]?.message || 'Blocker issue'}
                    </Button>
                  ))}
                </div>
              ) : null}

              {data.warnings.length > 0 ? (
                <p className="text-xs font-medium text-amber-700">{data.warnings.length} Warnings</p>
              ) : null}

              {data.unresolved.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700">{data.unresolved.length} Unresolved</p>
                  {data.unresolved.slice(0, 3).map((entityId) => (
                    <div key={entityId} className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto flex-1 justify-start px-2 py-1 text-xs"
                        onClick={() => handleEntityClick(entityId)}
                      >
                        {validationResults[entityId]?.catalogMessage || 'Unresolved catalog item'}
                      </Button>
                      <Button size="sm" className="h-7 text-xs" onClick={() => setResolveEntityId(entityId)}>
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {resolveEntityId ? (
        <ResolutionWizard open={Boolean(resolveEntityId)} entityId={resolveEntityId} onClose={() => setResolveEntityId(null)} />
      ) : null}
    </div>
  );
}

