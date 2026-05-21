import { describe, expect, it } from 'vitest';
import { recomputeDuctRunSegments } from '../recomputeDuctRunSegments';

describe('recomputeDuctRunSegments', () => {
  it('creates full segments for even section lengths', () => {
    expect(recomputeDuctRunSegments(50, 5)).toEqual(
      Array.from({ length: 10 }, (_, index) => ({
        index,
        startStation: index * 5,
        endStation: (index + 1) * 5,
        length: 5,
        isPartial: false,
      }))
    );
  });

  it('creates a final partial segment when the remainder is non-zero', () => {
    const segments = recomputeDuctRunSegments(63, 5);
    expect(segments).toHaveLength(13);
    expect(segments[segments.length - 1]).toEqual({
      index: 12,
      startStation: 60,
      endStation: 63,
      length: 3,
      isPartial: true,
    });
  });

  it('applies insulation and end-type defaults to each generated segment', () => {
    expect(
      recomputeDuctRunSegments(12, 5, {
        insulationType: 'wrap',
        insulationThickness: 1.5,
        startEndType: 'flange',
        endEndType: 'coupled',
      })
    ).toEqual([
      {
        index: 0,
        startStation: 0,
        endStation: 5,
        length: 5,
        isPartial: false,
        insulationType: 'wrap',
        insulationThickness: 1.5,
        startEndType: 'flange',
        endEndType: 'coupled',
      },
      {
        index: 1,
        startStation: 5,
        endStation: 10,
        length: 5,
        isPartial: false,
        insulationType: 'wrap',
        insulationThickness: 1.5,
        startEndType: 'flange',
        endEndType: 'coupled',
      },
      {
        index: 2,
        startStation: 10,
        endStation: 12,
        length: 2,
        isPartial: true,
        insulationType: 'wrap',
        insulationThickness: 1.5,
        startEndType: 'flange',
        endEndType: 'coupled',
      },
    ]);
  });
});
