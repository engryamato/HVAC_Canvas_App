import type { ProjectFile } from '@/core/schema';

type MigratableDuctRun = {
  type?: unknown;
  props?: Record<string, unknown>;
};

export function migrateInsulatedBooleanToType<T extends MigratableDuctRun>(run: T): T {
  if (run.type !== 'duct_run' || !run.props || typeof run.props !== 'object') {
    return run;
  }

  const props = { ...run.props };
  const legacyInsulated = props.insulated;

  if (typeof legacyInsulated === 'boolean' && props.insulationType === undefined) {
    props.insulationType = legacyInsulated ? 'wrap' : undefined;
  }

  if (Array.isArray(props.segments)) {
    props.segments = props.segments.map((segment) => {
      if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
        return segment;
      }

      const nextSegment = { ...(segment as Record<string, unknown>) };
      if (typeof legacyInsulated === 'boolean' && nextSegment.insulationType === undefined) {
        nextSegment.insulationType = legacyInsulated ? 'wrap' : undefined;
      }

      if (nextSegment.insulationThickness === undefined && props.insulationThickness !== undefined) {
        nextSegment.insulationThickness = props.insulationThickness;
      }

      if (nextSegment.startEndType === undefined && props.startEndType !== undefined) {
        nextSegment.startEndType = props.startEndType;
      }

      if (nextSegment.endEndType === undefined && props.endEndType !== undefined) {
        nextSegment.endEndType = props.endEndType;
      }

      return nextSegment;
    });
  }

  delete props.insulated;

  return {
    ...run,
    props,
  };
}

export function migrateProjectInsulatedBooleanToType(project: ProjectFile): ProjectFile {
  const entities = project.entities;
  if (!entities?.byId) {
    return project;
  }

  const byId = Object.fromEntries(
    Object.entries(entities.byId).map(([id, entity]) => [
      id,
      entity?.type === 'duct_run' ? migrateInsulatedBooleanToType(entity) : entity,
    ])
  ) as ProjectFile['entities']['byId'];

  return {
    ...project,
    entities: {
      ...entities,
      byId,
    },
  };
}
