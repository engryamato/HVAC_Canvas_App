import type { Room } from '@/core/schema';
import type { SceneNode } from '../types';

export function deriveRoomNode(room: Room): SceneNode {
  const { transform, props } = room;
  return {
    entityId: room.id,
    entityType: 'room',
    kind: 'mesh',
    transform: {
      position: {
        x: transform.x + props.width / 2,
        y: props.ceilingHeight / 2,
        z: transform.y + props.length / 2,
      },
      rotation: { x: 0, y: (-transform.rotation * Math.PI) / 180, z: 0 },
      scale: { x: transform.scaleX, y: 1, z: transform.scaleY },
    },
    geometryDescriptor: {
      type: 'box',
      width: props.width,
      height: props.ceilingHeight,
      depth: props.length,
    },
    materialDescriptor: {
      color: 0x93c5fd,
      opacity: 0.15,
      transparent: true,
    },
    interactionDescriptor: {
      selectable: true,
      editable: true,
      highlightable: true,
    },
    bounds: {
      width: props.width,
      height: props.ceilingHeight,
      depth: props.length,
    },
    label: props.name,
  };
}
