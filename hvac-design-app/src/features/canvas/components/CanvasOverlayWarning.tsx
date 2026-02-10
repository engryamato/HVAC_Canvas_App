/**
 * CanvasOverlayWarning
 * 
 * A specialized overlay component that appears on the canvas to explicitly 
 * warn the user about Specification/Service violations for the currently 
 * selected items. It provides more visibility than the status strip.
 */
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useValidationStore } from '@/core/store/validationStore';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CanvasOverlayWarning() {
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const validationResults = useValidationStore((state) => state.validationResults);

  // If no selection, nothing to warn about specifically on overlay
  // (Tool-based warnings are handled by the tool renderer)
  if (selectedIds.length === 0) {
    return null;
  }

  // Collect violations for selected entities
  const violations = selectedIds.flatMap(id => {
    const result = validationResults[id];
    if (!result) {return [];}
    return result.violations.map(v => ({ ...v, entityId: id }));
  });

  const blockerCount = violations.filter(v => v.severity === 'blocker').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;

  if (blockerCount === 0 && warningCount === 0) {
    return null;
  }

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 max-w-md w-full animate-in fade-in slide-in-from-top-4">
      <div className={cn(
        "rounded-lg shadow-lg border p-3 flex items-start gap-3 backdrop-blur-sm",
        blockerCount > 0 
          ? "bg-destructive/10 border-destructive/50 text-destructive-foreground" 
          : "bg-amber-500/10 border-amber-500/50 text-amber-700"
      )}>
        {blockerCount > 0 ? (
          <XCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        )}
        
        <div className="flex-1 text-sm">
          <div className="font-semibold mb-1">
            {blockerCount > 0 
              ? `${blockerCount} Critical Spec Violation${blockerCount > 1 ? 's' : ''}`
              : `${warningCount} Warning${warningCount > 1 ? 's' : ''}`
            }
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-xs opacity-90">
            {violations.slice(0, 3).map((v, i) => (
              <li key={`${v.entityId}-${i}`}>
                {v.message}
              </li>
            ))}
            {violations.length > 3 && (
              <li>...and {violations.length - 3} more</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
