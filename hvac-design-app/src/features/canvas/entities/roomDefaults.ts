import type { Room } from '@/core/schema';
import { DEFAULT_ROOM_PROPS } from '@/core/schema/room.schema';
import { calculateRoomValues } from '../calculators/ventilation';

/**
 * Counter for auto-incrementing room names
 */
let roomCounter = 1;

/**
 * Reset the room counter (useful for testing)
 */
export function resetRoomCounter(): void {
  roomCounter = 1;
}

/**
 * Get the next room number and increment counter
 */
export function getNextRoomNumber(): number {
  return roomCounter++;
}

/**
 * Create a new room entity with default values
 */
export function createRoom(
  overrides?: Partial<{
    name: string;
    x: number;
    y: number;
    width: number;
    length: number;
    ceilingHeight: number;
    occupancyType: Room['props']['occupancyType'];
    airChangesPerHour: number;
  }>
): Room {
  const roomNumber = getNextRoomNumber();
  const now = new Date().toISOString();

  const props = {
    name: overrides?.name ?? `Room ${roomNumber}`,
    width: overrides?.width ?? DEFAULT_ROOM_PROPS.width,
    length: overrides?.length ?? DEFAULT_ROOM_PROPS.length,
    ceilingHeight: overrides?.ceilingHeight ?? DEFAULT_ROOM_PROPS.ceilingHeight,
    occupancyType: overrides?.occupancyType ?? DEFAULT_ROOM_PROPS.occupancyType,
    airChangesPerHour: overrides?.airChangesPerHour ?? DEFAULT_ROOM_PROPS.airChangesPerHour,
  };

  const calculated = calculateRoomValues({
    id: 'temp',
    type: 'room',
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: now,
    modifiedAt: now,
    props,
    calculated: { area: 0, volume: 0, requiredCFM: 0 },
  } as Room);

  return {
    id: crypto.randomUUID(),
    type: 'room',
    transform: {
      x: overrides?.x ?? 0,
      y: overrides?.y ?? 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 0,
    createdAt: now,
    modifiedAt: now,
    props,
    calculated,
  };
}

export default createRoom;
