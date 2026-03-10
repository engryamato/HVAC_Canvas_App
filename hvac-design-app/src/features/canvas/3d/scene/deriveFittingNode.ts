import type { Fitting } from '@/core/schema';
import type { SceneNode } from '../types';

function fittingDimensions(fittingType: Fitting['props']['fittingType']) {
  switch (fittingType) {
    case 'tee':
    case 'wye':
      return { width: 36, height: 18, depth: 36 };
    case 'reducer':
    case 'reducer_tapered':
    case 'reducer_eccentric':
    case 'transition_square_to_round':
      return { width: 28, height: 16, depth: 20 };
    case 'cap':
    case 'end_boot':
      return { width: 20, height: 16, depth: 20 };
    default:
      return { width: 24, height: 16, depth: 24 };
  }
}

export function deriveFittingNode(fitting: Fitting): SceneNode {
  const { transform, props } = fitting;
  const { width, height, depth } = fittingDimensions(props.fittingType);
  const geometryDescriptor = props.fittingType.startsWith('elbow')
    ? {
        type: 'cylinder' as const,
        radiusTop: width / 2,
        radiusBottom: width / 2,
        height: depth,
        radialSegments: 12,
      }
    : {
        type: 'box' as const,
        width,
        height,
        depth,
      };

  return {
    entityId: fitting.id,
    entityType: 'fitting',
    kind: 'mesh',
    transform: {
      position: {
        x: transform.x,
        y: height / 2,
        z: transform.y,
      },
      rotation: { x: 0, y: (-transform.rotation * Math.PI) / 180, z: 0 },
      scale: { x: transform.scaleX, y: 1, z: transform.scaleY },
    },
    geometryDescriptor,
    materialDescriptor: {
      color: 0xf59e0b,
    },
    interactionDescriptor: {
      selectable: true,
      editable: true,
      highlightable: true,
    },
    bounds: { width, height, depth },
    label: props.name ?? props.fittingType,
  };
}
