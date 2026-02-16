/**
 * ValidationDashboard
 *
 * Shows validation status grouped by service and allows navigating/fixing issues.
 */
import { useMemo, useState } from 'react';
import { useValidationStore } from '@/core/store/validationStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { Button } from '@/components/ui/button';
import { ResolutionWizard } from './ResolutionWizard';

export function ValidationDashboard() {
  const [resolveEntityId, setResolveEntityId] = useState<string | null>(null);
  const validationResults = useValidationStore((state) => state.validationResults);
  const exportBlockers = useValidationStore((state) => state.exportBlockers);
  const unresolvedCatalogItems = useValidationStore((state) => state.unresolvedCatalogItems);
  const entities = useEntityStore((state) => state.byId);
  const components = useComponentLibraryStoreV2((state) => state.components);
  const selectSingle = useSelectionStore((state) => state.selectSingle);

  const issuesByService = useMemo(() => {
    const grouped: Record<
      string,
      { serviceName: string; blockers: Set<string>; warnings: Set<string>; unresolved: Set<string> }
    > = {};
    const componentById = new Map(components.map((component) => [component.id, component]));
    const resolveServiceName = (serviceId: string) => {
      return componentById.get(serviceId)?.name || 'Unknown Service';
    };

    Object.entries(validationResults).forEach(([entityId, result]) => {
      const serviceId = result.serviceId || 'unknown';
      const serviceName = resolveServiceName(serviceId);

      if (!grouped[serviceId]) {
        grouped[serviceId] = { serviceName, blockers: new Set(), warnings: new Set(), unresolved: new Set() };
      }

      if (result.violations.some((v) => v.severity === 'blocker')) {
        grouped[serviceId].blockers.add(entityId);
      }
      if (result.violations.some((v) => v.severity === 'warning')) {
        grouped[serviceId].warnings.add(entityId);
      }
      if (result.catalogStatus === 'unresolved') {
        grouped[serviceId].unresolved.add(entityId);
      }
    });

    Object.values(entities).forEach((entity) => {
      if (entity.type !== 'duct' && entity.type !== 'fitting' && entity.type !== 'equipment') {
        return;
      }

      const serviceId = entity.props.serviceId || 'unknown';
      const serviceName = resolveServiceName(serviceId);

      if (!grouped[serviceId]) {
        grouped[serviceId] = { serviceName, blockers: new Set(), warnings: new Set(), unresolved: new Set() };
      }

      const constraintStatus = 'constraintStatus' in entity.props
        ? (entity.props as { constraintStatus?: { violations?: Array<{ severity: 'error' | 'warning' | 'info' }> } }).constraintStatus
        : undefined;
      const violations = constraintStatus?.violations ?? [];
      if (violations.some((violation: { severity: 'error' | 'warning' | 'info' }) => violation.severity === 'error')) {
        grouped[serviceId].blockers.add(entity.id);
      }
      if (violations.some((violation: { severity: 'error' | 'warning' | 'info' }) => violation.severity === 'warning')) {
        grouped[serviceId].warnings.add(entity.id);
      }

      const warningViolations =
        'warnings' in entity && entity.warnings && 'constraintViolations' in entity.warnings
          ? (entity.warnings as { constraintViolations?: string[] }).constraintViolations
          : undefined;
      if ((warningViolations?.length ?? 0) > 0) {
        grouped[serviceId].warnings.add(entity.id);
      }
    });

    return Object.fromEntries(
      Object.entries(grouped).map(([serviceId, serviceData]) => [
        serviceId,
        {
          serviceName: serviceData.serviceName,
          blockers: Array.from(serviceData.blockers),
          warnings: Array.from(serviceData.warnings),
          unresolved: Array.from(serviceData.unresolved),
        },
      ])
    );
  }, [components, entities, validationResults]);

  const constraintIssues = useMemo(() => {
    return Object.values(entities).reduce((count, entity) => {
      if (entity.type !== 'duct' && entity.type !== 'fitting' && entity.type !== 'equipment') {
        return count;
      }
      const constraintStatus = 'constraintStatus' in entity.props
        ? (entity.props as { constraintStatus?: { violations?: unknown[] } }).constraintStatus
        : undefined;
      const warningFallback =
        'warnings' in entity && entity.warnings && 'constraintViolations' in entity.warnings
          ? (entity.warnings as { constraintViolations?: string[] }).constraintViolations
          : undefined;
      const fromConstraintStatus = constraintStatus?.violations?.length ?? 0;
      const fromWarnings = warningFallback?.length ?? 0;
      return count + Math.max(fromConstraintStatus, fromWarnings);
    }, 0);
  }, [entities]);

  const totalIssues = exportBlockers.length + unresolvedCatalogItems.length + constraintIssues;

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
          {exportBlockers.length} export blockers, {unresolvedCatalogItems.length} unresolved items, {constraintIssues} constraint issues
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
