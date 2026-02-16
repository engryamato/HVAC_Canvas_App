import { ConnectionGraph } from '../graph/types';
import { ConnectionGraphBuilder, GraphTraversal } from '../graph/ConnectionGraphBuilder';

export interface ParametricUpdateResult {
  updatedEntityIds: string[];
  validationIssues: ValidationIssue[];
  undoGroupId: string;
}

export interface ValidationIssue {
  entityId: string;
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion?: string;
}

export interface DimensionChange {
  entityId: string;
  property: string;
  oldValue: number;
  newValue: number;
}

export class ParametricUpdateService {
  private graphBuilder: ConnectionGraphBuilder;
  private traversal: GraphTraversal | null = null;

  constructor() {
    this.graphBuilder = new ConnectionGraphBuilder();
  }

  buildGraph(entities: Array<{id: string; type: string; connectedFrom?: string; connectedTo?: string}>): ConnectionGraph {
    return ConnectionGraphBuilder.fromEntities(entities);
  }

  applyDimensionChange(
    graph: ConnectionGraph,
    change: DimensionChange
  ): ParametricUpdateResult {
    const undoGroupId = `update-${Date.now()}`;
    const updatedEntityIds: string[] = [];
    const validationIssues: ValidationIssue[] = [];

    this.traversal = new GraphTraversal(graph);
    
    const affected = this.traversal.getAffectedEntities(change.entityId);
    
    for (const entityId of affected.directlyAffected) {
      const updates = this.calculateCascadeUpdates(entityId, change);
      if (updates.length > 0) {
        updatedEntityIds.push(entityId);
        
        for (const update of updates) {
          const issues = this.validateUpdate(entityId, update);
          validationIssues.push(...issues);
        }
      }
    }

    for (const entityId of affected.indirectlyAffected) {
      const indirectUpdates = this.calculateIndirectUpdates(entityId, change);
      if (indirectUpdates.length > 0) {
        updatedEntityIds.push(entityId);
      }
    }

    return {
      updatedEntityIds: [...new Set(updatedEntityIds)],
      validationIssues,
      undoGroupId,
    };
  }

  private calculateCascadeUpdates(
    entityId: string,
    originalChange: DimensionChange
  ): Array<{property: string; value: number}> {
    const updates: Array<{property: string; value: number}> = [];

    if (originalChange.property === 'diameter' || originalChange.property === 'width' || originalChange.property === 'height') {
      updates.push({
        property: 'matchingFittingSize',
        value: originalChange.newValue,
      });
    }

    if (originalChange.property === 'airflow') {
      const newVelocity = this.calculateVelocity(entityId, originalChange.newValue);
      updates.push({
        property: 'velocity',
        value: newVelocity,
      });
    }

    return updates;
  }

  private calculateIndirectUpdates(
    entityId: string,
    originalChange: DimensionChange
  ): Array<{property: string; value: number}> {
    return this.calculateCascadeUpdates(entityId, originalChange);
  }

  private calculateVelocity(entityId: string, airflow: number): number {
    const defaultArea = 1.0;
    return airflow / defaultArea / 60;
  }

  private validateUpdate(
    entityId: string,
    update: {property: string; value: number}
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (update.property === 'velocity') {
      if (update.value > 2500) {
        issues.push({
          entityId,
          type: 'error',
          code: 'VELOCITY_TOO_HIGH',
          message: `Velocity ${update.value.toFixed(0)} FPM exceeds maximum 2500 FPM`,
          suggestion: 'Increase duct size or reduce airflow',
        });
      } else if (update.value > 2000) {
        issues.push({
          entityId,
          type: 'warning',
          code: 'VELOCITY_HIGH',
          message: `Velocity ${update.value.toFixed(0)} FPM is above recommended 2000 FPM`,
          suggestion: 'Consider increasing duct size',
        });
      }
    }

    return issues;
  }

  batchUpdate(
    graph: ConnectionGraph,
    changes: DimensionChange[]
  ): ParametricUpdateResult {
    const undoGroupId = `batch-${Date.now()}`;
    const allUpdatedIds: string[] = [];
    const allIssues: ValidationIssue[] = [];

    for (const change of changes) {
      const result = this.applyDimensionChange(graph, change);
      allUpdatedIds.push(...result.updatedEntityIds);
      allIssues.push(...result.validationIssues);
    }

    return {
      updatedEntityIds: [...new Set(allUpdatedIds)],
      validationIssues: allIssues,
      undoGroupId,
    };
  }
}

export const parametricUpdateService = new ParametricUpdateService();
