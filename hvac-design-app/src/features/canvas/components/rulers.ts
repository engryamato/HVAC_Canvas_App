type UnitSystem = 'imperial' | 'metric';

const PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;

function formatImperial(inches: number): string {
  const roundedInches = Math.round(inches * 100) / 100;
  const totalInches = Math.abs(roundedInches);
  const sign = roundedInches < 0 ? '-' : '';

  const feet = Math.floor(totalInches / 12);
  const inchRemainder = totalInches - feet * 12;

  if (feet > 0) {
    const displayInches = Math.round(inchRemainder * 100) / 100;
    return displayInches === 0
      ? `${sign}${feet}'`
      : `${sign}${feet}' ${displayInches}"`;
  }

  return `${sign}${totalInches.toFixed(totalInches < 10 ? 1 : 0)}"`;
}

function formatMetric(mm: number): string {
  const roundedMm = Math.round(mm);
  const abs = Math.abs(roundedMm);
  const sign = roundedMm < 0 ? '-' : '';

  if (abs >= 1000) {
    const meters = abs / 1000;
    return `${sign}${meters.toFixed(meters < 10 ? 2 : 1)} m`;
  }

  return `${sign}${abs} mm`;
}

export function formatRulerLabel(worldPx: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    const inches = worldPx / PX_PER_INCH;
    return formatMetric(inches * MM_PER_INCH);
  }

  return formatImperial(worldPx / PX_PER_INCH);
}

const IMPERIAL_INCH_STEPS = [
  1 / 8,
  1 / 4,
  1 / 2,
  1,
  2,
  4,
  6,
  12,
  24,
  48,
] as const;

const METRIC_MM_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000] as const;

export function pickRulerStepWorldPx(zoom: number, unitSystem: UnitSystem): number {
  const targetMin = 60;
  const targetMax = 120;

  const candidatesWorldPx =
    unitSystem === 'metric'
      ? METRIC_MM_STEPS.map((mm) => (mm / MM_PER_INCH) * PX_PER_INCH)
      : IMPERIAL_INCH_STEPS.map((inch) => inch * PX_PER_INCH);

  for (const worldStep of candidatesWorldPx) {
    const screenStep = worldStep * zoom;
    if (screenStep >= targetMin && screenStep <= targetMax) {
      return worldStep;
    }
  }

  for (const worldStep of candidatesWorldPx) {
    const screenStep = worldStep * zoom;
    if (screenStep >= targetMin) {
      return worldStep;
    }
  }

  return candidatesWorldPx[candidatesWorldPx.length - 1] ?? PX_PER_INCH;
}

