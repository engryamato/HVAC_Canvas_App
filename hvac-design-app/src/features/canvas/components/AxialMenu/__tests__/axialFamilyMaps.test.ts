import { describe, expect, it } from 'vitest';
import { AXIAL_FAMILY_MAPS, type AxialNode } from '../axialFamilyMaps';

const forbidden = /draw|undo|export|calculate|size|material|inspector/i;

function collect(nodes: AxialNode[], depth = 1): Array<{ node: AxialNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...(node.children ? collect(node.children, depth + 1) : []),
  ]);
}

describe('AXIAL_FAMILY_MAPS', () => {
  it('does not include forbidden non-variant commands', () => {
    const allNodes = Object.values(AXIAL_FAMILY_MAPS).flatMap((nodes) => collect(nodes));

    expect(allNodes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          node: expect.objectContaining({
            label: expect.stringMatching(forbidden),
          }),
        }),
      ])
    );
  });

  it('limits nesting depth to three menu levels', () => {
    const allNodes = Object.values(AXIAL_FAMILY_MAPS).flatMap((nodes) => collect(nodes));

    expect(Math.max(...allNodes.map(({ depth }) => depth))).toBeLessThanOrEqual(3);
  });
});
