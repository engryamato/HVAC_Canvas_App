/**
 * ValidationDashboard
 *
 * Shows validation status grouped by service and allows navigating/fixing issues.
 */
import { useMemo, useState } from 'react';
import { useValidationStore } from '@/core/store/validationStore';
import { buildOverlayStatusMap, type DuctOverlayMode, useDuctOverlayStore } from '@/core/store/ductOverlayStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { Button } from '@/components/ui/button';
import { ResolutionWizard } from './ResolutionWizard';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import { ConnectionGraphBuilder } from '@/core/services/graph/ConnectionGraphBuilder';
import { TopologyValidationService } from '@/core/services/graph/TopologyValidationService';
import {
  createEntity,
  deleteEntity,
  updateEntity as updateEntityCommand,
} from '@/core/commands/entityCommands';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ValidationDashboard() {
  type ManualOverrideResetPlan = NonNullable<ReturnType<typeof fittingInsertionService.planManualOverrideReset>>;
  const [resolveEntityId, setResolveEntityId] = useState<string | null>(null);
  const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
  const validationResults = useValidationStore((state) => state.validationResults);
  const exportBlockers = useValidationStore((state) => state.exportBlockers);
  const unresolvedCatalogItems = useValidationStore((state) => state.unresolvedCatalogItems);
  const entities = useEntityStore((state) => state.byId);
  const overlayMode = useDuctOverlayStore((state) => state.overlayMode);
  const setOverlayMode = useDuctOverlayStore((state) => state.setOverlayMode);
  const setOverlayStatusMap = useDuctOverlayStore((state) => state.setOverlayStatusMap);
  const components = useComponentLibraryStoreV2((state) => state.components);
  const selectSingle = useSelectionStore((state) => state.selectSingle);
  const selectedIds = useSelectionStore((state) => state.selectedIds);

  const pushToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent('sws:toast', { detail: { message, type } }));
  };

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
  const selectedEntity = selectedIds.length === 1 ? entities[selectedIds[0] ?? ''] : null;
  const selectedOverrideFitting =
    selectedEntity?.type === 'fitting' && selectedEntity.props.manualOverride ? selectedEntity : null;
  const manualOverrideCount = useMemo(
    () =>
      Object.values(entities).filter(
        (entity) => entity.type === 'fitting' && entity.props.autoInserted && entity.props.manualOverride
      ).length,
    [entities]
  );
  const autoFittingPlan = useMemo(() => fittingInsertionService.buildReRunPlan(entities), [entities]);
  const autoFittingPlanSummary = useMemo(() => {
    const insertCount = autoFittingPlan.changes.filter((change) => change.action === 'insert').length;
    const updateCount = autoFittingPlan.changes.filter((change) => change.action === 'update').length;
    const removeCount = autoFittingPlan.changes.filter((change) => change.action === 'remove').length;
    const conflictCount = autoFittingPlan.changes.filter((change) => Boolean(change.conflictReason)).length;
    return { insertCount, updateCount, removeCount, conflictCount };
  }, [autoFittingPlan]);

  const handleEntityClick = (entityId: string) => {
    selectSingle(entityId);
  };

  const handleRerunAutoFitting = () => {
    const selection = [...selectedIds];
    const plan = autoFittingPlan;
    const result = fittingInsertionService.resolveReRunPlan(plan, entities);

    for (const operation of result.operations) {
      if (operation.action === 'insert') {
        createEntity(operation.next, {
          selectionBefore: selection,
          selectionAfter: selection,
        });
        continue;
      }

      if (operation.action === 'remove') {
        deleteEntity(operation.previous, {
          selectionBefore: selection,
          selectionAfter: selection,
        });
        continue;
      }

      updateEntityCommand(
        operation.next.id,
        {
          props: operation.next.props,
          transform: operation.next.transform,
          modifiedAt: operation.next.modifiedAt,
        },
        operation.previous,
        {
          selectionBefore: selection,
          selectionAfter: selection,
        }
      );
    }

    const conflictConversions = plan.changes.filter((change) => Boolean(change.conflictReason)).length;
    const conflictMessage =
      conflictConversions > 0
        ? `, ${conflictConversions} conflict${conflictConversions === 1 ? '' : 's'} converted`
        : '';
    pushToast(
      `${result.insertedOrUpdatedCount} fittings inserted/updated, ${result.manualOverridesPreserved} manual overrides preserved${conflictMessage}`,
      'success'
    );
  };

  const handleOverlayModeChange = (mode: DuctOverlayMode) => {
    setOverlayMode(mode);
    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(entities);
    const topologyResults = TopologyValidationService.validate(graph, entities);
    setOverlayStatusMap(buildOverlayStatusMap(entities, topologyResults, mode));
  };

  const handleResetSelectedOverride = () => {
    if (!selectedOverrideFitting) {
      return;
    }

    const reset = fittingInsertionService.planManualOverrideReset(selectedOverrideFitting.id, entities);

    if (!reset) {
      return;
    }

    updateEntityCommand(
      reset.next.id,
      {
        props: reset.next.props,
        transform: reset.next.transform,
        modifiedAt: reset.next.modifiedAt,
      },
      reset.previous,
      {
        selectionBefore: [selectedOverrideFitting.id],
        selectionAfter: [selectedOverrideFitting.id],
      }
    );
    pushToast('Selected fitting reset to auto', 'success');
  };

  const handleResetAllManualOverrides = () => {
    const selection = [...selectedIds];
    const resetPlans: ManualOverrideResetPlan[] = [];
    for (const fittingId of fittingInsertionService.getManualOverrideFittingIds(entities)) {
      const reset = fittingInsertionService.planManualOverrideReset(fittingId, entities);
      if (reset) {
        resetPlans.push(reset);
      }
    }

    for (const reset of resetPlans) {
      updateEntityCommand(
        reset.next.id,
        {
          props: reset.next.props,
          transform: reset.next.transform,
          modifiedAt: reset.next.modifiedAt,
        },
        reset.previous,
        {
          selectionBefore: selection,
          selectionAfter: selection,
        }
      );
    }
    setConfirmResetAllOpen(false);

    const resetCount = resetPlans.length;
    pushToast(`${resetCount} manual override${resetCount === 1 ? '' : 's'} reset`, 'success');
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
        <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Duct Color Overlay
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['off', 'Off'],
              ['velocity', 'By Velocity'],
              ['pressure', 'By Pressure'],
            ].map(([mode, label]) => (
              <label
                key={mode}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                  overlayMode === mode
                    ? 'border-blue-500 bg-blue-50 font-semibold text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="duct-color-overlay"
                  value={mode}
                  checked={overlayMode === mode}
                  onChange={() => handleOverlayModeChange(mode as DuctOverlayMode)}
                  className="h-3 w-3"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-2">
          <Button type="button" className="w-full" onClick={handleRerunAutoFitting} data-testid="rerun-autofitting">
            Re-run Auto-Fitting
          </Button>
          <p className="text-xs text-slate-500" data-testid="autofitting-plan-summary">
            {autoFittingPlanSummary.insertCount} insert planned, {autoFittingPlanSummary.updateCount} update planned,{' '}
            {autoFittingPlanSummary.removeCount} remove planned
            {autoFittingPlanSummary.conflictCount > 0
              ? `, ${autoFittingPlanSummary.conflictCount} conflict conversion${autoFittingPlanSummary.conflictCount === 1 ? '' : 's'}`
              : ''}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResetSelectedOverride}
            disabled={!selectedOverrideFitting}
            data-testid="reset-selected-override"
          >
            Reset Selected Override
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setConfirmResetAllOpen(true)}
            data-testid="reset-all-overrides"
          >
            Reset All Manual Overrides
          </Button>
          <p className="text-xs text-slate-500">
            {manualOverrideCount} locked override{manualOverrideCount === 1 ? '' : 's'} currently preserved from auto-fitting.
          </p>
        </div>

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

      <Dialog open={confirmResetAllOpen} onOpenChange={setConfirmResetAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all manual overrides?</DialogTitle>
            <DialogDescription>
              This unlocks every manually adjusted auto-inserted fitting so future auto-fitting runs can update them again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmResetAllOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleResetAllManualOverrides}>
              Reset All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
