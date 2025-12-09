import type { Room } from '@/core/schema';
import { DEFAULT_ROOM_PROPS } from '@/core/schema/room.schema';

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
 * Calculate room values from dimensions and ACH
 */
export function calculateRoomValues(
  widthInches: number,
  lengthInches: number,
  heightInches: number,
  airChangesPerHour: number
): { area: number; volume: number; requiredCFM: number } {
  // Convert to feet
  const widthFt = widthInches / 12;
  const lengthFt = lengthInches / 12;
  const heightFt = heightInches / 12;

  // Calculate area in sq ft
  const area = widthFt * lengthFt;

  // Calculate volume in cu ft
  const volume = area * heightFt;

  // Calculate required CFM
  // CFM = (Volume * ACH) / 60
  const requiredCFM = (volume * airChangesPerHour) / 60;

  return {
    area: Math.round(area * 100) / 100,
    volume: Math.round(volume * 100) / 100,
    requiredCFM: Math.round(requiredCFM * 100) / 100,
  };
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
    height: number;
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
    height: overrides?.height ?? DEFAULT_ROOM_PROPS.height,
    occupancyType: overrides?.occupancyType ?? DEFAULT_ROOM_PROPS.occupancyType,
    airChangesPerHour: overrides?.airChangesPerHour ?? DEFAULT_ROOM_PROPS.airChangesPerHour,
  };

  const calculated = calculateRoomValues(
    props.width,
    props.length,
    props.height,
    props.airChangesPerHour
  );

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
