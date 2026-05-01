import { feetToPixels } from '@/core/constants/coordinates';
import type { Duct, DuctRun, Entity, ProjectFile } from '@/core/schema';
import { getActiveSectionLength } from './getActiveSectionLength';
import { recomputeDuctRunSegments } from './recomputeDuctRunSegments';

interface ConvertDuctToDuctRunOptions {
  sectionLength?: number;
}

function computeEndPoint(duct: Duct): { x: number; y: number } {
  const angleRadians = (duct.transform.rotation * Math.PI) / 180;
  const runLengthPixels = feetToPixels(duct.props.length);

  return {
    x: duct.transform.x + Math.cos(angleRadians) * runLengthPixels,
    y: duct.transform.y + Math.sin(angleRadians) * runLengthPixels,
  };
}

export function convertDuctToDuctRun(
  duct: Duct,
  options: ConvertDuctToDuctRunOptions = {}
): DuctRun {
  const baseProps = {
    ...duct.props,
    installLength: duct.props.length,
    startPoint: {
      x: duct.transform.x,
      y: duct.transform.y,
    },
    endPoint: computeEndPoint(duct),
  };

  const sectionLength =
    options.sectionLength ??
    getActiveSectionLength({
      props: {
        engineeringSystem: baseProps.engineeringSystem,
        shape: baseProps.shape,
      },
    } as Pick<DuctRun, 'props'>);

  const segments = recomputeDuctRunSegments(baseProps.installLength, sectionLength);

  const { length: _legacyLength, ...propsWithoutLegacyLength } = baseProps;

  return {
    ...duct,
    type: 'duct_run',
    props: {
      ...propsWithoutLegacyLength,
      segments,
    },
  } as DuctRun;
}

export function convertLegacyDuctEntitiesInProject(project: ProjectFile): ProjectFile {
  if (!project.entities?.byId) {
    return project;
  }

  const nextById: Record<string, Entity> = { ...project.entities.byId };
  let changed = false;

  for (const [entityId, entity] of Object.entries(project.entities.byId)) {
    if (entity?.type !== 'duct') {
      continue;
    }

    nextById[entityId] = convertDuctToDuctRun(entity);
    changed = true;
  }

  if (!changed) {
    return project;
  }

  return {
    ...project,
    entities: {
      ...project.entities,
      byId: nextById,
    },
  };
}
