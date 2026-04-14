import type { Group } from '@/core/schema/group.schema';

export function createGroup(
  name: string,
  childIds: string[],
  transform?: Partial<Group['transform']>
): Group {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    type: 'group',
    transform: {
      x: transform?.x ?? 0,
      y: transform?.y ?? 0,
      elevation: transform?.elevation ?? 0,
      rotation: transform?.rotation ?? 0,
      scaleX: transform?.scaleX ?? 1,
      scaleY: transform?.scaleY ?? 1,
    },
    zIndex: 4,
    createdAt: now,
    modifiedAt: now,
    props: {
      name,
      childIds,
    },
  };
}

export default createGroup;
