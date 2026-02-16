import type { DuctMaterial, DuctProps, DuctShape } from '../schema/duct.schema';

export interface DuctDimensions {
  shape: DuctShape;
  diameter?: number;
  width?: number;
  height?: number;
}

const MATERIAL_FRICTION_FACTORS: Record<DuctMaterial, number> = {
  galvanized: 0.0005,
  stainless: 0.00015,
  aluminum: 0.0002,
  flex: 0.003,
};

const STANDARD_ROUND_SIZES_IN = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 48, 54, 60];

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateEquivalentDiameter(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return 0;
  }
  const numerator = Math.pow(width * height, 0.625) * 1.3;
  const denominator = Math.pow(width + height, 0.25);
  return round(numerator / denominator, 2);
}

export function calculateCrossSectionAreaSqFt(dimensions: DuctDimensions): number {
  if (dimensions.shape === 'round') {
    if (!dimensions.diameter || dimensions.diameter <= 0) {
      return 0;
    }
    const radiusInches = dimensions.diameter / 2;
    const areaSqInches = Math.PI * radiusInches * radiusInches;
    return areaSqInches / 144;
  }

  if (!dimensions.width || !dimensions.height || dimensions.width <= 0 || dimensions.height <= 0) {
    return 0;
  }
  return (dimensions.width * dimensions.height) / 144;
}

export function calculateVelocity(airflowCfm: number, dimensions: DuctDimensions): number {
  const areaSqFt = calculateCrossSectionAreaSqFt(dimensions);
  if (airflowCfm <= 0 || areaSqFt <= 0) {
    return 0;
  }
  return round(airflowCfm / areaSqFt, 1);
}

export function calculateFrictionFactor(material: DuctMaterial, velocityFpm: number): number {
  if (velocityFpm <= 0) {
    return MATERIAL_FRICTION_FACTORS[material];
  }

  // Flex ducts tend to behave non-linearly at high velocity; apply a mild scaling.
  if (material === 'flex') {
    const scale = Math.max(1, velocityFpm / 1200);
    return round(MATERIAL_FRICTION_FACTORS.flex * scale, 6);
  }

  return MATERIAL_FRICTION_FACTORS[material];
}

export function calculatePressureDrop(
  lengthFeet: number,
  velocityFpm: number,
  frictionFactor: number,
  hydraulicDiameterInches: number
): number {
  if (lengthFeet <= 0 || velocityFpm <= 0 || frictionFactor <= 0 || hydraulicDiameterInches <= 0) {
    return 0;
  }

  // Simplified engineering approximation for in.w.g per 100 ft.
  const diameterFactor = Math.pow(12 / hydraulicDiameterInches, 1.2);
  const velocityFactor = Math.pow(velocityFpm / 1000, 1.9);
  const frictionPer100 = 0.109136 * velocityFactor * diameterFactor * (frictionFactor / 0.0005);
  const pressureForLength = (frictionPer100 / 100) * lengthFeet;

  return round(pressureForLength, 4);
}

export function suggestDuctSize(airflowCfm: number, maxVelocityFpm: number): number {
  if (airflowCfm <= 0 || maxVelocityFpm <= 0) {
    return STANDARD_ROUND_SIZES_IN[0] ?? 4;
  }

  const requiredAreaSqFt = airflowCfm / maxVelocityFpm;
  const requiredAreaSqIn = requiredAreaSqFt * 144;
  const requiredDiameter = Math.sqrt((4 * requiredAreaSqIn) / Math.PI);

  for (const size of STANDARD_ROUND_SIZES_IN) {
    if (size >= requiredDiameter) {
      return size;
    }
  }

  return STANDARD_ROUND_SIZES_IN[STANDARD_ROUND_SIZES_IN.length - 1] ?? 60;
}

export function getHydraulicDiameter(props: Pick<DuctProps, 'shape' | 'diameter' | 'width' | 'height'>): number {
  if (props.shape === 'round') {
    return props.diameter ?? 0;
  }
  return calculateEquivalentDiameter(props.width ?? 0, props.height ?? 0);
}

