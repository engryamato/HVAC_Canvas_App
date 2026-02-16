import { z } from 'zod';

/**
 * Labor rates with regional adjustments
 */
export const LaborRatesSchema = z.object({
  baseRate: z.number().min(0), // Base hourly rate ($/hr)
  regionalMultiplier: z.number().min(0).default(1.0), // Regional cost multiplier (e.g., 1.2 for high-cost areas)
  overtimeRate: z.number().min(0).optional(), // Optional overtime hourly rate
  currency: z.string().default('USD'),
});

export type LaborRates = z.infer<typeof LaborRatesSchema>;

/**
 * Markup and overhead settings
 */
export const MarkupSettingsSchema = z.object({
  materialMarkup: z.number().min(0), // Markup percentage on materials (0.15 = 15%)
  laborMarkup: z.number().min(0), // Markup percentage on labor
  overhead: z.number().min(0), // General overhead percentage
  profitMargin: z.number().min(0).optional(), // Profit margin percentage
  
  // Tax settings
  taxRate: z.number().min(0).optional(), // Sales tax rate
  includeTaxInEstimate: z.boolean().default(true),
});

export type MarkupSettings = z.infer<typeof MarkupSettingsSchema>;

/**
 * Waste factors by component category
 */
export const WasteFactorsSchema = z.object({
  default: z.number().min(0).max(1).default(0.10), // 10% default waste
  
  // Category-specific waste factors
  ducts: z.number().min(0).max(1).optional(),
  fittings: z.number().min(0).max(1).optional(),
  equipment: z.number().min(0).max(1).optional(),
  accessories: z.number().min(0).max(1).optional(),
  
  // Custom category waste factors
  custom: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

export type WasteFactors = z.infer<typeof WasteFactorsSchema>;

/**
 * Engineering limits and constraints
 */
export const EngineeringLimitsSchema = z.object({
  // Velocity constraints (feet per minute)
  maxVelocity: z.object({
    supply: z.number().min(0).default(2500),
    return: z.number().min(0).default(2000),
    exhaust: z.number().min(0).default(2000),
  }),
  
  minVelocity: z.object({
    supply: z.number().min(0).default(600),
    return: z.number().min(0).default(500),
    exhaust: z.number().min(0).default(500),
  }),
  
  // Pressure drop targets (inches water gauge per 100 ft)
  maxPressureDrop: z.object({
    supply: z.number().min(0).default(0.10),
    return: z.number().min(0).default(0.08),
    exhaust: z.number().min(0).default(0.08),
  }),
  
  // Friction factors by material
  frictionFactors: z.object({
    galvanized: z.number().default(0.0005),
    stainless: z.number().default(0.00015),
    flexible: z.number().default(0.003),
    fiberglass: z.number().default(0.0003),
  }),
  
  // Standard atmospheric conditions
  standardConditions: z.object({
    temperature: z.number().default(70), // °F
    pressure: z.number().default(29.92), // inches Hg
    altitude: z.number().default(0), // feet
  }),
});

export type EngineeringLimits = z.infer<typeof EngineeringLimitsSchema>;

/**
 * Named calculation template for quick project setup
 */
export const CalculationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  templateVersion: z.string().optional(),
  lockedDefaults: z.boolean().optional(),
  regionPresetId: z.string().optional(),
  
  // Template configuration
  laborRates: LaborRatesSchema,
  markupSettings: MarkupSettingsSchema,
  wasteFactors: WasteFactorsSchema,
  engineeringLimits: EngineeringLimitsSchema,
  
  // Metadata
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CalculationTemplate = z.infer<typeof CalculationTemplateSchema>;

/**
 * Project-level calculation settings
 */
export const CalculationSettingsSchema = z.object({
  // Core settings
  laborRates: LaborRatesSchema,
  markupSettings: MarkupSettingsSchema,
  wasteFactors: WasteFactorsSchema,
  engineeringLimits: EngineeringLimitsSchema,
  
  // Project metadata
  projectName: z.string().optional(),
  location: z.string().optional(),
  estimator: z.string().optional(),
  
  // Template reference (if created from template)
  templateId: z.string().optional(),
  templateVersion: z.string().optional(),
  lockedDefaults: z.boolean().optional(),
  regionPresetId: z.string().optional(),
  
  // Metadata
  lastModified: z.date().optional(),
});

export type CalculationSettings = z.infer<typeof CalculationSettingsSchema>;

export const COMMERCIAL_STANDARD_TEMPLATE: CalculationTemplate = {
  id: 'commercial-standard',
  name: 'Commercial Standard',
  description: 'Standard commercial HVAC calculations',
  templateVersion: '1.0.0',
  lockedDefaults: false,
  isDefault: true,
  isShared: true,
  laborRates: {
    baseRate: 65,
    regionalMultiplier: 1.0,
    overtimeRate: 97.5,
    currency: 'USD',
  },
  markupSettings: {
    materialMarkup: 0.15,
    laborMarkup: 0.10,
    overhead: 0.08,
    profitMargin: 0.10,
    includeTaxInEstimate: true,
  },
  wasteFactors: {
    default: 0.10,
    ducts: 0.10,
    fittings: 0.05,
    equipment: 0.02,
  },
  engineeringLimits: {
    maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
    minVelocity: { supply: 600, return: 500, exhaust: 500 },
    maxPressureDrop: { supply: 0.10, return: 0.08, exhaust: 0.08 },
    frictionFactors: { galvanized: 0.0005, stainless: 0.00015, flexible: 0.003, fiberglass: 0.0003 },
    standardConditions: { temperature: 70, pressure: 29.92, altitude: 0 },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const RESIDENTIAL_BUDGET_TEMPLATE: CalculationTemplate = {
  id: 'residential-budget',
  name: 'Residential Budget',
  description: 'Budget-friendly residential HVAC calculations',
  templateVersion: '1.0.0',
  lockedDefaults: false,
  isDefault: false,
  isShared: true,
  laborRates: {
    baseRate: 45,
    regionalMultiplier: 1.0,
    overtimeRate: 67.5,
    currency: 'USD',
  },
  markupSettings: {
    materialMarkup: 0.10,
    laborMarkup: 0.08,
    overhead: 0.05,
    profitMargin: 0.08,
    includeTaxInEstimate: true,
  },
  wasteFactors: {
    default: 0.15,
    ducts: 0.15,
    fittings: 0.10,
    equipment: 0.03,
  },
  engineeringLimits: {
    maxVelocity: { supply: 2000, return: 1800, exhaust: 1800 },
    minVelocity: { supply: 500, return: 400, exhaust: 400 },
    maxPressureDrop: { supply: 0.08, return: 0.06, exhaust: 0.06 },
    frictionFactors: { galvanized: 0.0005, stainless: 0.00015, flexible: 0.003, fiberglass: 0.0003 },
    standardConditions: { temperature: 70, pressure: 29.92, altitude: 0 },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const INDUSTRIAL_HEAVY_TEMPLATE: CalculationTemplate = {
  id: 'industrial-heavy',
  name: 'Industrial Heavy',
  description: 'Heavy-duty industrial HVAC calculations',
  templateVersion: '1.0.0',
  lockedDefaults: false,
  isDefault: false,
  isShared: true,
  laborRates: {
    baseRate: 85,
    regionalMultiplier: 1.0,
    overtimeRate: 127.5,
    currency: 'USD',
  },
  markupSettings: {
    materialMarkup: 0.20,
    laborMarkup: 0.15,
    overhead: 0.12,
    profitMargin: 0.12,
    includeTaxInEstimate: true,
  },
  wasteFactors: {
    default: 0.08,
    ducts: 0.08,
    fittings: 0.03,
    equipment: 0.02,
  },
  engineeringLimits: {
    maxVelocity: { supply: 3000, return: 2500, exhaust: 2500 },
    minVelocity: { supply: 800, return: 600, exhaust: 600 },
    maxPressureDrop: { supply: 0.12, return: 0.10, exhaust: 0.10 },
    frictionFactors: { galvanized: 0.0005, stainless: 0.00015, flexible: 0.003, fiberglass: 0.0003 },
    standardConditions: { temperature: 70, pressure: 29.92, altitude: 0 },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
