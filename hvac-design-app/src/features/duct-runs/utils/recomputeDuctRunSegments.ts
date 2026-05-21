import { roundFeet } from '@/core/constants/coordinates';
import type { DuctEndType, DuctSegment, InsulationType } from '@/core/schema';

export interface DuctSegmentDefaults {
  insulationType?: InsulationType;
  insulationThickness?: number;
  startEndType?: DuctEndType;
  endEndType?: DuctEndType;
}

export function recomputeDuctRunSegments(
  installLength: number,
  sectionLength: number,
  defaults: DuctSegmentDefaults = {}
): DuctSegment[] {
  if (installLength <= 0 || sectionLength <= 0) {
    return [];
  }

  const segments: DuctSegment[] = [];
  const buildSegment = (segment: DuctSegment): DuctSegment => ({ ...defaults, ...segment }) as DuctSegment;
  const fullSegmentCount = Math.floor(installLength / sectionLength);
  const remainder = roundFeet(installLength - fullSegmentCount * sectionLength);

  for (let index = 0; index < fullSegmentCount; index += 1) {
    const startStation = roundFeet(index * sectionLength);
    const endStation = roundFeet(startStation + sectionLength);
    segments.push(buildSegment({
      index,
      startStation,
      endStation,
      length: roundFeet(sectionLength),
      isPartial: false,
    }));
  }

  if (remainder > 0.001) {
    const startStation = roundFeet(fullSegmentCount * sectionLength);
    segments.push(buildSegment({
      index: segments.length,
      startStation,
      endStation: roundFeet(startStation + remainder),
      length: roundFeet(remainder),
      isPartial: true,
    }));
  }

  if (segments.length === 0) {
    segments.push(buildSegment({
      index: 0,
      startStation: 0,
      endStation: roundFeet(installLength),
      length: roundFeet(installLength),
      isPartial: true,
    }));
  }

  return segments;
}
