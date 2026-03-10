/**
 * 3D Command Translation Layer
 *
 * Pure functions that translate 3D gizmo interaction events into canonical entity
 * updates via the existing entityCommands module. No new CommandType entries are
 * needed — 3D moves dispatch to existing move/update commands.
 *
 * Coordinate contract:
 *   - world X → canonical transform.x     (plan-space pixel coordinate)
 *   - world Z → canonical transform.y     (plan-space pixel coordinate)
 *   - world Y → canonical transform.elevation (vertical, inches from floor)
 *   - rotation is always absolute, normalized to [0, 360)
 */

import * as THREE from 'three';
import { useEntityStore } from '@/core/store/entityStore';
import { useThreeDViewStore } from '../../store/threeDViewStore';
import { moveEntities, updateEntity, createEntity } from '@/core/commands/entityCommands';
import { createDuct } from '../../entities/ductDefaults';

/** World-space pose delivered by the GizmoManager at drag end. */
export interface WorldPose {
    /** World X maps to canonical plan-space x. */
    worldX: number;
    /** World Y maps to canonical transform.elevation (vertical). */
    worldY: number;
    /** World Z maps to canonical plan-space y. */
    worldZ: number;
}

/**
 * Normalize a rotation value to the half-open interval [0, 360).
 */
function normalizeRotation(degrees: number): number {
    const mod = degrees % 360;
    return mod < 0 ? mod + 360 : mod;
}

/**
 * Move an entity in 3D space.
 *
 * Receives an absolute world pose from the gizmo drag end and maps it into the
 * canonical transform. Ground-plane movement maps world X/Z → plan x/y;
 * vertical movement maps world Y → transform.elevation.
 *
 * Dispatches through moveEntities() so undo/redo works automatically.
 */
export function moveEntity3D(entityId: string, targetPose: WorldPose): void {
    const entity = useEntityStore.getState().byId[entityId];
    if (!entity) {
        return;
    }

    const previousTransform = entity.transform;

    const nextTransform = {
        ...previousTransform,
        x: targetPose.worldX,
        y: targetPose.worldZ,
        elevation: targetPose.worldY,
    };

    moveEntities([
        {
            id: entityId,
            from: previousTransform,
            to: nextTransform,
        },
    ]);
}

/**
 * Rotate an entity around its vertical (Y) axis in 3D space.
 *
 * Receives an absolute target rotation in degrees and normalizes it to [0, 360)
 * before writing through updateEntity. Undo/redo works automatically.
 */
export function rotateEntity3D(entityId: string, targetRotationDeg: number): void {
    const entity = useEntityStore.getState().byId[entityId];
    if (!entity) {
        return;
    }

    const previousState = entity;

    updateEntity(entityId, {
        transform: {
            ...entity.transform,
            rotation: normalizeRotation(targetRotationDeg),
        },
    }, previousState);
}

/**
 * Resize a duct entity from 3D (inspector-driven, not in-scene handles).
 *
 * Receives updated dimension fields and merges them into the entity's props,
 * dispatching through updateEntity for undo support.
 */
export interface DuctDimensions {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
}

export function resizeDuct3D(entityId: string, dimensions: DuctDimensions): void {
    const entity = useEntityStore.getState().byId[entityId];
    if (!entity || entity.type !== 'duct') {
        return;
    }

    const previousState = entity;

    updateEntity(entityId, {
        props: {
            ...entity.props,
            ...dimensions,
        },
    } as any, previousState);
}

/**
 * Focus the 3D camera on a specific entity by computing its bounds from
 * the store and calling threeDViewStore.setCameraTarget.
 *
 * This function does NOT mutate any entity state.
 */
export function focusEntityIn3D(entityId: string): void {
    const entity = useEntityStore.getState().byId[entityId];
    if (!entity) {
        return;
    }

    // Use the entity's canonical transform as the camera target.
    // The GizmoManager will call this once a selection is made in the scene,
    // so the camera re-centers on the selection.
    useThreeDViewStore.getState().setCameraTarget({
        x: entity.transform.x,
        y: entity.transform.elevation ?? 0,
        z: entity.transform.y,
    });
}

/**
 * Create a new duct entity anchored to an existing entity in 3D space.
 *
 * Reads the anchor entity's canonical transform from the store, projects the
 * world-space direction vector onto the plan plane (X/Z) to compute an initial
 * rotation, then constructs a default round duct placed at the anchor's
 * canonical position (with elevation carried over) and persists it via
 * createEntity() so undo/redo and selection behaviour remain consistent.
 *
 * Coordinate contract (same as rest of file):
 *   direction.x → plan X axis
 *   direction.z → plan Y axis
 *   direction.y → vertical (not used for plan rotation)
 *
 * @param anchorEntityId - UUID of the entity to attach the new duct to.
 * @param direction      - World-space unit vector indicating which way the duct runs.
 */
export function createDuctFrom3DAnchor(anchorEntityId: string, direction: THREE.Vector3): void {
    const anchor = useEntityStore.getState().byId[anchorEntityId];
    if (!anchor) {
        return;
    }

    // Project the direction vector onto the plan plane (world X/Z).
    // world X → canonical transform.x,  world Z → canonical transform.y
    const planX = direction.x;
    const planZ = direction.z;
    const planMagnitude = Math.sqrt(planX * planX + planZ * planZ);

    // Safe fallback: if the direction is essentially vertical (near-zero plan
    // component), default to the positive-X heading so placement is deterministic.
    const NEAR_ZERO = 1e-6;
    const normX = planMagnitude > NEAR_ZERO ? planX / planMagnitude : 1;
    const normZ = planMagnitude > NEAR_ZERO ? planZ / planMagnitude : 0;

    // Convert normalised plan heading to canonical degrees [0, 360).
    const planAngleRad = Math.atan2(normZ, normX);
    const planAngleDeg = normalizeRotation((planAngleRad * 180) / Math.PI);

    // Build a base duct via the canonical factory — inherits correct zIndex,
    // real calculated values, and auto-incremented name.
    const baseDuct = createDuct({
        x: anchor.transform.x,
        y: anchor.transform.y,
    });

    // Offset start position by one duct length along the normalised plan
    // direction so the new segment begins at the anchor edge, not its centre.
    // Duct length is in feet; plan coordinates are in pixels (canvas units),
    // so we use raw plan-pixel length (props.length is stored as a canvas
    // scalar here — offset matches expected canvas distance).
    const offsetDistance = baseDuct.props.length;
    const offsetX = normX * offsetDistance;
    const offsetY = normZ * offsetDistance;

    // Apply anchor-specific overrides.
    const newDuct = {
        ...baseDuct,
        transform: {
            ...baseDuct.transform,
            x: anchor.transform.x + offsetX,
            y: anchor.transform.y + offsetY,
            elevation: anchor.transform.elevation ?? 0,
            rotation: planAngleDeg,
        },
        props: {
            ...baseDuct.props,
            connectedFrom: anchorEntityId,
        },
    };

    createEntity(newDuct, {
        selectionAfter: [newDuct.id],
    });
}

