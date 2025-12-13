import type { Room } from '@/core/schema';
import type { OccupancyType } from '@/core/schema/room.schema';

type OccupancyData = {
  rp: number; // cfm/person
  ra: number; // cfm/sqft
  defaultOccupantDensity: number; // people per 1000 sqft
  defaultACH: number;
};

const OCCUPANCY_LOOKUP: Record<OccupancyType, OccupancyData> = {
  office: { rp: 5, ra: 0.06, defaultOccupantDensity: 5, defaultACH: 4 },
  retail: { rp: 7.5, ra: 0.06, defaultOccupantDensity: 15, defaultACH: 6 },
  restaurant: { rp: 7.5, ra: 0.18, defaultOccupantDensity: 70, defaultACH: 20 },
  kitchen_commercial: { rp: 0, ra: 0.7, defaultOccupantDensity: 10, defaultACH: 25 },
  warehouse: { rp: 10, ra: 0.06, defaultOccupantDensity: 2, defaultACH: 3 },
  classroom: { rp: 10, ra: 0.12, defaultOccupantDensity: 35, defaultACH: 6 },
  conference: { rp: 5, ra: 0.06, defaultOccupantDensity: 50, defaultACH: 6 },
  lobby: { rp: 5, ra: 0.06, defaultOccupantDensity: 30, defaultACH: 6 },
};

/**
 * Calculate room floor area in square feet from inches.
 */
export function calculateRoomArea(widthInches: number, lengthInches: number): number {
  const widthFt = widthInches / 12;
  const lengthFt = lengthInches / 12;
  return round(widthFt * lengthFt, 2);
}

/**
 * Calculate room volume in cubic feet from inches.
 */
export function calculateRoomVolume(
  widthInches: number,
  lengthInches: number,
  heightInches: number
): number {
  const area = calculateRoomArea(widthInches, lengthInches);
  const heightFt = heightInches / 12;
  return round(area * heightFt, 2);
}

/**
 * Calculate required ventilation per ASHRAE 62.1 using Rp/RA.
 * If occupants not provided, estimates using default occupant density (people/1000 sqft).
 */
export function calculateVentilationCFM(
  occupancyType: OccupancyType,
  areaSqFt: number,
  occupants?: number
): number {
  const data = OCCUPANCY_LOOKUP[occupancyType];
  const estimatedOccupants =
    occupants !== undefined ? occupants : (areaSqFt / 1000) * data.defaultOccupantDensity;
  const peopleComponent = data.rp * estimatedOccupants;
  const areaComponent = data.ra * areaSqFt;
  const total = peopleComponent + areaComponent;
  // Round to nearest 5 CFM for practical sizing
  return roundToNearest(total, 5);
}

/**
 * Convert ACH and volume to CFM.
 */
export function calculateACHtoCFM(ach: number, volumeCuFt: number): number {
  const cfm = (volumeCuFt * ach) / 60;
  return roundToNearest(cfm, 5);
}

/**
 * Calculate full room calculated values from props.
 */
export function calculateRoomValues(room: Room): Room['calculated'] {
  const area = calculateRoomArea(room.props.width, room.props.length);
  const volume = calculateRoomVolume(room.props.width, room.props.length, room.props.height);
  const achCFM = calculateACHtoCFM(room.props.airChangesPerHour, volume);
  const ventilationCFM = calculateVentilationCFM(room.props.occupancyType, area);
  // Use the higher of ACH-based and ventilation-based requirements
  const requiredCFM = Math.max(achCFM, ventilationCFM);
  return {
    area,
    volume,
    requiredCFM,
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function roundToNearest(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }
  return Math.round(value / step) * step;
}

export default calculateRoomValues;
