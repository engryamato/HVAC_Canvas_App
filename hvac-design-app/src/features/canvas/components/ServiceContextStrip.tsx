/**
 * ServiceContextStrip
 *
 * Displays the active service and validation summary at the top of the canvas.
 */
import { useActiveService } from '@/core/store/serviceStore';
import { useValidationSummary } from '@/core/store/validationStore';

export function ServiceContextStrip() {
  const activeService = useActiveService();
  const validationSummary = useValidationSummary();

  if (!activeService) {
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
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeService.color || '#94a3b8' }} />
          {activeService.name}
        </span>
        <span className="text-slate-500">
          {activeService.systemType} • {activeService.pressureClass}
        </span>
      </div>

      <div className={validationSummary.totalIssues > 0 ? 'text-amber-700' : 'text-emerald-700'}>
        {validationSummary.totalIssues > 0 ? `${validationSummary.totalIssues} Issues` : 'Validated'}
      </div>
    </div>
  );
}

