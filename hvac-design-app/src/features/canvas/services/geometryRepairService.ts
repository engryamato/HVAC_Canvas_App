import type { ValidationResult } from '@/core/store/validationStore';

export interface GeometryRepairPlan {
  changedEntityIds: string[];
  message: string;
  requiresConfirmation: boolean;
  reversible: boolean;
}

function isGeometryViolation(violation: { ruleId?: string; type?: string }) {
  const text = `${violation.ruleId ?? ''} ${violation.type ?? ''}`.toLowerCase();
  return text.includes('geometry') || text.includes('transition');
}

export function buildGeometryRepairPlan(results: Record<string, ValidationResult>): GeometryRepairPlan {
  const changedEntityIds = Object.values(results)
    .filter((result) => result.violations.some(isGeometryViolation))
    .map((result) => result.entityId);

  if (changedEntityIds.length === 0) {
    return {
      changedEntityIds: [],
      message: 'No geometry issues found.',
      requiresConfirmation: false,
      reversible: true,
    };
  }

  return {
    changedEntityIds,
    message: `Found ${changedEntityIds.length} geometry issue${changedEntityIds.length === 1 ? '' : 's'}. Select the affected element${changedEntityIds.length === 1 ? '' : 's'} before applying a repair.`,
    requiresConfirmation: true,
    reversible: true,
  };
}
