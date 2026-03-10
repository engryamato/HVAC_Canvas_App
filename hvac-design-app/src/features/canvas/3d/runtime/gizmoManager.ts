/**
 * GizmoManager — 3D Transform Gizmo Lifecycle Manager
 *
 * Owns all custom gizmo geometry in a dedicated `gizmoGroup` that lives
 * alongside the entity mesh group but is NEVER touched by rebuildSceneGraph.
 * This prevents flicker and lost drag state during entity/selection rebuilds.
 *
 * Scene structure:
 *   scene
 *     ├── sceneGroup   (entity meshes — rebuilt on entity change)
 *     ├── gizmoGroup   (managed here — never touched by rebuildSceneGraph)
 *     └── helperGroup  (grid, axes — persistent)
 *
 * Input arbitration contract:
 *   1. Caller routes pointer events to GizmoManager first.
 *   2. When a gizmo hit starts a drag, orbit controls MUST be disabled
 *      by the caller until pointer-up or cancel.
 *   3. GizmoManager never writes to the entity store directly —
 *      it emits absolute target poses via onMoveEnd / onRotateEnd callbacks.
 *
 * Gizmo identification:
 *   Every gizmo mesh carries:
 *     userData.gizmoRole  — 'move' | 'rotate'
 *     userData.gizmoAxis  — 'x' | 'y' | 'z' | 'y-ring'
 */

import * as THREE from 'three';
import type { SceneNode } from '../types';

export type GizmoRole = 'move' | 'rotate';
export type GizmoAxis = 'x' | 'y' | 'z' | 'y-ring';

export interface GizmoDragCallbacks {
    /**
     * Called when a move drag ends. Provides the absolute world target pose.
     * World X → canonical x, World Y → canonical elevation, World Z → canonical y.
     */
    onMoveEnd: (entityId: string, worldPose: { worldX: number; worldY: number; worldZ: number }) => void;
    /**
     * Called when a rotate drag ends. Provides the absolute Y-axis rotation in degrees.
     */
    onRotateEnd: (entityId: string, targetRotationDeg: number) => void;
}

interface DragState {
    entityId: string;
    axis: GizmoAxis;
    startPointerX: number;
    startPointerY: number;
    startEntityPosition: THREE.Vector3;
    startEntityRotationY: number;
    previewObject: THREE.Object3D | null;
}

/** AXIS COLORS — product visual language. */
const COLOR_X = 0xef4444; // red
const COLOR_Y = 0x22c55e; // green
const COLOR_Z = 0x3b82f6; // blue
const COLOR_RING = 0xfbbf24; // amber/yellow
const COLOR_HOVER = 0xffffff;

const ARROW_RADIUS = 2;
const ARROW_LENGTH = 30;
const CONE_RADIUS = 4;
const CONE_HEIGHT = 8;
const RING_RADIUS = 28;
const RING_TUBE = 1.5;

function buildArrow(color: number, axis: GizmoAxis): THREE.Group {
    const group = new THREE.Group();

    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(ARROW_RADIUS, ARROW_RADIUS, ARROW_LENGTH, 8),
        new THREE.MeshBasicMaterial({ color, depthTest: false })
    );
    shaft.position.y = ARROW_LENGTH / 2;

    const tip = new THREE.Mesh(
        new THREE.ConeGeometry(CONE_RADIUS, CONE_HEIGHT, 8),
        new THREE.MeshBasicMaterial({ color, depthTest: false })
    );
    tip.position.y = ARROW_LENGTH + CONE_HEIGHT / 2;

    group.add(shaft);
    group.add(tip);

    // Apply axis orientation
    if (axis === 'x') {
        group.rotation.z = -Math.PI / 2;
    } else if (axis === 'z') {
        group.rotation.x = Math.PI / 2;
    }
    // 'y' stays as-is (pointing up)

    // Tag every child mesh for raycaster identification
    group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.userData.gizmoRole = 'move';
            child.userData.gizmoAxis = axis;
            child.renderOrder = 999;
        }
    });

    return group;
}

function buildRotateRing(): THREE.Mesh {
    const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 8, 64),
        new THREE.MeshBasicMaterial({ color: COLOR_RING, depthTest: false })
    );
    mesh.rotation.x = Math.PI / 2; // lay flat (Y-axis ring)
    mesh.userData.gizmoRole = 'rotate';
    mesh.userData.gizmoAxis = 'y-ring';
    mesh.renderOrder = 999;
    return mesh;
}

export interface GizmoManager {
    /** Show/hide/reposition the gizmo based on the current selection. */
    syncToSelection: (selectedIds: string[], sceneNodes: SceneNode[]) => void;
    /** Returns true if the event hit a gizmo and started a drag. */
    handlePointerDown: (event: PointerEvent) => boolean;
    handlePointerMove: (event: PointerEvent) => void;
    handlePointerUp: (event: PointerEvent) => void;
    /** Cancel an active drag, restoring pre-drag state. */
    handleCancel: () => void;
    /** Clean up geometry and event listeners. */
    dispose: () => void;
    /** True when a drag is actively in progress. */
    isDragging: () => boolean;
}

/**
 * Creates and returns a GizmoManager instance.
 *
 * @param gizmoGroup — the dedicated THREE.Group added to the scene for giz geometry
 * @param camera — the scene camera (used for screen→world unprojection)
 * @param domElement — the renderer's DOM element (used for viewport sizing)
 * @param callbacks — onMoveEnd / onRotateEnd callbacks
 */
export function createGizmoManager(
    gizmoGroup: THREE.Group,
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    callbacks: GizmoDragCallbacks
): GizmoManager {

    // --- Build gizmo geometry ---
    const arrowX = buildArrow(COLOR_X, 'x');
    const arrowY = buildArrow(COLOR_Y, 'y');
    const arrowZ = buildArrow(COLOR_Z, 'z');
    const rotateRing = buildRotateRing();

    const gizmoRoot = new THREE.Group();
    gizmoRoot.add(arrowX, arrowY, arrowZ, rotateRing);
    gizmoGroup.add(gizmoRoot);
    gizmoRoot.visible = false;

    // All gizmo meshes for raycasting
    const gizmoMeshes: THREE.Object3D[] = [];
    gizmoRoot.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.gizmoRole) {
            gizmoMeshes.push(child);
        }
    });

    const raycaster = new THREE.Raycaster();
    let currentEntityId: string | null = null;
    let dragState: DragState | null = null;

    const originalMaterials = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

    function _getNDC(event: PointerEvent): THREE.Vector2 {
        const rect = domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
    }

    function _hitTest(event: PointerEvent): { mesh: THREE.Mesh; role: GizmoRole; axis: GizmoAxis } | null {
        if (!gizmoRoot.visible) return null;

        raycaster.setFromCamera(_getNDC(event), camera);
        const hits = raycaster.intersectObjects(gizmoMeshes, true);
        const firstHit = hits[0];
        if (!firstHit) return null;

        const mesh = firstHit.object as THREE.Mesh;
        return {
            mesh,
            role: mesh.userData.gizmoRole as GizmoRole,
            axis: mesh.userData.gizmoAxis as GizmoAxis,
        };
    }

    function _setHoverColor(mesh: THREE.Mesh | null, _axis: GizmoAxis | null) {
        // Reset all to original
        gizmoMeshes.forEach((obj) => {
            const m = obj as THREE.Mesh;
            const orig = originalMaterials.get(m);
            if (orig) {
                m.material = orig;
            }
        });

        if (!mesh) return;

        const hoverMat = new THREE.MeshBasicMaterial({ color: COLOR_HOVER, depthTest: false });
        mesh.material = hoverMat;
    }

    function syncToSelection(selectedIds: string[], sceneNodes: SceneNode[]) {
        if (selectedIds.length !== 1) {
            gizmoRoot.visible = false;
            currentEntityId = null;
            return;
        }

        const id = selectedIds[0];
        if (!id) {
            gizmoRoot.visible = false;
            currentEntityId = null;
            return;
        }
        const node = sceneNodes.find((n) => n.entityId === id);
        if (!node) {
            gizmoRoot.visible = false;
            currentEntityId = null;
            return;
        }

        currentEntityId = id;
        gizmoRoot.position.set(
            node.transform.position.x,
            node.transform.position.y,
            node.transform.position.z
        );
        gizmoRoot.visible = true;
    }

    function handlePointerDown(event: PointerEvent): boolean {
        const hit = _hitTest(event);
        if (!hit || !currentEntityId) return false;

        const pos = gizmoRoot.position.clone();

        dragState = {
            entityId: currentEntityId,
            axis: hit.axis,
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startEntityPosition: pos,
            startEntityRotationY: gizmoRoot.rotation.y * (180 / Math.PI),
            previewObject: null,
        };

        _setHoverColor(hit.mesh, hit.axis);
        return true;
    }

    function handlePointerMove(event: PointerEvent) {
        if (!dragState) {
            // Hover highlight
            const hit = _hitTest(event);
            _setHoverColor(hit?.mesh ?? null, hit?.axis ?? null);
            return;
        }

        // Compute screen delta → approximate world movement
        const rect = domElement.getBoundingClientRect();
        const dx = (event.clientX - dragState.startPointerX) / rect.width;
        const dy = (event.clientY - dragState.startPointerY) / rect.height;

        // World units scale: rough approximation based on camera distance
        const dist = camera.position.distanceTo(gizmoRoot.position);
        const scale = dist * Math.tan((camera.fov * Math.PI) / 360) * 2;

        const { axis, startEntityPosition, startEntityRotationY } = dragState;

        if (axis === 'x') {
            gizmoRoot.position.x = startEntityPosition.x + dx * scale;
        } else if (axis === 'z') {
            gizmoRoot.position.z = startEntityPosition.z + dy * scale;
        } else if (axis === 'y') {
            // Vertical: up = decrease dy
            gizmoRoot.position.y = startEntityPosition.y - dy * scale;
        } else if (axis === 'y-ring') {
            // Rotation preview: map pointer X delta → degrees
            const deltaDeg = dx * 360;
            gizmoRoot.rotation.y = ((startEntityRotationY + deltaDeg) * Math.PI) / 180;
        }
    }

    function handlePointerUp(_event: PointerEvent) {
        if (!dragState) return;

        const { entityId, axis, startEntityRotationY, startPointerX } = dragState;

        if (axis === 'y-ring') {
            // Rotation commit
            const dx = (_event.clientX - startPointerX) / domElement.getBoundingClientRect().width;
            const targetDeg = startEntityRotationY + dx * 360;
            callbacks.onRotateEnd(entityId, targetDeg);
        } else {
            // Move commit — emit current gizmo world position
            callbacks.onMoveEnd(entityId, {
                worldX: gizmoRoot.position.x,
                worldY: gizmoRoot.position.y,
                worldZ: gizmoRoot.position.z,
            });
        }

        dragState = null;
        _setHoverColor(null, null);
    }

    function handleCancel() {
        if (!dragState) return;

        // Restore pre-drag position/rotation
        gizmoRoot.position.copy(dragState.startEntityPosition);
        gizmoRoot.rotation.y = (dragState.startEntityRotationY * Math.PI) / 180;

        dragState = null;
        _setHoverColor(null, null);
    }

    function isDragging(): boolean {
        return dragState !== null;
    }

    function dispose() {
        gizmoGroup.remove(gizmoRoot);
        gizmoRoot.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    // Store original materials for hover reset
    gizmoMeshes.forEach((obj) => {
        const m = obj as THREE.Mesh;
        originalMaterials.set(m, m.material);
    });

    return {
        syncToSelection,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleCancel,
        dispose,
        isDragging,
    };
}
