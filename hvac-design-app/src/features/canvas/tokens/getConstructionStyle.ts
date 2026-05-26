export type ConstructionType =
  | 'singleWall'
  | 'lined'
  | 'doubleWall'
  | 'externallyWrapped'
  | 'externallyInsulated'
  | 'internallyInsulated'
  | 'flexible';

export type ConstructionLinePattern = 'solid' | 'dashed';

export interface ConstructionStyle {
  innerLines?: { offset: number; pattern: ConstructionLinePattern };
  outerLine?: { offset: number; pattern: 'dashed' };
  ribPattern?: { spacing: number };
}

export interface ConstructionStyleParams {
  constructionType?: ConstructionType;
  linerThickness?: number;
  innerWallThickness?: number;
  wrapThickness?: number;
  insulationThickness?: number;
  ribSpacing?: number;
}

const DEFAULT_OFFSET = 1;
const DEFAULT_RIB_SPACING = 6;

function positiveOrDefault(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && value > 0 ? value : fallback;
}

export function getConstructionStyle(params: ConstructionStyleParams): ConstructionStyle {
  switch (params.constructionType ?? 'singleWall') {
    case 'lined':
      return { innerLines: { offset: positiveOrDefault(params.linerThickness, DEFAULT_OFFSET), pattern: 'dashed' } };
    case 'doubleWall':
      return { innerLines: { offset: positiveOrDefault(params.innerWallThickness, DEFAULT_OFFSET), pattern: 'solid' } };
    case 'externallyWrapped':
      return { outerLine: { offset: positiveOrDefault(params.wrapThickness, DEFAULT_OFFSET), pattern: 'dashed' } };
    case 'externallyInsulated':
      return { outerLine: { offset: positiveOrDefault(params.insulationThickness, DEFAULT_OFFSET), pattern: 'dashed' } };
    case 'internallyInsulated':
      return { innerLines: { offset: positiveOrDefault(params.insulationThickness, DEFAULT_OFFSET), pattern: 'dashed' } };
    case 'flexible':
      return { ribPattern: { spacing: positiveOrDefault(params.ribSpacing, DEFAULT_RIB_SPACING) } };
    case 'singleWall':
    default:
      return {};
  }
}
