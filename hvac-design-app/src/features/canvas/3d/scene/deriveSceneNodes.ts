import type { Entity, Note } from '@/core/schema';
import type { SceneNode } from '../types';
import { deriveDuctNode } from './deriveDuctNode';
import { deriveEquipmentNode } from './deriveEquipmentNode';
import { deriveFittingNode } from './deriveFittingNode';
import { deriveRoomNode } from './deriveRoomNode';

function deriveNoteNode(note: Note): SceneNode {
  return {
    entityId: note.id,
    entityType: 'note',
    kind: 'mesh',
    transform: {
      position: {
        x: note.transform.x,
        y: 14,
        z: note.transform.y,
      },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    geometryDescriptor: {
      type: 'box',
      width: 20,
      height: 20,
      depth: 4,
    },
    materialDescriptor: {
      color: 0xfacc15,
    },
    interactionDescriptor: {
      selectable: true,
      editable: true,
      highlightable: true,
    },
    bounds: {
      width: 20,
      height: 20,
      depth: 4,
    },
    label: note.props.content,
  };
}

export function deriveSceneNodes(entities: Entity[]): SceneNode[] {
  return entities.flatMap((entity) => {
    switch (entity.type) {
      case 'duct': {
        const node = deriveDuctNode(entity);
        return node ? [node] : [];
      }
      case 'room':
        return [deriveRoomNode(entity)];
      case 'equipment':
        return [deriveEquipmentNode(entity)];
      case 'fitting':
        return [deriveFittingNode(entity)];
      case 'note':
        return [deriveNoteNode(entity)];
      default:
        return [];
    }
  });
}
