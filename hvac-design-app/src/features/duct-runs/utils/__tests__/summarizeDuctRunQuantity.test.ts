import { describe, expect, it } from 'vitest';

import { summarizeDuctRunQuantity } from '../summarizeDuctRunQuantity';

describe('summarizeDuctRunQuantity', () => {
  it('summarizes a fully sectioned run from embedded segments', () => {
    const summary = summarizeDuctRunQuantity({
      shape: 'rectangular',
      engineeringSystem: 'standard_duct',
      width: 24,
      height: 12,
      segments: Array.from({ length: 10 }, (_, index) => ({
        index,
        length: 5,
        isPartial: false,
        startStation: index * 5,
        endStation: (index + 1) * 5,
      })),
    });

    expect(summary).toMatchObject({
      family: 'standard_duct',
      familyLabel: 'Standard Duct',
      shape: 'rectangular',
      shapeLabel: 'Rectangular',
      sizeKey: 'rectangular:24x12',
      sizeLabel: '24" x 12"',
      effectiveSectionLength: 5,
      totalLength: 50,
      totalPieces: 10,
      fullPieceCount: 10,
      partialPieceCount: 0,
      partialLengths: [],
    });
  });

  it('reports explicit partial pieces in segment order', () => {
    const summary = summarizeDuctRunQuantity({
      shape: 'round',
      engineeringSystem: 'standard_duct',
      diameter: 18,
      segments: [
        { index: 0, length: 5, isPartial: false, startStation: 0, endStation: 5 },
        { index: 1, length: 5, isPartial: false, startStation: 5, endStation: 10 },
        { index: 2, length: 4, isPartial: true, startStation: 10, endStation: 14 },
        { index: 3, length: 2, isPartial: true, startStation: 14, endStation: 16 },
      ],
    });

    expect(summary).toMatchObject({
      family: 'standard_duct',
      familyLabel: 'Standard Duct',
      shape: 'round',
      shapeLabel: 'Round',
      sizeKey: 'round:18',
      sizeLabel: '18" dia.',
      effectiveSectionLength: 5,
      totalLength: 16,
      totalPieces: 4,
      fullPieceCount: 2,
      partialPieceCount: 2,
      partialLengths: [4, 2],
    });
  });

  it('falls back to the only segment length when the run is entirely partial', () => {
    const summary = summarizeDuctRunQuantity({
      shape: 'flexible',
      engineeringSystem: 'standard_duct',
      diameter: 8,
      segments: [{ index: 0, length: 3.25, isPartial: true, startStation: 0, endStation: 3.25 }],
    });

    expect(summary.effectiveSectionLength).toBe(3.25);
    expect(summary.totalPieces).toBe(1);
    expect(summary.fullPieceCount).toBe(0);
    expect(summary.partialPieceCount).toBe(1);
    expect(summary.partialLengths).toEqual([3.25]);
  });

  it('rejects empty segment lists', () => {
    expect(() =>
      summarizeDuctRunQuantity({
        shape: 'rectangular',
        engineeringSystem: 'standard_duct',
        width: 20,
        height: 20,
        segments: [],
      })
    ).toThrow('Duct run quantity summary requires at least one segment.');
  });

  it('rejects zero or negative segment lengths', () => {
    expect(() =>
      summarizeDuctRunQuantity({
        shape: 'flat_oval',
        engineeringSystem: 'standard_duct',
        width: 30,
        height: 14,
        segments: [{ index: 0, length: 0, isPartial: false, startStation: 0, endStation: 0 }],
      })
    ).toThrow('Duct run segment 0 must have a positive length.');
  });
});
