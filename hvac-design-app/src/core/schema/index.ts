// Base schemas and utilities
export * from './base.schema';

// Entity schemas
export * from './room.schema';
export * from './duct.schema';
export * from './equipment.schema';
export * from './fitting.schema';
export * from './note.schema';
export * from './group.schema';

// Project file schema
export * from './project-file.schema';

// Unified component schema (Phase 1.1)
export * from './unified-component.schema';

// Service schema (auto-fitting epic) — explicit exports to avoid conflicts with duct.schema
export {
    PressureClassSchema,
    type PressureClass,
    DimensionalConstraintsSchema,
    type DimensionalConstraints,
    FittingRuleSchema,
    type FittingRule,
    ServiceSchema,
    type Service,
    ServiceTemplateSchema,
    type ServiceTemplate,
    IndustrialMaterialSchema,
    type IndustrialMaterial,
    type IndustrialConstraints,
    DEFAULT_DIMENSIONAL_CONSTRAINTS,
} from './service.schema';

// Export service-specific type aliases and schemas for those that conflict with duct.schema
export {
    SystemTypeSchema as ServiceSystemTypeSchema,
    DuctShapeSchema as ServiceDuctShapeSchema,
    DuctMaterialSchema as ServiceDuctMaterialSchema,
} from './service.schema';

export type {
    SystemType as ServiceSystemType,
    DuctShape as ServiceDuctShape,
    DuctMaterial as ServiceDuctMaterial,
} from './service.schema';

// Explicit re-exports to resolve ambiguous barrel conflicts between 
// duct.schema.ts and service.schema.ts for identically-named exports.
// These ensure `DuctMaterial`, `DuctMaterialSchema`, `DuctShape`, `DuctShapeSchema`, 
// `SystemType`, and `SystemTypeSchema` are unambiguously importable from '@/core/schema'.
export {
    DuctMaterialSchema,
    type DuctMaterial,
    DuctShapeSchema,
    type DuctShape,
    SystemTypeSchema,
    type SystemType,
} from './duct.schema';
