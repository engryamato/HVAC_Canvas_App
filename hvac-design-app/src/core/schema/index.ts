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

// Service schema
// Note: service.schema.ts re-defines DuctMaterial, DuctMaterialSchema, DuctShape,
// DuctShapeSchema, SystemType, and SystemTypeSchema which also exist in duct.schema.ts.
// The canonical definitions live in duct.schema.ts; we export service-specific types
// explicitly to avoid ambiguous re-export conflicts.
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
    DEFAULT_DIMENSIONAL_CONSTRAINTS,
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
