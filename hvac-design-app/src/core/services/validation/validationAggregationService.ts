import { ConstraintStatus } from '../../schema/duct.schema';
import { Duct } from '../../schema/duct.schema';
import { Fitting } from '../../schema/fitting.schema';
import { Equipment } from '../../schema/equipment.schema';

/**
 * Validation Aggregation Service
 * 
 * Aggregates validation results across all project entities
 * for dashboard display and reporting.
 */

export interface ValidationDashboardData {
  summary: {
    totalEntities: number;
    validEntities: number;
    entitiesWithErrors: number;
    entitiesWithWarnings: number;
    validationPercentage: number;
  };
  
  byCategory: {
    ducts: CategoryValidation;
    fittings: CategoryValidation;
    equipment: CategoryValidation;
  };
  
  topIssues: ValidationIssue[];
  recentlyValidated: Date;
}

export interface CategoryValidation {
  total: number;
  valid: number;
  errors: number;
  warnings: number;
}

export interface ValidationIssue {
  entityId: string;
  entityType: 'duct' | 'fitting' | 'equipment';
  severity: 'error' | 'warning' | 'info';
  type: string;
  message: string;
  count: number; // How many entities have this issue
}

export class ValidationAggregationService {
  /**
   * Generate validation dashboard data
   */
  static generateDashboard(entities: {
    ducts: Array<{ id: string; constraintStatus?: ConstraintStatus }>;
    fittings: Array<{ id: string; constraintStatus?: ConstraintStatus }>;
    equipment: Array<{ id: string; constraintStatus?: ConstraintStatus }>;
  }): ValidationDashboardData {
    // Count totals
    const totalEntities =
      entities.ducts.length + entities.fittings.length + entities.equipment.length;

    // Analyze each category
    const ductsValidation = this.analyzeCategoryValidation(entities.ducts);
    const fittingsValidation = this.analyzeCategoryValidation(entities.fittings);
    const equipmentValidation = this.analyzeCategoryValidation(entities.equipment);

    // Calculate summary
    const validEntities =
      ductsValidation.valid + fittingsValidation.valid + equipmentValidation.valid;
    const entitiesWithErrors =
      ductsValidation.errors + fittingsValidation.errors + equipmentValidation.errors;
    const entitiesWithWarnings =
      ductsValidation.warnings +
      fittingsValidation.warnings +
      equipmentValidation.warnings;
    const validationPercentage =
      totalEntities > 0 ? (validEntities / totalEntities) * 100 : 100;

    // Find top issues
    const topIssues = this.findTopIssues(entities);

    return {
      summary: {
        totalEntities,
        validEntities,
        entitiesWithErrors,
        entitiesWithWarnings,
        validationPercentage,
      },
      byCategory: {
        ducts: ductsValidation,
        fittings: fittingsValidation,
        equipment: equipmentValidation,
      },
      topIssues,
      recentlyValidated: new Date(),
    };
  }

  /**
   * Analyze validation for a category
   */
  private static analyzeCategoryValidation(
    entities: Array<{ id: string; constraintStatus?: ConstraintStatus }>
  ): CategoryValidation {
    let valid = 0;
    let errors = 0;
    let warnings = 0;

    for (const entity of entities) {
      if (!entity.constraintStatus) {
        // No validation status - assume valid
        valid++;
        continue;
      }

      const hasErrors = entity.constraintStatus.violations.some(
        v => v.severity === 'error'
      );
      const hasWarnings = entity.constraintStatus.violations.some(
        v => v.severity === 'warning'
      );

      if (hasErrors) {
        errors++;
      } else if (hasWarnings) {
        warnings++;
      } else {
        valid++;
      }
    }

    return {
      total: entities.length,
      valid,
      errors,
      warnings,
    };
  }

  /**
   * Find most common validation issues
   */
  private static findTopIssues(entities: {
    ducts: Array<{ id: string; constraintStatus?: ConstraintStatus }>;
    fittings: Array<{ id: string; constraintStatus?: ConstraintStatus }>;
    equipment: Array<{ id: string; constraintStatus?: ConstraintStatus }>;
  }): ValidationIssue[] {
    const issueMap = new Map<string, ValidationIssue>();

    // Process ducts
    for (const duct of entities.ducts) {
      this.collectIssues(duct, 'duct', issueMap);
    }

    // Process fittings
    for (const fitting of entities.fittings) {
      this.collectIssues(fitting, 'fitting', issueMap);
    }

    // Process equipment
    for (const equipment of entities.equipment) {
      this.collectIssues(equipment, 'equipment', issueMap);
    }

    // Convert to array and sort by count
    const issues = Array.from(issueMap.values());
    issues.sort((a, b) => b.count - a.count);

    // Return top 10
    return issues.slice(0, 10);
  }

  /**
   * Collect issues from entity
   */
  private static collectIssues(
    entity: { id: string; constraintStatus?: ConstraintStatus },
    entityType: 'duct' | 'fitting' | 'equipment',
    issueMap: Map<string, ValidationIssue>
  ): void {
    if (!entity.constraintStatus) return;

    for (const violation of entity.constraintStatus.violations) {
      const key = `${violation.type}-${violation.severity}`;

      const existing = issueMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        issueMap.set(key, {
          entityId: entity.id,
          entityType,
          severity: violation.severity,
          type: violation.type,
          message: violation.message,
          count: 1,
        });
      }
    }
  }

  /**
   * Get entities with specific issue type
   */
  static getEntitiesWithIssue(
    entities: Array<{ id: string; constraintStatus?: ConstraintStatus }>,
    issueType: string
  ): string[] {
    const entityIds: string[] = [];

    for (const entity of entities) {
      if (!entity.constraintStatus) continue;

      const hasIssue = entity.constraintStatus.violations.some(
        v => v.type === issueType
      );

      if (hasIssue) {
        entityIds.push(entity.id);
      }
    }

    return entityIds;
  }

  /**
   * Get validation health score (0-100)
   */
  static getHealthScore(dashboard: ValidationDashboardData): number {
    const { summary } = dashboard;

    if (summary.totalEntities === 0) return 100;

    // Weight errors more heavily than warnings
    const errorWeight = 2;
    const warningWeight = 1;

    const totalIssues =
      summary.entitiesWithErrors * errorWeight +
      summary.entitiesWithWarnings * warningWeight;

    const maxPossibleIssues = summary.totalEntities * errorWeight;

    const score = 100 - (totalIssues / maxPossibleIssues) * 100;

    return Math.max(0, Math.min(100, score));
  }
}

/**
 * Export singleton instance
 */
export const validationAggregationService = ValidationAggregationService;
