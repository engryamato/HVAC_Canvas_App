# Plan: Hydrate All Calculations in HVAC Canvas App

**Status:** Planning Complete  
**Created:** 2026-02-08  
**Scope:** Full calculation hydration system for Room and Duct entities

---

## Executive Summary

This plan addresses the need for a comprehensive calculation hydration system in the HVAC Canvas App. Currently, calculations (area, volume, CFM for rooms; area, velocity, friction loss for ducts) are computed reactively via the `useCalculations` hook, but there's no explicit hydration mechanism to ensure all calculations are consistent when loading a project.

### Current State
- Calculations exist in `src/features/canvas/calculators/` (ventilation.ts, ductSizing.ts, pressureDrop.ts)
- `useCalculations` hook runs calculations with 300ms debounce when entities change
- Calculated values ARE stored in entity state (`entity.calculated`)
- Project file schema has `calculations: z.unknown().optional()` placeholder
- Entity store has a `hydrate()` method but doesn't trigger recalculations

### The Problem
1. When a project loads, calculated values from storage may be stale or inconsistent
2. No mechanism exists to batch-recalculate all entities on project load
3. Calculation version/metadata isn't tracked
4. Project-level calculations (system totals, aggregated metrics) aren't persisted

### The Solution
Implement a multi-layer hydration system that:
1. Recalculates all entity values on project load
2. Persists and hydrates project-level calculations
3. Tracks calculation metadata (timestamp, version)
4. Provides manual recalculation capability
5. Maintains backward compatibility

---

## 1. Architecture Overview

### 1.1 Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Project Load                                                     │
│       │                                                           │
│       ▼                                                           │
│  CanvasPageWrapper.hydrateFromPayload()                          │
│       │                                                           │
│       ▼                                                           │
│  entityStore.hydrate(entities)                                   │
│       │                                                           │
│       ▼                                                           │
│  Entities stored AS-IS (calculated values from file)             │
│       │                                                           │
│       ▼                                                           │
│  useCalculations hook detects changes via useEffect              │
│       │                                                           │
│       ▼                                                           │
│  Individual entities recalculated (300ms debounce)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPOSED FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Project Load                                                     │
│       │                                                           │
│       ▼                                                           │
│  CanvasPageWrapper.hydrateFromPayload()                          │
│       │                                                           │
│       ├──► entityStore.hydrate(entities)                         │
│       │                                                           │
│       └──► calculationStore.hydrate(calculations)                │
│                   │                                               │
│                   ▼                                               │
│       ┌───────────────────────────────────────┐                  │
│       │   RecalculationService.recalculateAll() │                 │
│       │           │                              │                │
│       │           ▼                              │                │
│       │   For each entity:                       │                │
│       │   - Room: calculateRoomValues()          │                │
│       │   - Duct: calculateDuct()                │                │
│       │   - Update entity.calculated             │                │
│       │   - Update entity.calculatedAt           │                │
│       │           │                              │                │
│       │           ▼                              │                │
│       │   Calculate project-level totals:        │                │
│       │   - totalSystemCFM                       │                │
│       │   - totalPressureDrop                    │                │
│       │   - aggregatedRoomCFM                    │                │
│       └───────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Implementation Plan

### Phase 1: Schema Updates (Foundation)

#### 2.1.1 Update Entity Schemas with Calculation Metadata

**File:** `src/core/schema/room.schema.ts`

```typescript
// Add to Room schema
export const RoomCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Floor area in sq ft'),
  volume: z.number().nonnegative().describe('Room volume in cu ft'),
  requiredCFM: z.number().nonnegative().describe('Required airflow in CFM'),
  // NEW: Calculation metadata
  _calculatedAt: z.string().datetime().optional().describe('ISO timestamp of last calculation'),
  _calculationVersion: z.string().optional().describe('Calculation schema version'),
});

// Add to RoomSchema
export const RoomSchema = BaseEntitySchema.extend({
  type: z.literal('room'),
  props: RoomPropsSchema,
  calculated: RoomCalculatedSchema,
});
```

**File:** `src/core/schema/duct.schema.ts`

```typescript
// Add to DuctCalculatedSchema
export const DuctCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Cross-sectional area in sq in'),
  velocity: z.number().nonnegative().describe('Air velocity in FPM'),
  frictionLoss: z.number().nonnegative().describe('Friction loss in in.w.g./100ft'),
  // NEW: Calculation metadata
  _calculatedAt: z.string().datetime().optional(),
  _calculationVersion: z.string().optional(),
});
```

#### 2.1.2 Create Calculation Schema

**File:** `src/core/schema/calculation.schema.ts` (NEW)

```typescript
import { z } from 'zod';

/**
 * Project-level calculation aggregations
 */
export const ProjectCalculationsSchema = z.object({
  // System totals
  totalSystemCFM: z.number().nonnegative().default(0),
  totalSupplyCFM: z.number().nonnegative().default(0),
  totalReturnCFM: z.number().nonnegative().default(0),
  totalExhaustCFM: z.number().nonnegative().default(0),
  
  // Pressure totals
  totalFrictionLoss: z.number().nonnegative().default(0),
  maxVelocity: z.number().nonnegative().default(0),
  averageVelocity: z.number().nonnegative().default(0),
  
  // Room aggregations
  totalRoomArea: z.number().nonnegative().default(0),
  totalRoomVolume: z.number().nonnegative().default(0),
  totalRequiredCFM: z.number().nonnegative().default(0),
  roomCount: z.number().nonnegative().default(0),
  
  // Duct aggregations
  totalDuctLength: z.number().nonnegative().default(0),
  ductCount: z.number().nonnegative().default(0),
  
  // Calculation metadata
  lastCalculatedAt: z.string().datetime().optional(),
  calculationVersion: z.string().default('1.0.0'),
  calculationProfile: z.enum(['residential', 'commercial', 'industrial', 'kitchen_exhaust']).default('commercial'),
});

export type ProjectCalculations = z.infer<typeof ProjectCalculationsSchema>;

/**
 * Calculation state for persistence
 */
export const CalculationStateSchema = z.object({
  projectCalculations: ProjectCalculationsSchema,
  entityCalculations: z.record(z.string().uuid(), z.object({
    calculatedAt: z.string().datetime(),
    isStale: z.boolean().default(false),
  })).default({}),
});

export type CalculationState = z.infer<typeof CalculationStateSchema>;
```

#### 2.1.3 Update Project File Schema

**File:** `src/core/schema/project-file.schema.ts`

```typescript
export const ProjectFileSchema = z.object({
  // ... existing fields ...
  
  // Replace placeholder with proper schema
  calculations: CalculationStateSchema.optional(),
  
  // Keep billOfMaterials as placeholder for future
  billOfMaterials: z.unknown().optional(),
});
```

---

### Phase 2: Calculation Service Layer

#### 2.2.1 Create Calculation Service

**File:** `src/core/services/calculationService.ts` (NEW)

```typescript
import { useEntityStore, selectAllEntities } from '@/core/store/entityStore';
import type { Entity, Room, Duct } from '@/core/schema';
import { calculateRoomValues } from '@/features/canvas/calculators/ventilation';
import { 
  calculateDuctArea, 
  calculateVelocity, 
  calculateEquivalentDiameter 
} from '@/features/canvas/calculators/ductSizing';
import { calculateFrictionLoss } from '@/features/canvas/calculators/pressureDrop';
import type { ProjectCalculations } from '@/core/schema/calculation.schema';

const MATERIAL_ROUGHNESS: Record<Duct['props']['material'], number> = {
  galvanized: 0.0005,
  stainless: 0.0002,
  aluminum: 0.0002,
  flex: 0.003,
};

export interface RecalculateOptions {
  profile?: 'residential' | 'commercial' | 'industrial' | 'kitchen_exhaust';
  force?: boolean; // Force recalculation even if not stale
}

export interface RecalculationResult {
  updatedCount: number;
  projectCalculations: ProjectCalculations;
  errors: Array<{ entityId: string; error: string }>;
}

/**
 * Recalculate all entity values and return project-level aggregations
 */
export function recalculateAll(options: RecalculateOptions = {}): RecalculationResult {
  const entities = selectAllEntities();
  const updateEntity = useEntityStore.getState().updateEntity;
  
  const result: RecalculationResult = {
    updatedCount: 0,
    projectCalculations: createEmptyProjectCalculations(),
    errors: [],
  };
  
  const now = new Date().toISOString();
  const calcVersion = '1.0.0';
  
  for (const entity of entities) {
    try {
      if (entity.type === 'room') {
        const room = entity as Room;
        const newCalc = calculateRoomValues(room);
        
        // Only update if changed or force option
        if (options.force || roomChanged(room.calculated, newCalc)) {
          updateEntity(room.id, {
            calculated: {
              ...newCalc,
              _calculatedAt: now,
              _calculationVersion: calcVersion,
            },
            modifiedAt: now,
          });
          result.updatedCount++;
        }
        
        // Aggregate room values
        result.projectCalculations.totalRoomArea += newCalc.area;
        result.projectCalculations.totalRoomVolume += newCalc.volume;
        result.projectCalculations.totalRequiredCFM += newCalc.requiredCFM;
        result.projectCalculations.roomCount++;
      }
      
      if (entity.type === 'duct') {
        const duct = entity as Duct;
        const newCalc = calculateDuctValues(duct);
        const warnings = buildVelocityWarnings(newCalc.velocity, options.profile);
        
        if (options.force || ductChanged(duct.calculated, newCalc)) {
          updateEntity(duct.id, {
            calculated: {
              ...newCalc,
              _calculatedAt: now,
              _calculationVersion: calcVersion,
            },
            warnings,
            modifiedAt: now,
          });
          result.updatedCount++;
        }
        
        // Aggregate duct values
        result.projectCalculations.totalDuctLength += duct.props.length;
        result.projectCalculations.totalFrictionLoss += newCalc.frictionLoss;
        result.projectCalculations.maxVelocity = Math.max(
          result.projectCalculations.maxVelocity,
          newCalc.velocity
        );
        result.projectCalculations.ductCount++;
      }
    } catch (error) {
      result.errors.push({
        entityId: entity.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Finalize aggregations
  if (result.projectCalculations.ductCount > 0) {
    // Calculate average velocity
    // This would require summing all velocities - add to aggregations if needed
  }
  
  result.projectCalculations.lastCalculatedAt = now;
  result.projectCalculations.calculationVersion = calcVersion;
  result.projectCalculations.calculationProfile = options.profile || 'commercial';
  
  return result;
}

/**
 * Recalculate a single entity by ID
 */
export function recalculateEntity(entityId: string, profile?: string): boolean {
  const entity = useEntityStore.getState().byId[entityId];
  if (!entity) return false;
  
  const updateEntity = useEntityStore.getState().updateEntity;
  const now = new Date().toISOString();
  
  try {
    if (entity.type === 'room') {
      const newCalc = calculateRoomValues(entity as Room);
      updateEntity(entityId, {
        calculated: {
          ...newCalc,
          _calculatedAt: now,
          _calculationVersion: '1.0.0',
        },
        modifiedAt: now,
      });
      return true;
    }
    
    if (entity.type === 'duct') {
      const newCalc = calculateDuctValues(entity as Duct);
      const warnings = buildVelocityWarnings(newCalc.velocity, profile as any);
      updateEntity(entityId, {
        calculated: {
          ...newCalc,
          _calculatedAt: now,
          _calculationVersion: '1.0.0',
        },
        warnings,
        modifiedAt: now,
      });
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

// Helper functions
function calculateDuctValues(duct: Duct): Duct['calculated'] {
  const area = calculateDuctArea(duct.props.shape, {
    diameter: duct.props.shape === 'round' ? duct.props.diameter : undefined,
    width: duct.props.shape === 'rectangular' ? duct.props.width : undefined,
    height: duct.props.shape === 'rectangular' ? duct.props.height : undefined,
  });
  
  const velocity = calculateVelocity(duct.props.airflow, area);
  
  const equivalentDiameter = duct.props.shape === 'round'
    ? (duct.props.diameter ?? 0)
    : calculateEquivalentDiameter(duct.props.width ?? 0, duct.props.height ?? 0);
  
  const frictionLoss = calculateFrictionLoss(
    velocity,
    equivalentDiameter || 1,
    duct.props.length,
    MATERIAL_ROUGHNESS[duct.props.material]
  );
  
  return { area, velocity, frictionLoss };
}

function roomChanged(a: Room['calculated'], b: ReturnType<typeof calculateRoomValues>): boolean {
  return a.area !== b.area || a.volume !== b.volume || a.requiredCFM !== b.requiredCFM;
}

function ductChanged(a: Duct['calculated'], b: ReturnType<typeof calculateDuctValues>): boolean {
  return a.area !== b.area || a.velocity !== b.velocity || a.frictionLoss !== b.frictionLoss;
}

function createEmptyProjectCalculations(): ProjectCalculations {
  return {
    totalSystemCFM: 0,
    totalSupplyCFM: 0,
    totalReturnCFM: 0,
    totalExhaustCFM: 0,
    totalFrictionLoss: 0,
    maxVelocity: 0,
    averageVelocity: 0,
    totalRoomArea: 0,
    totalRoomVolume: 0,
    totalRequiredCFM: 0,
    roomCount: 0,
    totalDuctLength: 0,
    ductCount: 0,
    calculationVersion: '1.0.0',
    calculationProfile: 'commercial',
  };
}

function buildVelocityWarnings(
  velocity: number,
  profile: 'residential' | 'commercial' | 'industrial' | 'kitchen_exhaust' = 'commercial'
): Duct['warnings'] {
  const VELOCITY_LIMITS = {
    residential: { min: 600, max: 900 },
    commercial: { min: 1000, max: 1500 },
    industrial: { min: 1500, max: 2500 },
    kitchen_exhaust: { min: 1500, max: 4000 },
  };
  
  const range = VELOCITY_LIMITS[profile];
  if (!range || velocity === 0) return undefined;
  
  if (velocity < range.min) {
    return {
      velocity: `Velocity ${velocity.toFixed(0)} FPM is below ${profile} range (${range.min}-${range.max}).`,
    };
  }
  
  if (velocity > range.max) {
    return {
      velocity: `Velocity ${velocity.toFixed(0)} FPM exceeds ${profile} range (${range.min}-${range.max}).`,
    };
  }
  
  return undefined;
}
```

---

### Phase 3: Calculation Store

#### 2.3.1 Create Calculation Store

**File:** `src/core/store/calculationStore.ts` (NEW)

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CalculationState, ProjectCalculations } from '@/core/schema/calculation.schema';
import { recalculateAll, type RecalculateOptions } from '@/core/services/calculationService';

interface CalculationStoreState {
  projectCalculations: ProjectCalculations;
  isCalculating: boolean;
  lastCalculationError: string | null;
}

interface CalculationStoreActions {
  // Hydration
  hydrate: (state: CalculationState) => void;
  
  // Recalculation
  recalculateAll: (options?: RecalculateOptions) => Promise<void>;
  markStale: (entityId: string) => void;
  clearErrors: () => void;
  
  // Reset
  reset: () => void;
}

type CalculationStore = CalculationStoreState & CalculationStoreActions;

const initialState: CalculationStoreState = {
  projectCalculations: {
    totalSystemCFM: 0,
    totalSupplyCFM: 0,
    totalReturnCFM: 0,
    totalExhaustCFM: 0,
    totalFrictionLoss: 0,
    maxVelocity: 0,
    averageVelocity: 0,
    totalRoomArea: 0,
    totalRoomVolume: 0,
    totalRequiredCFM: 0,
    roomCount: 0,
    totalDuctLength: 0,
    ductCount: 0,
    calculationVersion: '1.0.0',
    calculationProfile: 'commercial',
  },
  isCalculating: false,
  lastCalculationError: null,
};

export const useCalculationStore = create<CalculationStore>()(
  immer((set, get) => ({
    ...initialState,

    hydrate: (newState) =>
      set((state) => {
        console.log('[CalculationStore] Hydrating calculation state');
        state.projectCalculations = newState.projectCalculations;
        // Don't hydrate entityCalculations - will be recalculated
      }),

    recalculateAll: async (options = {}) => {
      set((state) => {
        state.isCalculating = true;
        state.lastCalculationError = null;
      });

      try {
        // Use setTimeout to allow UI to update (show loading state)
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const result = recalculateAll(options);
        
        set((state) => {
          state.projectCalculations = result.projectCalculations;
          state.isCalculating = false;
          
          if (result.errors.length > 0) {
            state.lastCalculationError = `Failed to calculate ${result.errors.length} entities`;
          }
        });
        
        console.log(`[CalculationStore] Recalculated ${result.updatedCount} entities`);
      } catch (error) {
        set((state) => {
          state.isCalculating = false;
          state.lastCalculationError = error instanceof Error ? error.message : 'Calculation failed';
        });
      }
    },

    markStale: (entityId) => {
      // Mark entity as needing recalculation
      // This could be used for selective recalculation in the future
      console.log('[CalculationStore] Marked entity as stale:', entityId);
    },

    clearErrors: () =>
      set((state) => {
        state.lastCalculationError = null;
      }),

    reset: () => set(initialState),
  }))
);

// Selectors
export const useProjectCalculations = () => 
  useCalculationStore((state) => state.projectCalculations);

export const useIsCalculating = () => 
  useCalculationStore((state) => state.isCalculating);

export const useCalculationError = () => 
  useCalculationStore((state) => state.lastCalculationError);

export const useCalculationActions = () =>
  useCalculationStore((state) => ({
    recalculateAll: state.recalculateAll,
    markStale: state.markStale,
    clearErrors: state.clearErrors,
    reset: state.reset,
  }));
```

---

### Phase 4: Integration with Project Loading

#### 2.4.1 Update CanvasPageWrapper

**File:** `src/features/canvas/CanvasPageWrapper.tsx`

```typescript
// Add imports
import { useCalculationStore } from '@/core/store/calculationStore';
import type { CalculationState } from '@/core/schema/calculation.schema';

// Update hydrateFromPayload function
const hydrateFromPayload = (payload: LocalStoragePayload) => {
  try {
    // ... existing hydration code ...

    // NEW: Hydrate calculation store and trigger recalculation
    if (payload?.project?.calculations) {
      useCalculationStore.getState().hydrate(payload.project.calculations as CalculationState);
    }
    
    // Always recalculate all entities after hydration to ensure consistency
    // This runs asynchronously after the initial render
    setTimeout(() => {
      void useCalculationStore.getState().recalculateAll({
        profile: payload?.project?.calculations?.projectCalculations?.calculationProfile,
      });
    }, 100);
    
    // ... rest of hydration ...
  } catch (error) {
    logger.error('[CanvasPageWrapper] Failed to hydrate from localStorage payload', error);
  }
};

// Update Tauri file loading section
if (result.project.entities) {
  useEntityStore.getState().hydrate(result.project.entities);
}

// NEW: Hydrate calculations and trigger recalculation
if (result.project.calculations) {
  useCalculationStore.getState().hydrate(result.project.calculations);
}

// Trigger recalculation after a short delay to allow UI to render
setTimeout(() => {
  void useCalculationStore.getState().recalculateAll({
    profile: result.project?.calculations?.projectCalculations?.calculationProfile,
  });
}, 100);
```

#### 2.4.2 Update AutoSave to Include Calculations

**File:** `src/features/canvas/hooks/useAutoSave.ts`

```typescript
// In buildProjectFileFromStores function
import { useCalculationStore } from '@/core/store/calculationStore';

export function buildProjectFileFromStores(): ProjectFile | null {
  // ... existing code ...

  const calculationStore = useCalculationStore.getState();

  return {
    // ... existing fields ...
    
    // NEW: Include calculation state
    calculations: {
      projectCalculations: calculationStore.projectCalculations,
      entityCalculations: {}, // Populated during recalculation if needed
    },
    
    // ... rest of fields ...
  };
}
```

---

### Phase 5: UI Components

#### 2.5.1 Create Calculation Status Component

**File:** `src/features/canvas/components/CalculationStatus.tsx` (NEW)

```typescript
'use client';

import React from 'react';
import { Box, Chip, Tooltip, CircularProgress } from '@mui/material';
import { useCalculationStore, useIsCalculating, useCalculationError } from '@/core/store/calculationStore';
import CalculateIcon from '@mui/icons-material/Calculate';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export function CalculationStatus() {
  const isCalculating = useIsCalculating();
  const error = useCalculationError();
  const calculations = useCalculationStore((state) => state.projectCalculations);
  
  if (isCalculating) {
    return (
      <Tooltip title="Recalculating all values...">
        <Chip
          icon={<CircularProgress size={16} />}
          label="Calculating..."
          size="small"
          color="primary"
          variant="outlined"
        />
      </Tooltip>
    );
  }
  
  if (error) {
    return (
      <Tooltip title={error}>
        <Chip
          icon={<ErrorIcon fontSize="small" />}
          label="Calc Error"
          size="small"
          color="error"
          variant="outlined"
        />
      </Tooltip>
    );
  }
  
  const lastCalc = calculations.lastCalculatedAt 
    ? new Date(calculations.lastCalculatedAt).toLocaleTimeString()
    : 'Never';
  
  return (
    <Tooltip title={`Last calculated: ${lastCalc}`}>
      <Chip
        icon={<CheckCircleIcon fontSize="small" />}
        label={`${calculations.roomCount} rooms, ${calculations.ductCount} ducts`}
        size="small"
        color="success"
        variant="outlined"
      />
    </Tooltip>
  );
}
```

#### 2.5.2 Create Recalculate Button

**File:** `src/features/canvas/components/RecalculateButton.tsx` (NEW)

```typescript
'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useCalculationActions, useIsCalculating } from '@/core/store/calculationStore';

export function RecalculateButton() {
  const { recalculateAll } = useCalculationActions();
  const isCalculating = useIsCalculating();
  
  const handleClick = () => {
    void recalculateAll({ force: true });
  };
  
  return (
    <Tooltip title="Recalculate All">
      <span>
        <IconButton 
          onClick={handleClick} 
          disabled={isCalculating}
          size="small"
        >
          <CalculateIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
```

---

### Phase 6: Update Schema Index Exports

**File:** `src/core/schema/index.ts`

```typescript
// Add exports
export * from './calculation.schema';
```

**File:** `src/core/store/index.ts`

```typescript
// Add exports
export * from './calculationStore';
```

**File:** `src/core/services/index.ts` (NEW or update existing)

```typescript
export * from './calculationService';
```

---

## 3. Migration Strategy

### Backward Compatibility

1. **Schema Version Check**: The project file schema already has a `schemaVersion` field
2. **Graceful Degradation**: If `calculations` field is missing, initialize with defaults
3. **Migration Path**: Add migration logic in `serialization.ts` if needed in future

### Migration Code

**File:** `src/core/persistence/migrationHelper.ts`

Add to existing migration logic:

```typescript
export function migrateCalculations(project: any): any {
  // If calculations don't exist, create default structure
  if (!project.calculations) {
    return {
      ...project,
      calculations: {
        projectCalculations: {
          totalSystemCFM: 0,
          totalSupplyCFM: 0,
          totalReturnCFM: 0,
          totalExhaustCFM: 0,
          totalFrictionLoss: 0,
          maxVelocity: 0,
          averageVelocity: 0,
          totalRoomArea: 0,
          totalRoomVolume: 0,
          totalRequiredCFM: 0,
          roomCount: 0,
          totalDuctLength: 0,
          ductCount: 0,
          calculationVersion: '1.0.0',
          calculationProfile: 'commercial',
        },
        entityCalculations: {},
      },
    };
  }
  
  return project;
}
```

---

## 4. Testing Strategy

### Unit Tests

**File:** `src/core/services/__tests__/calculationService.test.ts` (NEW)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recalculateAll, recalculateEntity } from '../calculationService';
import { useEntityStore } from '@/core/store/entityStore';
import type { Room, Duct } from '@/core/schema';

describe('calculationService', () => {
  beforeEach(() => {
    // Reset entity store
    useEntityStore.getState().clearAllEntities();
  });

  describe('recalculateAll', () => {
    it('should recalculate all room entities', () => {
      // Add test room
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 0, volume: 0, requiredCFM: 0 },
      };
      
      useEntityStore.getState().addEntity(room);
      
      const result = recalculateAll();
      
      expect(result.updatedCount).toBe(1);
      expect(result.projectCalculations.roomCount).toBe(1);
      expect(result.projectCalculations.totalRoomArea).toBeGreaterThan(0);
    });

    it('should recalculate all duct entities', () => {
      // Add test duct
      const duct: Duct = {
        id: 'duct-1',
        type: 'duct',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Duct',
          shape: 'round',
          diameter: 12,
          length: 10,
          material: 'galvanized',
          airflow: 500,
          staticPressure: 0.1,
        },
        calculated: { area: 0, velocity: 0, frictionLoss: 0 },
      };
      
      useEntityStore.getState().addEntity(duct);
      
      const result = recalculateAll();
      
      expect(result.updatedCount).toBe(1);
      expect(result.projectCalculations.ductCount).toBe(1);
    });

    it('should not recalculate unchanged entities without force option', () => {
      // Add room with already-calculated values
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 85 },
      };
      
      useEntityStore.getState().addEntity(room);
      
      const result = recalculateAll();
      
      expect(result.updatedCount).toBe(0);
    });

    it('should recalculate unchanged entities with force option', () => {
      // Add room with already-calculated values
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 100, volume: 800, requiredCFM: 85 },
      };
      
      useEntityStore.getState().addEntity(room);
      
      const result = recalculateAll({ force: true });
      
      expect(result.updatedCount).toBe(1);
    });
  });

  describe('recalculateEntity', () => {
    it('should recalculate a single entity', () => {
      const room: Room = {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        props: {
          name: 'Test Room',
          width: 120,
          length: 120,
          ceilingHeight: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 0, volume: 0, requiredCFM: 0 },
      };
      
      useEntityStore.getState().addEntity(room);
      
      const result = recalculateEntity('room-1');
      
      expect(result).toBe(true);
      
      const updatedRoom = useEntityStore.getState().byId['room-1'] as Room;
      expect(updatedRoom.calculated.area).toBeGreaterThan(0);
      expect(updatedRoom.calculated._calculatedAt).toBeDefined();
    });

    it('should return false for non-existent entity', () => {
      const result = recalculateEntity('non-existent');
      expect(result).toBe(false);
    });
  });
});
```

### Integration Tests

Update existing calculation workflow test:

**File:** `src/__tests__/user-journeys/calculation-workflow.test.ts`

Add new test section:

```typescript
describe('Calculation Hydration', () => {
  it('should recalculate all entities on project load', () => {
    // Test that recalculateAll is called during hydration
  });

  it('should persist calculation state with project', () => {
    // Test that calculations are saved/loaded correctly
  });

  it('should handle missing calculation state gracefully', () => {
    // Test backward compatibility
  });
});
```

---

## 5. Implementation Checklist

### Phase 1: Schema Updates
- [ ] Update `src/core/schema/room.schema.ts` with calculation metadata
- [ ] Update `src/core/schema/duct.schema.ts` with calculation metadata
- [ ] Create `src/core/schema/calculation.schema.ts`
- [ ] Update `src/core/schema/project-file.schema.ts` to use CalculationStateSchema
- [ ] Update `src/core/schema/index.ts` exports

### Phase 2: Service Layer
- [ ] Create `src/core/services/calculationService.ts`
- [ ] Export from `src/core/services/index.ts`
- [ ] Write unit tests for calculationService

### Phase 3: Store
- [ ] Create `src/core/store/calculationStore.ts`
- [ ] Update `src/core/store/index.ts` exports
- [ ] Write tests for calculationStore

### Phase 4: Integration
- [ ] Update `CanvasPageWrapper.tsx` to hydrate calculations
- [ ] Update `useAutoSave.ts` to include calculations in payload
- [ ] Add migration helper for backward compatibility

### Phase 5: UI
- [ ] Create `CalculationStatus.tsx` component
- [ ] Create `RecalculateButton.tsx` component
- [ ] Add components to canvas UI

### Phase 6: Testing & Validation
- [ ] Run existing calculation tests
- [ ] Run new unit tests
- [ ] Test project load/save with calculations
- [ ] Verify backward compatibility with old project files
- [ ] Run type-check: `pnpm type-check`
- [ ] Run unit tests: `pnpm test`

---

## 6. Future Enhancements

1. **Selective Recalculation**: Only recalculate entities that have changed since last calculation
2. **Background Calculation**: Web Worker support for large projects
3. **Calculation Caching**: Cache results for expensive calculations
4. **Calculation History**: Track calculation changes over time
5. **Export Calculations**: Export calculation report as PDF/Excel
6. **Validation Rules**: Add custom validation rules beyond velocity warnings
7. **System Balancing**: Calculate system balance (supply vs return CFM)
8. **Equipment Sizing**: Auto-suggest equipment based on calculated loads

---

## 7. Files to Modify/Created

### Modified Files
1. `src/core/schema/room.schema.ts`
2. `src/core/schema/duct.schema.ts`
3. `src/core/schema/project-file.schema.ts`
4. `src/core/schema/index.ts`
5. `src/core/store/index.ts`
6. `src/features/canvas/CanvasPageWrapper.tsx`
7. `src/features/canvas/hooks/useAutoSave.ts`
8. `src/core/persistence/migrationHelper.ts`

### New Files
1. `src/core/schema/calculation.schema.ts`
2. `src/core/services/calculationService.ts`
3. `src/core/services/__tests__/calculationService.test.ts`
4. `src/core/store/calculationStore.ts`
5. `src/core/store/__tests__/calculationStore.test.ts`
6. `src/features/canvas/components/CalculationStatus.tsx`
7. `src/features/canvas/components/RecalculateButton.tsx`

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing projects | Low | High | Backward compatible schema, migration helper |
| Performance issues on large projects | Medium | Medium | Async recalculation, debouncing, future Web Worker support |
| Calculation inconsistencies | Low | High | Comprehensive test suite, validation on save |
| Circular dependencies | Low | Medium | Careful import structure, services layer |

---

## 9. Success Criteria

1. ✅ All existing tests pass
2. ✅ New calculation service tests pass
3. ✅ Project load triggers recalculation automatically
4. ✅ Calculations are persisted and restored correctly
5. ✅ Old project files load without errors (backward compatible)
6. ✅ UI shows calculation status
7. ✅ Manual recalculate button works
8. ✅ No TypeScript errors (`pnpm type-check` passes)

---

**End of Plan**
