export type UnitSystem = 'imperial' | 'metric';

export function formatLength(value: number | null, unitSystem: UnitSystem): string {
  if (value === null) {
    return '-';
  }
  if (unitSystem === 'metric') {
    return `${Math.round(value * 0.3048).toLocaleString()} m`;
  }
  return `${Math.round(value).toLocaleString()} ft`;
}

export function formatArea(value: number | null, unitSystem: UnitSystem): string {
  if (value === null) {
    return '-';
  }
  if (unitSystem === 'metric') {
    return `${Math.round(value * 0.092903).toLocaleString()} sq m`;
  }
  return `${Math.round(value).toLocaleString()} sq ft`;
}

export function formatAirflow(value: number | null, unitSystem: UnitSystem): string {
  if (value === null) {
    return '-';
  }
  if (unitSystem === 'metric') {
    return `${Math.round(value * 0.47194745).toLocaleString()} L/s`;
  }
  return `${Math.round(value).toLocaleString()} CFM`;
}

export function formatPressure(value: number | null, unitSystem: UnitSystem): string {
  if (value === null) {
    return '-';
  }
  if (unitSystem === 'metric') {
    return `${Math.round(value * 249.0889).toLocaleString()} Pa`;
  }
  return `${value.toFixed(2)} in. w.g.`;
}
