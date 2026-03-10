'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../store/selectionStore';
import { useThreeDViewStore } from '../store/threeDViewStore';
import { useViewModeStore } from '../store/viewModeStore';
import { deriveSceneNodes } from '../3d/scene/deriveSceneNodes';
import { createScene } from '../3d/runtime/createScene';
import { createRenderer } from '../3d/runtime/createRenderer';
import { createCamera } from '../3d/runtime/createCamera';
import { createControls } from '../3d/runtime/createControls';
import { rebuildSceneGraph } from '../3d/runtime/rebuildSceneGraph';
import { raycastSelection } from '../3d/runtime/raycastSelection';
import { computeSceneBounds } from '../3d/utils/sceneBounds';
import { createGizmoManager, type GizmoManager } from '../3d/runtime/gizmoManager';
import { moveEntity3D, rotateEntity3D } from '../3d/commands';
import type { Entity } from '@/core/schema';

interface ThreeViewportProps {
  className?: string;
}

export function ThreeViewport({ className = '' }: ThreeViewportProps): React.ReactElement {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const gizmoGroupRef = useRef<THREE.Group | null>(null);
  const gizmoManagerRef = useRef<GizmoManager | null>(null);
  const controlsRef = useRef<ReturnType<typeof createControls> | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const entities = useEntityStore(
    useShallow((state) =>
      state.allIds
        .map((id) => state.byId[id])
        .filter((entity): entity is Entity => entity !== undefined)
    )
  );
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const selectSingle = useSelectionStore((state) => state.selectSingle);
  const clearSelection = useSelectionStore((state) => state.clearSelection);

  const threeDView = useThreeDViewStore(
    useShallow((state) => ({
      showGrid: state.showGrid,
      showAxes: state.showAxes,
    }))
  );
  const { setCameraPosition, setCameraTarget, setOrbitState } = useThreeDViewStore();
  const { set3DInitialized, set3DGridVisible, set3DAxesVisible } = useViewModeStore();

  const nodes = useMemo(() => deriveSceneNodes(entities), [entities]);

  useEffect(() => {
    set3DGridVisible(threeDView.showGrid);
    set3DAxesVisible(threeDView.showAxes);
    if (gridRef.current) {
      gridRef.current.visible = threeDView.showGrid;
    }
    if (axesRef.current) {
      axesRef.current.visible = threeDView.showAxes;
    }
  }, [set3DAxesVisible, set3DGridVisible, threeDView.showAxes, threeDView.showGrid]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const width = mount.clientWidth || 1000;
    const height = mount.clientHeight || 700;
    const initialThreeDView = useThreeDViewStore.getState();

    try {
      const scene = createScene();
      const camera = createCamera(width, height, initialThreeDView);
      const renderer = createRenderer(width, height);

      // Three separate scene groups — gizmoGroup is NEVER touched by rebuildSceneGraph
      const sceneGroup = new THREE.Group();
      const gizmoGroup = new THREE.Group();
      const helperGroup = new THREE.Group();

      rendererRef.current = renderer;
      cameraRef.current = camera;
      sceneGroupRef.current = sceneGroup;
      gizmoGroupRef.current = gizmoGroup;

      mount.innerHTML = '';
      mount.appendChild(renderer.domElement);
      scene.add(sceneGroup);
      scene.add(gizmoGroup);
      scene.add(helperGroup);

      const grid = new THREE.GridHelper(2400, 80, 0xcbd5e1, 0xe2e8f0);
      grid.visible = initialThreeDView.showGrid;
      helperGroup.add(grid);
      gridRef.current = grid;

      const axes = new THREE.AxesHelper(180);
      axes.visible = initialThreeDView.showAxes;
      helperGroup.add(axes);
      axesRef.current = axes;

      const controls = createControls(renderer.domElement, camera, initialThreeDView, {
        onStateChange: (state) => {
          setCameraPosition(state.cameraPosition);
          setCameraTarget(state.cameraTarget);
          setOrbitState({
            orbitRadius: state.orbitRadius,
            polarAngle: state.polarAngle,
            azimuthAngle: state.azimuthAngle,
          });
        },
      });
      controlsRef.current = controls;

      // Build GizmoManager in its own group
      const gizmoManager = createGizmoManager(gizmoGroup, camera, renderer.domElement, {
        onMoveEnd: (entityId, worldPose) => {
          moveEntity3D(entityId, worldPose);
          controls.resume();
        },
        onRotateEnd: (entityId, targetRotationDeg) => {
          rotateEntity3D(entityId, targetRotationDeg);
          controls.resume();
        },
      });
      gizmoManagerRef.current = gizmoManager;

      const handleResize = () => {
        const nextWidth = mount.clientWidth || 1000;
        const nextHeight = mount.clientHeight || 700;
        renderer.setSize(nextWidth, nextHeight);
        camera.aspect = nextWidth / Math.max(nextHeight, 1);
        camera.updateProjectionMatrix();
      };

      // Pointer-down: gizmo has priority; if it starts a drag, suspend orbit
      const handlePointerDown = (event: PointerEvent) => {
        const gizmoConsumed = gizmoManager.handlePointerDown(event);
        if (gizmoConsumed) {
          controls.suspend();
        }
      };

      const handlePointerMove = (event: PointerEvent) => {
        gizmoManager.handlePointerMove(event);
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (gizmoManager.isDragging()) {
          gizmoManager.handlePointerUp(event);
          controls.resume();
        }
      };

      // Click: only run entity raycasting if gizmo is NOT dragging
      const handleClick = (event: MouseEvent) => {
        if (gizmoManager.isDragging()) return;

        const intersections = raycastSelection(event, renderer.domElement, camera, sceneGroup.children);
        const hit = intersections[0];
        const entityId = hit?.object?.userData?.entityId as string | undefined;
        if (entityId) {
          selectSingle(entityId);
        } else {
          clearSelection();
        }
      };

      // Escape cancels an active gizmo drag
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && gizmoManager.isDragging()) {
          gizmoManager.handleCancel();
          controls.resume();
        }
      };

      renderer.domElement.addEventListener('pointerdown', handlePointerDown);
      renderer.domElement.addEventListener('pointermove', handlePointerMove);
      renderer.domElement.addEventListener('pointerup', handlePointerUp);
      renderer.domElement.addEventListener('click', handleClick);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      set3DInitialized(true);
      animate();

      return () => {
        set3DInitialized(false);
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        renderer.domElement.removeEventListener('pointermove', handlePointerMove);
        renderer.domElement.removeEventListener('pointerup', handlePointerUp);
        renderer.domElement.removeEventListener('click', handleClick);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResize);
        gizmoManager.dispose();
        controls.dispose();
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
        renderer.dispose();
        mount.innerHTML = '';
      };
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : 'Unable to initialize 3D viewport');
      set3DInitialized(false);
      return;
    }
  }, [
    clearSelection,
    selectSingle,
    set3DInitialized,
    setCameraPosition,
    setCameraTarget,
    setOrbitState,
  ]);

  // Sync scene graph (entity meshes only — gizmoGroup is untouched here)
  useEffect(() => {
    const sceneGroup = sceneGroupRef.current;
    if (!sceneGroup) {
      return;
    }
    rebuildSceneGraph(sceneGroup, nodes, selectedIds);
  }, [nodes, selectedIds]);

  // Sync gizmo position whenever selection or nodes change
  useEffect(() => {
    const gizmoManager = gizmoManagerRef.current;
    if (!gizmoManager) return;
    gizmoManager.syncToSelection(selectedIds, nodes);
  }, [selectedIds, nodes]);

  // Auto-frame camera on first load
  useEffect(() => {
    const camera = cameraRef.current;
    const sceneGroup = sceneGroupRef.current;
    if (!camera || !sceneGroup || nodes.length === 0) {
      return;
    }
    const bounds = computeSceneBounds(nodes);
    camera.lookAt(bounds.centerX, Math.max(bounds.centerY / 2, 0), bounds.centerZ);
  }, [nodes]);

  if (renderError) {
    return (
      <div className={`flex h-full items-center justify-center bg-slate-50 ${className}`} data-testid="three-viewport-error">
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <div className="text-sm font-semibold text-rose-700">3D View unavailable</div>
          <p className="mt-2 max-w-sm text-sm text-slate-600">{renderError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full bg-slate-100 ${className}`} data-testid="three-viewport">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
        <div className="font-semibold text-slate-900">3D View</div>
        <div>Drag to orbit • Shift/right-drag to pan • Wheel to zoom</div>
      </div>
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm text-slate-600 shadow-sm">
            No entities to render in 3D yet.
          </div>
        </div>
      )}
    </div>
  );
}

export default ThreeViewport;
