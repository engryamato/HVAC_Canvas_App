import type {
  DuctRunFamily,
  DuctRunShape,
  DuctSegment,
} from '@/core/schema/duct-run.schema';

export type DuctRunSegmentSummarySource = Pick<
  DuctSegment,
  'index' | 'length' | 'isPartial' | 'startStation' | 'endStation'
>;

interface BaseDuctRunQuantitySource {
  shape: DuctRunShape;
  engineeringSystem: DuctRunFamily;
  segments: readonly DuctRunSegmentSummarySource[];
}

interface RoundDuctRunQuantitySource extends BaseDuctRunQuantitySource {
  shape: 'round' | 'flexible';
  diameter: number;
}

interface RectangularDuctRunQuantitySource extends BaseDuctRunQuantitySource {
  shape: 'rectangular' | 'flat_oval';
  width: number;
  height: number;
}

export type DuctRunQuantitySource =
  | RoundDuctRunQuantitySource
  | RectangularDuctRunQuantitySource;

export interface DuctRunQuantitySummary {
  family: DuctRunFamily;
  familyLabel: string;
  shape: DuctRunShape;
  shapeLabel: string;
  sizeKey: string;
  sizeLabel: string;
  effectiveSectionLength: number;
  totalLength: number;
  totalPieces: number;
  fullPieceCount: number;
  partialPieceCount: number;
  partialLengths: number[];
}

const FAMILY_LABELS: Record<DuctRunFamily, string> = {
  standard_duct: 'Standard Duct',
  grease_duct: 'Grease Duct',
  boiler_flue: 'Boiler Flue',
  generator_exhaust: 'Generator Exhaust',
};

const SHAPE_LABELS: Record<DuctRunShape, string> = {
  rectangular: 'Rectangular',
  round: 'Round',
  flat_oval: 'Flat Oval',
  flexible: 'Flexible',
};

function assertPositiveLength(length: number, index: number): void {
  if (!Number.isFinite(length) || length <= 0) {
    throw new Error(`Duct run segment ${index} must have a positive length.`);
  }
}

function toRoundedLength(length: number): number {
  return Number(length.toFixed(4));
}

function getEffectiveSectionLength(
  segments: readonly DuctRunSegmentSummarySource[],
  fullPieceCount: number
): number {
  if (fullPieceCount > 0) {
    const firstFullSegment = segments.find((segment) => !segment.isPartial);

    if (!firstFullSegment) {
      throw new Error('Expected at least one full segment when fullPieceCount is greater than zero.');
    }

    return toRoundedLength(firstFullSegment.length);
  }

  const longestSegment = segments.reduce((longest, segment) => {
    return segment.length > longest ? segment.length : longest;
  }, 0);

  return toRoundedLength(longestSegment);
}

function formatSize(source: DuctRunQuantitySource): { sizeKey: string; sizeLabel: string } {
  if ('diameter' in source) {
    return {
      sizeKey: `${source.shape}:${source.diameter}`,
      sizeLabel: `${source.diameter}" dia.`,
    };
  }

  return {
    sizeKey: `${source.shape}:${source.width}x${source.height}`,
    sizeLabel: `${source.width}" x ${source.height}"`,
  };
}

export function summarizeDuctRunQuantity(
  source: DuctRunQuantitySource
): DuctRunQuantitySummary {
  if (source.segments.length === 0) {
    throw new Error('Duct run quantity summary requires at least one segment.');
  }

  const partialLengths: number[] = [];
  let totalLength = 0;
  let fullPieceCount = 0;

  for (const segment of source.segments) {
    assertPositiveLength(segment.length, segment.index);

    const roundedLength = toRoundedLength(segment.length);
    totalLength += roundedLength;

    if (segment.isPartial) {
      partialLengths.push(roundedLength);
    } else {
      fullPieceCount += 1;
    }
  }

  return {
    family: source.engineeringSystem,
    familyLabel: FAMILY_LABELS[source.engineeringSystem],
    shape: source.shape,
    shapeLabel: SHAPE_LABELS[source.shape],
    ...formatSize(source),
    effectiveSectionLength: getEffectiveSectionLength(source.segments, fullPieceCount),
    totalLength: toRoundedLength(totalLength),
    totalPieces: source.segments.length,
    fullPieceCount,
    partialPieceCount: partialLengths.length,
    partialLengths,
  };
}
