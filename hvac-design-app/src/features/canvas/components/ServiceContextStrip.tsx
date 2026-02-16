/**
 * ServiceContextStrip
 *
 * Displays the active service and validation summary at the top of the canvas.
 */
import { useValidationSummary } from '@/core/store/validationStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';

export function ServiceContextStrip() {
  const validationSummary = useValidationSummary();
  const activeComponent = useComponentLibraryStoreV2((state) => state.getActiveComponent());
  const resolvedService = activeComponent ? adaptComponentToService(activeComponent) : null;

  if (!resolvedService) {
    return (
      <div className="flex h-8 w-full items-center justify-center border-b bg-slate-50 text-xs text-slate-600">
        No active service selected. Select a service to verify engineering rules.
      </div>
    );
  }

  return (
    <div className="flex h-8 w-full items-center justify-between border-b bg-white px-4 text-xs">
      <div className="flex items-center gap-3">
        <span className="text-slate-600">Active Service:</span>
        <span className="inline-flex items-center gap-2 font-medium">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: resolvedService.color || '#94a3b8' }} />
          {resolvedService.name}
        </span>
        <span className="text-slate-500">
          {resolvedService.systemType} • {resolvedService.pressureClass}
        </span>
      </div>

      <div className={validationSummary.totalIssues > 0 ? 'text-amber-700' : 'text-emerald-700'}>
        {validationSummary.totalIssues > 0 ? `${validationSummary.totalIssues} Issues` : 'Validated'}
      </div>
    </div>
  );
}
