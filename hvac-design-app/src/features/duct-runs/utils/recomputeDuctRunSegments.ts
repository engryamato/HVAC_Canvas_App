import { roundFeet } from '@/core/constants/coordinates';
import type { DuctSegment } from '@/core/schema';

export function recomputeDuctRunSegments(installLength: number, sectionLength: number): DuctSegment[] {
  if (installLength <= 0 || sectionLength <= 0) {
    return [];
  }

  const segments: DuctSegment[] = [];
  const fullSegmentCount = Math.floor(installLength / sectionLength);
  const remainder = roundFeet(installLength - fullSegmentCount * sectionLength);

  for (let index = 0; index < fullSegmentCount; index += 1) {
    const startStation = roundFeet(index * sectionLength);
    const endStation = roundFeet(startStation + sectionLength);
    segments.push({
      index,
      startStation,
      endStation,
      length: roundFeet(sectionLength),
      isPartial: false,
    });
  }

  if (remainder > 0.001) {
    const startStation = roundFeet(fullSegmentCount * sectionLength);
    segments.push({
      index: segments.length,
      startStation,
      endStation: roundFeet(startStation + remainder),
      length: roundFeet(remainder),
      isPartial: true,
    });
  }

  if (segments.length === 0) {
    segments.push({
      index: 0,
      startStation: 0,
      endStation: roundFeet(installLength),
      length: roundFeet(installLength),
      isPartial: true,
    });
  }

  return segments;
}
