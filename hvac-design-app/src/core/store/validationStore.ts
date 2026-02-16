/**
 * Validation Store
 * 
 * Manages the validation state of entities against the active service specifications.
 * Tracks constraint violations, blocks export if critical issues exist, and
 * manages catalog resolution status.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { CatalogResolutionStatus } from '../schema/catalog.schema';

export interface ConstraintViolation {
  ruleId: string;
  type?: string;
  message: string;
  suggestedFix?: string;
  severity: 'warning' | 'blocker';
}

export interface ValidationResult {
  entityId: string;
  serviceId?: string;
  violations: ConstraintViolation[];
  catalogStatus: CatalogResolutionStatus;
  catalogMessage?: string; // e.g., "No match for 18inch stainless"
  lastValidated: Date;
}

interface ValidationState {
  // Validation results keyed by entity ID
  validationResults: Record<string, ValidationResult>;
  // Set of entity IDs that block export
  exportBlockers: string[];
  // Set of entity IDs with unresolved catalog items
  unresolvedCatalogItems: string[];
  ignoredWarnings: string[];
}

interface ValidationActions {
  // specific validation result update
  setValidationResult: (entityId: string, result: ValidationResult) => void;
  // Batch update
  setValidationResults: (results: ValidationResult[]) => void;
  // Clear validation for an entity (e.g. on delete)
  clearValidation: (entityId: string) => void;
  // Clear all
  clearAll: () => void;
  // Update catalog status specifically
  updateCatalogStatus: (entityId: string, status: CatalogResolutionStatus, message?: string) => void;
  ignoreWarning: (entityId: string, ruleId: string) => void;
  unignoreWarning: (entityId: string, ruleId: string) => void;
  getViolationsBySeverity: (severity: ConstraintViolation['severity']) => ConstraintViolation[];
  getAutoFixSuggestions: (entityId: string) => string[];
}

export const useValidationStore = create<ValidationState & ValidationActions>()(
  immer((set, get) => ({
    validationResults: {},
    exportBlockers: [],
    unresolvedCatalogItems: [],
    ignoredWarnings: [],

    setValidationResult: (entityId, result) =>
      set((state) => {
        state.validationResults[entityId] = result;
        
        // Update derived lists
        const hasBlocker = result.violations.some(v => v.severity === 'blocker');
        if (hasBlocker) {
          if (!state.exportBlockers.includes(entityId)) {state.exportBlockers.push(entityId);}
        } else {
          const idx = state.exportBlockers.indexOf(entityId);
          if (idx !== -1) {state.exportBlockers.splice(idx, 1);}
        }

        if (result.catalogStatus === 'unresolved') {
          if (!state.unresolvedCatalogItems.includes(entityId)) {state.unresolvedCatalogItems.push(entityId);}
        } else {
          const idx = state.unresolvedCatalogItems.indexOf(entityId);
          if (idx !== -1) {state.unresolvedCatalogItems.splice(idx, 1);}
        }
      }),

    setValidationResults: (results) =>
      set((state) => {
        results.forEach(result => {
          state.validationResults[result.entityId] = result;
          
          // Logic duplicated from setValidationResult for batch efficiency could be refactored
          // but kept simple here for clarity
          const hasBlocker = result.violations.some(v => v.severity === 'blocker');
          if (hasBlocker) {
            if (!state.exportBlockers.includes(result.entityId)) {state.exportBlockers.push(result.entityId);}
          } else {
            const idx = state.exportBlockers.indexOf(result.entityId);
            if (idx !== -1) {state.exportBlockers.splice(idx, 1);}
          }

          if (result.catalogStatus === 'unresolved') {
            if (!state.unresolvedCatalogItems.includes(result.entityId)) {state.unresolvedCatalogItems.push(result.entityId);}
          } else {
            const idx = state.unresolvedCatalogItems.indexOf(result.entityId);
            if (idx !== -1) {state.unresolvedCatalogItems.splice(idx, 1);}
          }
        });
      }),

    clearValidation: (entityId) =>
      set((state) => {
        delete state.validationResults[entityId];
        
        const blockerIdx = state.exportBlockers.indexOf(entityId);
        if (blockerIdx !== -1) {state.exportBlockers.splice(blockerIdx, 1);}
        
        const catalogIdx = state.unresolvedCatalogItems.indexOf(entityId);
        if (catalogIdx !== -1) {state.unresolvedCatalogItems.splice(catalogIdx, 1);}
      }),

    clearAll: () =>
      set((state) => {
        state.validationResults = {};
        state.exportBlockers = [];
        state.unresolvedCatalogItems = [];
        state.ignoredWarnings = [];
      }),

    updateCatalogStatus: (entityId, status, message) =>
      set((state) => {
        const result = state.validationResults[entityId];
        if (result) {
          result.catalogStatus = status;
          if (message !== undefined) {result.catalogMessage = message;}
          
          // Re-evaluate lists
          if (status === 'unresolved') {
            if (!state.unresolvedCatalogItems.includes(entityId)) {state.unresolvedCatalogItems.push(entityId);}
          } else {
            const idx = state.unresolvedCatalogItems.indexOf(entityId);
            if (idx !== -1) {state.unresolvedCatalogItems.splice(idx, 1);}
          }
        }
      }),

    ignoreWarning: (entityId, ruleId) =>
      set((state) => {
        const key = `${entityId}:${ruleId}`;
        if (!state.ignoredWarnings.includes(key)) {
          state.ignoredWarnings.push(key);
        }
      }),

    unignoreWarning: (entityId, ruleId) =>
      set((state) => {
        const key = `${entityId}:${ruleId}`;
        const idx = state.ignoredWarnings.indexOf(key);
        if (idx !== -1) {
          state.ignoredWarnings.splice(idx, 1);
        }
      }),

    getViolationsBySeverity: (severity) => {
      return Object.values(get().validationResults)
        .flatMap((result) => result.violations)
        .filter((violation) => violation.severity === severity);
    },

    getAutoFixSuggestions: (entityId) => {
      const result = get().validationResults[entityId];
      if (!result) {
        return [];
      }

      return result.violations
        .map((v) => v.suggestedFix)
        .filter((fix): fix is string => Boolean(fix));
    },
  }))
);

// -- Selectors --

export const useEntityValidation = (entityId: string) => {
  return useValidationStore((state) => state.validationResults[entityId]);
};

export const useValidationSummary = () => {
  return useValidationStore(
    useShallow((state) => ({
      totalIssues: state.exportBlockers.length + state.unresolvedCatalogItems.length,
      blockerCount: state.exportBlockers.length,
      unresolvedCount: state.unresolvedCatalogItems.length,
    }))
  );
};
