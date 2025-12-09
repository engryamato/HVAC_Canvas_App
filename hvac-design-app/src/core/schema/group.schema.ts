import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';

/**
 * Group properties for grouping multiple entities
 */
export const GroupPropsSchema = z.object({
  name: z.string().min(1).max(100),
  childIds: z.array(z.string().uuid()).min(2, 'A group must contain at least 2 entities'),
});

export type GroupProps = z.infer<typeof GroupPropsSchema>;

/**
 * Complete Group entity schema
 */
export const GroupSchema = BaseEntitySchema.extend({
  type: z.literal('group'),
  props: GroupPropsSchema,
});

export type Group = z.infer<typeof GroupSchema>;

/**
 * Default values for a new group (childIds must be provided when creating)
 */
export const DEFAULT_GROUP_PROPS: Omit<GroupProps, 'childIds'> = {
  name: 'New Group',
};

