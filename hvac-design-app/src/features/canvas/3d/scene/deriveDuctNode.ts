import type { Duct } from '@/core/schema';
import type { SceneNode } from '../types';

const FEET_TO_PIXELS = 12;

export function deriveDuctNode(duct: Duct): SceneNode | null {
  const { transform, props } = duct;
  const length = props.length * FEET_TO_PIXELS;
  if (!Number.isFinite(length) || length <= 0) {
    return null;
  }

  const rotationY = (-transform.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  const midOffsetX = (length / 2) * cos;
  const midOffsetZ = (length / 2) * sin;

  if (props.shape === 'round') {
    const diameter = props.diameter ?? 12;
    return {
      entityId: duct.id,
      entityType: 'duct',
      kind: 'mesh',
      transform: {
        position: {
          x: transform.x + midOffsetX,
          y: diameter / 2,
          z: transform.y + midOffsetZ,
        },
        rotation: { x: 0, y: rotationY + Math.PI / 2, z: 0 },
        scale: { x: transform.scaleX, y: transform.scaleY, z: 1 },
      },
      geometryDescriptor: {
        type: 'cylinder',
        radiusTop: diameter / 2,
        radiusBottom: diameter / 2,
        height: length,
        radialSegments: 18,
      },
      materialDescriptor: {
        color: 0x94a3b8,
      },
      interactionDescriptor: {
        selectable: true,
        editable: true,
        highlightable: true,
      },
      bounds: {
        width: diameter,
        height: diameter,
        depth: length,
      },
      label: props.name,
    };
  }

  const width = props.width ?? 12;
  const height = props.height ?? 8;
  return {
    entityId: duct.id,
    entityType: 'duct',
    kind: 'mesh',
    transform: {
      position: {
        x: transform.x + midOffsetX,
        y: height / 2,
        z: transform.y + midOffsetZ,
      },
      rotation: { x: 0, y: rotationY, z: 0 },
      scale: { x: transform.scaleX, y: 1, z: transform.scaleY },
    },
    geometryDescriptor: {
      type: 'box',
      width: length,
      height,
      depth: width,
    },
    materialDescriptor: {
      color: 0x94a3b8,
    },
    interactionDescriptor: {
      selectable: true,
      editable: true,
      highlightable: true,
    },
    bounds: {
      width: length,
      height,
      depth: width,
    },
    label: props.name,
  };
}
