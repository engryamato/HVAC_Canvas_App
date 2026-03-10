import type { Equipment } from '@/core/schema';
import type { SceneNode } from '../types';

const EQUIPMENT_COLORS: Record<Equipment['props']['equipmentType'], number> = {
  hood: 0xea580c,
  fan: 0x2563eb,
  diffuser: 0x16a34a,
  damper: 0xc2410c,
  air_handler: 0x334155,
  furnace: 0xd97706,
  rtu: 0x0891b2,
};

export function deriveEquipmentNode(equipment: Equipment): SceneNode {
  const { transform, props } = equipment;
  const mountHeight = props.mountHeight ?? 0;
  return {
    entityId: equipment.id,
    entityType: 'equipment',
    kind: 'mesh',
    transform: {
      position: {
        x: transform.x + props.width / 2,
        y: mountHeight + props.height / 2,
        z: transform.y + props.depth / 2,
      },
      rotation: { x: 0, y: (-transform.rotation * Math.PI) / 180, z: 0 },
      scale: { x: transform.scaleX, y: 1, z: transform.scaleY },
    },
    geometryDescriptor: {
      type: 'box',
      width: props.width,
      height: props.height,
      depth: props.depth,
    },
    materialDescriptor: {
      color: EQUIPMENT_COLORS[props.equipmentType],
    },
    interactionDescriptor: {
      selectable: true,
      editable: true,
      highlightable: true,
    },
    bounds: {
      width: props.width,
      height: props.height,
      depth: props.depth,
    },
    label: props.name,
  };
}
