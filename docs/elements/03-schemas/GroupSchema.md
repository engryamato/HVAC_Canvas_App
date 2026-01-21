# Group Schema

## Overview

The Group Schema defines the data structure and validation rules for Group entities in the HVAC Canvas application. Groups allow users to organize multiple entities together, enabling batch operations like moving, rotating, and managing collections of related HVAC components.

## Location

```
src/core/schema/group.schema.ts
```

## Purpose

- Define the structure of Group entity data
- Enforce minimum group size (at least 2 entities)
- Track child entity references via UUIDs
- Support hierarchical organization of canvas elements
- Provide TypeScript type inference for compile-time safety

## Dependencies

- `zod` - Schema validation library
- `@/core/schema/base.schema` - Base entity schema

## Schema Definitions

### GroupPropsSchema

Defines the editable properties of a group.

```typescript
export const GroupPropsSchema = z.object({
  name: z.string().min(1).max(100),
  childIds: z.array(z.string().uuid()).min(2, 'A group must contain at least 2 entities'),
});

export type GroupProps = z.infer<typeof GroupPropsSchema>;
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `childIds`: Array of UUID strings, minimum 2 entities required

### Complete GroupSchema

```typescript
export const GroupSchema = BaseEntitySchema.extend({
  type: z.literal('group'),
  props: GroupPropsSchema,
});

export type Group = z.infer<typeof GroupSchema>;
```

## Default Values

```typescript
export const DEFAULT_GROUP_PROPS: Omit<GroupProps, 'childIds'> = {
  name: 'New Group',
};
```

Note: `childIds` must be provided when creating a group, as it requires at least 2 entities.

## Validation Examples

### Valid Group

```typescript
const validGroup = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'group',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Kitchen System',
    childIds: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
      '550e8400-e29b-41d4-a716-446655440012',
    ],
  },
};

const result = GroupSchema.safeParse(validGroup);
// result.success === true
```

### Valid Large Group

```typescript
const validLargeGroup = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'group',
  transform: { x: 200, y: 300, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Complete HVAC Layout',
    childIds: [
      '550e8400-e29b-41d4-a716-446655440020',
      '550e8400-e29b-41d4-a716-446655440021',
      '550e8400-e29b-41d4-a716-446655440022',
      '550e8400-e29b-41d4-a716-446655440023',
      '550e8400-e29b-41d4-a716-446655440024',
      '550e8400-e29b-41d4-a716-446655440025',
    ],
  },
};

const result = GroupSchema.safeParse(validLargeGroup);
// result.success === true
```

### Invalid Group (Only One Child)

```typescript
const invalidGroup = {
  // ...valid base fields
  props: {
    name: 'Invalid Group',
    childIds: [
      '550e8400-e29b-41d4-a716-446655440010',
    ],  // ❌ Must have at least 2 entities
  },
};

const result = GroupPropsSchema.safeParse(invalidGroup.props);
// result.success === false
// result.error.issues[0].message === 'A group must contain at least 2 entities'
```

### Invalid Group (Empty Name)

```typescript
const invalidGroup = {
  // ...valid base fields
  props: {
    name: '',  // ❌ Name cannot be empty
    childIds: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  },
};

const result = GroupPropsSchema.safeParse(invalidGroup.props);
// result.success === false
```

### Invalid Group (Invalid UUID)

```typescript
const invalidGroup = {
  // ...valid base fields
  props: {
    name: 'Bad Group',
    childIds: [
      'not-a-uuid',  // ❌ Invalid UUID format
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  },
};

const result = GroupPropsSchema.safeParse(invalidGroup.props);
// result.success === false
// result.error.issues[0].message === 'Invalid uuid'
```

### Invalid Group (Empty Children Array)

```typescript
const invalidGroup = {
  // ...valid base fields
  props: {
    name: 'Empty Group',
    childIds: [],  // ❌ Must have at least 2 entities
  },
};

const result = GroupPropsSchema.safeParse(invalidGroup.props);
// result.success === false
// result.error.issues[0].message === 'A group must contain at least 2 entities'
```

## Entity Structure Diagram

```
Group Entity
├── id: string (UUID)
├── type: 'group'
├── transform
│   ├── x: number
│   ├── y: number
│   ├── rotation: number
│   ├── scaleX: number
│   └── scaleY: number
├── zIndex: number
├── createdAt: string (ISO date)
├── modifiedAt: string (ISO date)
└── props
    ├── name: string (1-100 chars)
    └── childIds: string[] (min 2 UUIDs)
```

## Usage Examples

### Creating a Group

```typescript
import { DEFAULT_GROUP_PROPS } from '@/core/schema/group.schema';
import { createDefaultTransform, getCurrentTimestamp } from '@/core/schema/base.schema';

const group = {
  id: crypto.randomUUID(),
  type: 'group',
  transform: createDefaultTransform({ x: 300, y: 400 }),
  zIndex: 5,
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: {
    ...DEFAULT_GROUP_PROPS,
    name: 'Supply System',
    childIds: [
      '550e8400-e29b-41d4-a716-446655440030',
      '550e8400-e29b-41d4-a716-446655440031',
      '550e8400-e29b-41d4-a716-446655440032',
    ],
  },
};
```

### Validating Group Props

```typescript
import { GroupPropsSchema } from '@/core/schema/group.schema';

const validateGroupProps = (input: unknown) => {
  const result = GroupPropsSchema.safeParse(input);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    };
  }

  return { valid: true, data: result.data };
};

// Usage
const userInput = {
  name: 'Exhaust System',
  childIds: [
    '550e8400-e29b-41d4-a716-446655440040',
    '550e8400-e29b-41d4-a716-446655440041',
    '550e8400-e29b-41d4-a716-446655440042',
  ],
};

const validation = validateGroupProps(userInput);
if (validation.valid) {
  console.log('Valid group props:', validation.data);
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Managing Group Membership

```typescript
import { Group } from '@/core/schema/group.schema';
import { getCurrentTimestamp } from '@/core/schema/base.schema';

function addEntityToGroup(group: Group, entityId: string): Group {
  // Avoid duplicates
  if (group.props.childIds.includes(entityId)) {
    return group;
  }

  return {
    ...group,
    props: {
      ...group.props,
      childIds: [...group.props.childIds, entityId],
    },
    modifiedAt: getCurrentTimestamp(),
  };
}

function removeEntityFromGroup(group: Group, entityId: string): Group | null {
  const newChildIds = group.props.childIds.filter((id) => id !== entityId);

  // Cannot have a group with less than 2 entities
  if (newChildIds.length < 2) {
    return null;  // Group should be deleted
  }

  return {
    ...group,
    props: {
      ...group.props,
      childIds: newChildIds,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}

function replaceEntityInGroup(
  group: Group,
  oldEntityId: string,
  newEntityId: string
): Group {
  return {
    ...group,
    props: {
      ...group.props,
      childIds: group.props.childIds.map((id) =>
        id === oldEntityId ? newEntityId : id
      ),
    },
    modifiedAt: getCurrentTimestamp(),
  };
}
```

### Group Queries

```typescript
import { Group } from '@/core/schema/group.schema';

function isEntityInGroup(group: Group, entityId: string): boolean {
  return group.props.childIds.includes(entityId);
}

function getGroupSize(group: Group): number {
  return group.props.childIds.length;
}

function findGroupsContainingEntity(groups: Group[], entityId: string): Group[] {
  return groups.filter((group) => isEntityInGroup(group, entityId));
}

function findGroupByName(groups: Group[], name: string): Group | undefined {
  return groups.find((group) => group.props.name === name);
}

function getChildrenIds(group: Group): string[] {
  return [...group.props.childIds];
}
```

### Merging Groups

```typescript
import { Group, GroupProps } from '@/core/schema/group.schema';
import { getCurrentTimestamp } from '@/core/schema/base.schema';

function mergeGroups(group1: Group, group2: Group, newName?: string): Group {
  // Combine child IDs, removing duplicates
  const combinedChildIds = Array.from(
    new Set([...group1.props.childIds, ...group2.props.childIds])
  );

  return {
    id: crypto.randomUUID(),
    type: 'group',
    transform: group1.transform,  // Use first group's transform
    zIndex: Math.max(group1.zIndex, group2.zIndex),
    createdAt: getCurrentTimestamp(),
    modifiedAt: getCurrentTimestamp(),
    props: {
      name: newName || `${group1.props.name} + ${group2.props.name}`,
      childIds: combinedChildIds,
    },
  };
}
```

### Splitting Groups

```typescript
import { Group } from '@/core/schema/group.schema';

function splitGroup(
  group: Group,
  splitAtIndex: number
): [Group | null, Group | null] {
  const firstHalf = group.props.childIds.slice(0, splitAtIndex);
  const secondHalf = group.props.childIds.slice(splitAtIndex);

  // Each half must have at least 2 entities
  const group1 = firstHalf.length >= 2
    ? {
        id: crypto.randomUUID(),
        type: 'group' as const,
        transform: group.transform,
        zIndex: group.zIndex,
        createdAt: getCurrentTimestamp(),
        modifiedAt: getCurrentTimestamp(),
        props: {
          name: `${group.props.name} (1)`,
          childIds: firstHalf,
        },
      }
    : null;

  const group2 = secondHalf.length >= 2
    ? {
        id: crypto.randomUUID(),
        type: 'group' as const,
        transform: group.transform,
        zIndex: group.zIndex,
        createdAt: getCurrentTimestamp(),
        modifiedAt: getCurrentTimestamp(),
        props: {
          name: `${group.props.name} (2)`,
          childIds: secondHalf,
        },
      }
    : null;

  return [group1, group2];
}
```

### Hierarchical Group Helpers

```typescript
import { Group, BaseEntity } from '@/core/schema/group.schema';

function hasNestedGroups(group: Group, allEntities: Map<string, BaseEntity>): boolean {
  return group.props.childIds.some((id) => {
    const entity = allEntities.get(id);
    return entity?.type === 'group';
  });
}

function flattenGroupHierarchy(
  group: Group,
  allGroups: Map<string, Group>
): string[] {
  const result: string[] = [];

  for (const childId of group.props.childIds) {
    const childGroup = allGroups.get(childId);
    if (childGroup) {
      // Recursively flatten nested groups
      result.push(...flattenGroupHierarchy(childGroup, allGroups));
    } else {
      // Leaf entity (not a group)
      result.push(childId);
    }
  }

  return result;
}

function getGroupDepth(group: Group, allGroups: Map<string, Group>): number {
  let maxDepth = 0;

  for (const childId of group.props.childIds) {
    const childGroup = allGroups.get(childId);
    if (childGroup) {
      const depth = getGroupDepth(childGroup, allGroups);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth + 1;
}
```

### Updating Group Name

```typescript
import { Group } from '@/core/schema/group.schema';
import { getCurrentTimestamp } from '@/core/schema/base.schema';

function renameGroup(group: Group, newName: string): Group {
  return {
    ...group,
    props: {
      ...group.props,
      name: newName,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}
```

## Related Elements

- [BaseSchema](./BaseSchema.md) - Base entity schema
- [selectionStore](../02-stores/selectionStore.md) - Multi-selection for grouping
- [canvasStore](../02-stores/canvasStore.md) - Group entity management

## Testing

```typescript
describe('GroupPropsSchema', () => {
  it('validates correct group props', () => {
    const props = {
      name: 'Test Group',
      childIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('validates group with many children', () => {
    const props = {
      name: 'Large Group',
      childIds: Array.from({ length: 10 }, () => crypto.randomUUID()),
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('rejects group with only one child', () => {
    const props = {
      name: 'Small Group',
      childIds: ['550e8400-e29b-41d4-a716-446655440000'],
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('A group must contain at least 2 entities');
  });

  it('rejects group with empty children array', () => {
    const props = {
      name: 'Empty Group',
      childIds: [],
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const props = {
      name: '',
      childIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    const props = {
      name: 'A'.repeat(101),
      childIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID in childIds', () => {
    const props = {
      name: 'Test Group',
      childIds: [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('accepts exactly 2 children', () => {
    const props = {
      name: 'Minimal Group',
      childIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    };
    const result = GroupPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });
});

describe('GroupSchema', () => {
  it('validates complete group entity', () => {
    const group = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'group',
      transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 5,
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      props: {
        name: 'Kitchen System',
        childIds: [
          '550e8400-e29b-41d4-a716-446655440010',
          '550e8400-e29b-41d4-a716-446655440011',
        ],
      },
    };
    const result = GroupSchema.safeParse(group);
    expect(result.success).toBe(true);
  });

  it('enforces type literal', () => {
    const group = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'room',  // Wrong type
      transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 5,
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      props: {
        name: 'Test',
        childIds: [
          '550e8400-e29b-41d4-a716-446655440010',
          '550e8400-e29b-41d4-a716-446655440011',
        ],
      },
    };
    const result = GroupSchema.safeParse(group);
    expect(result.success).toBe(false);
  });
});

describe('DEFAULT_GROUP_PROPS', () => {
  it('has default name', () => {
    expect(DEFAULT_GROUP_PROPS.name).toBe('New Group');
  });

  it('does not include childIds', () => {
    expect('childIds' in DEFAULT_GROUP_PROPS).toBe(false);
  });
});

describe('Group operations', () => {
  const mockGroup: Group = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'group',
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: '2025-12-29T10:00:00Z',
    modifiedAt: '2025-12-29T10:00:00Z',
    props: {
      name: 'Test Group',
      childIds: [
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011',
      ],
    },
  };

  it('adds entity to group', () => {
    const newEntityId = '550e8400-e29b-41d4-a716-446655440012';
    const updated = addEntityToGroup(mockGroup, newEntityId);
    expect(updated.props.childIds).toHaveLength(3);
    expect(updated.props.childIds).toContain(newEntityId);
  });

  it('removes entity from group', () => {
    const updated = removeEntityFromGroup(mockGroup, mockGroup.props.childIds[0]);
    expect(updated).not.toBeNull();
    expect(updated!.props.childIds).toHaveLength(1);
  });

  it('returns null when removing would leave less than 2 entities', () => {
    const smallGroup: Group = {
      ...mockGroup,
      props: {
        ...mockGroup.props,
        childIds: [
          '550e8400-e29b-41d4-a716-446655440010',
          '550e8400-e29b-41d4-a716-446655440011',
        ],
      },
    };
    const updated = removeEntityFromGroup(smallGroup, smallGroup.props.childIds[0]);
    expect(updated).toBeNull();
  });

  it('checks if entity is in group', () => {
    expect(isEntityInGroup(mockGroup, mockGroup.props.childIds[0])).toBe(true);
    expect(isEntityInGroup(mockGroup, '550e8400-e29b-41d4-a716-446655440099')).toBe(false);
  });
});
```
