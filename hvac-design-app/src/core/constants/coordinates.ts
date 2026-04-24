export const PIXELS_PER_INCH = 1;
export const INCHES_PER_FOOT = 12;
export const PIXELS_PER_FOOT = PIXELS_PER_INCH * INCHES_PER_FOOT;

export function feetToPixels(feet: number): number {
  return feet * PIXELS_PER_FOOT;
}

export function pixelsToFeet(pixels: number): number {
  return pixels / PIXELS_PER_FOOT;
}

export function inchesToPixels(inches: number): number {
  return inches * PIXELS_PER_INCH;
}

export function pixelsToInches(pixels: number): number {
  return pixels / PIXELS_PER_INCH;
}

export function roundFeet(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
