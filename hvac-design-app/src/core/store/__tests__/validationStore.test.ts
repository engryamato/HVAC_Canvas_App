import { beforeEach, describe, expect, it } from 'vitest';
import { useValidationStore, type ValidationResult } from '../validationStore';

function createValidationResult(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    entityId: 'entity-1',
    serviceId: 'service-1',
    violations: [],
    catalogStatus: 'resolved',
    lastValidated: new Date(),
    ...overrides,
  };
}

describe('validationStore', () => {
  beforeEach(() => {
    useValidationStore.setState({
      validationResults: {},
      exportBlockers: [],
      unresolvedCatalogItems: [],
      ignoredWarnings: [],
    });
  });

  it('tracks blockers and unresolved catalog items', () => {
    useValidationStore.getState().setValidationResult(
      'entity-1',
      createValidationResult({
        violations: [{ ruleId: 'v1', message: 'hard fail', severity: 'blocker' }],
        catalogStatus: 'unresolved',
      })
    );

    const state = useValidationStore.getState();
    expect(state.exportBlockers).toContain('entity-1');
    expect(state.unresolvedCatalogItems).toContain('entity-1');
  });

  it('ignores and restores warning visibility', () => {
    useValidationStore.getState().ignoreWarning('entity-1', 'min-velocity');
    expect(useValidationStore.getState().ignoredWarnings).toContain('entity-1:min-velocity');

    useValidationStore.getState().unignoreWarning('entity-1', 'min-velocity');
    expect(useValidationStore.getState().ignoredWarnings).not.toContain('entity-1:min-velocity');
  });

  it('returns violations by severity and auto-fix suggestions', () => {
    useValidationStore.getState().setValidationResult(
      'entity-1',
      createValidationResult({
        violations: [
          { ruleId: 'v1', message: 'warn', severity: 'warning', suggestedFix: 'Do A' },
          { ruleId: 'v2', message: 'block', severity: 'blocker' },
        ],
      })
    );

    const warnings = useValidationStore.getState().getViolationsBySeverity('warning');
    const suggestions = useValidationStore.getState().getAutoFixSuggestions('entity-1');

    expect(warnings).toHaveLength(1);
    expect(suggestions).toEqual(['Do A']);
  });
});

