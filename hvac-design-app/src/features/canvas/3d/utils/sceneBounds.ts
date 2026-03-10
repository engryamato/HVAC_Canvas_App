import type { SceneNode } from '../types';

export interface Bounds3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

export function computeSceneBounds(nodes: SceneNode[]): Bounds3D {
  if (nodes.length === 0) {
    return {
      minX: -120,
      maxX: 120,
      minY: 0,
      maxY: 120,
      minZ: -120,
      maxZ: 120,
      centerX: 0,
      centerY: 60,
      centerZ: 0,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const node of nodes) {
    const halfWidth = node.bounds.width / 2;
    const halfHeight = node.bounds.height / 2;
    const halfDepth = node.bounds.depth / 2;
    minX = Math.min(minX, node.transform.position.x - halfWidth);
    maxX = Math.max(maxX, node.transform.position.x + halfWidth);
    minY = Math.min(minY, node.transform.position.y - halfHeight);
    maxY = Math.max(maxY, node.transform.position.y + halfHeight);
    minZ = Math.min(minZ, node.transform.position.z - halfDepth);
    maxZ = Math.max(maxZ, node.transform.position.z + halfDepth);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    centerZ: (minZ + maxZ) / 2,
  };
}
