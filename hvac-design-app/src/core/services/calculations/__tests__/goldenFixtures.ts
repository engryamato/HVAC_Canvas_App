import type { EngineeringLimits, WasteFactors } from '@/core/schema/calculation-settings.schema';

export const sourceNotes = {
  continuity: 'Continuity: velocity FPM = CFM / area ft^2.',
  roundArea: 'Round duct cross-section: area ft^2 = pi * (diameter inches / 24)^2.',
  standardRounding: 'Standard-size rounding: choose nearest diameter from STANDARD_ROUND_SIZES.',
  darcyWeisbach: 'Darcy-Weisbach as implemented by EngineeringCalculator: f * V^2 / (2 * 4005 * D).',
  fittingAngle: 'Three-way convention: acute branch angle off main run; wye <= 60 degrees, tee > 60 degrees.',
  propagation: 'Tree propagation: terminal CFM leaf-peeling upstream; pressure = friction length + fitting equivalent length.',
  sections: 'Fabrication stations: 40 ft run split into eight 5 ft sections.',
  bom: 'BOM aggregation: duct LF and fitting EA grouped by matching descriptors; waste = quantity * factor.',
  surfaceArea: 'Surface area: rect 2(W+H)L; round piDL; flat oval [pi*a + 2(A-a)]L; flex piDL*1.05.',
  weight: 'Weight: surface area ft^2 * nominal gauge lb/ft^2 * 1.15 seam allowance.',
} as const;

export const engineeringLimits: EngineeringLimits = {
  maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
  minVelocity: { supply: 600, return: 500, exhaust: 500 },
  maxPressureDrop: { supply: 1, return: 1, exhaust: 1 },
  frictionFactors: {
    galvanized: 0.0005,
    stainless: 0.00015,
    flexible: 0.003,
    fiberglass: 0.0003,
  },
  standardConditions: {
    temperature: 70,
    pressure: 29.92,
    altitude: 0,
  },
};

export const wasteFactors: WasteFactors = {
  default: 0.1,
  ducts: 0.1,
  fittings: 0.05,
  equipment: 0,
  accessories: 0,
};

export const velocityGolden = {
  airflowCfm: 1000,
  diameterInches: 12,
  areaSquareInches: Math.PI * 6 ** 2,
  expectedFpm: 1000 / (Math.PI * (12 / 24) ** 2),
  sourceNote: `${sourceNotes.continuity} ${sourceNotes.roundArea}`,
};

export const sizingGolden = {
  airflowCfm: 1000,
  targetVelocityFpm: 1500,
  calculatedDiameterInches: Math.sqrt((4 * ((1000 / 1500) * 144)) / Math.PI),
  nearestStandardDiameterInches: 11,
  sourceNote: sourceNotes.standardRounding,
};

export const pressureDropGolden = {
  velocityFpm: velocityGolden.expectedFpm,
  diameterInches: 12,
  frictionFactor: 0.0005,
  expectedInWgPer100Ft: (0.0005 * velocityGolden.expectedFpm ** 2) / (2 * 4005 * 12),
  sourceNote: sourceNotes.darcyWeisbach,
};

export const fittingGolden = {
  sourceNote: sourceNotes.fittingAngle,
  wyeBranchAngleDegrees: 30,
  teeBranchAngleDegrees: 90,
};

export const surfaceAreaGolden = {
  rectangular: {
    widthFeet: 24 / 12,
    heightFeet: 12 / 12,
    lengthFeet: 40,
    expectedSquareFeet: 2 * ((24 / 12) + (12 / 12)) * 40,
  },
  round: {
    diameterFeet: 12 / 12,
    lengthFeet: 40,
    expectedSquareFeet: Math.PI * (12 / 12) * 40,
  },
  flatOval: {
    majorFeet: 24 / 12,
    minorFeet: 12 / 12,
    lengthFeet: 40,
    expectedSquareFeet: (Math.PI * (12 / 12) + 2 * ((24 / 12) - (12 / 12))) * 40,
  },
  flex: {
    diameterFeet: 10 / 12,
    lengthFeet: 25,
    expectedSquareFeet: Math.PI * (10 / 12) * 25 * 1.05,
  },
  sourceNote: sourceNotes.surfaceArea,
};

export const weightGolden = {
  gauge: 24 as const,
  rectangularAreaSquareFeet: surfaceAreaGolden.rectangular.expectedSquareFeet,
  nominalLbPerSquareFoot: 1.156,
  seamFactor: 1.15,
  expectedPounds: surfaceAreaGolden.rectangular.expectedSquareFeet * 1.156 * 1.15,
  sourceNote: sourceNotes.weight,
};
