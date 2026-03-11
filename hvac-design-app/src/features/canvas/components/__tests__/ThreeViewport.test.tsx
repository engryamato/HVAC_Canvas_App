import { cleanup, fireEvent, render } from '@testing-library/react';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => {
  const selectSingleMock = vi.fn();
  const clearSelectionMock = vi.fn();
  const raycastSelectionMock = vi.fn();
  const rebuildSceneGraphMock = vi.fn();
  const syncToSelectionMock = vi.fn();
  const gizmoHandlePointerDownMock = vi.fn<(_: PointerEvent) => boolean>();
  const gizmoHandlePointerMoveMock = vi.fn();
  const gizmoHandlePointerUpMock = vi.fn();
  const gizmoHandleCancelMock = vi.fn();
  const gizmoIsDraggingMock = vi.fn(() => false);
  const controlsSuspendMock = vi.fn();
  const controlsResumeMock = vi.fn();
  const controlsDisposeMock = vi.fn();
  const rendererRenderMock = vi.fn();
  const rendererSetSizeMock = vi.fn();
  const rendererDisposeMock = vi.fn();
  const set3DInitializedMock = vi.fn();
  const set3DGridVisibleMock = vi.fn();
  const set3DAxesVisibleMock = vi.fn();
  const setCameraPositionMock = vi.fn();
  const setCameraTargetMock = vi.fn();
  const setOrbitStateMock = vi.fn();

  return {
    activeCapturedPointerId: null as number | null,
    rendererCanvas: null as HTMLCanvasElement | null,
    selectSingleMock,
    clearSelectionMock,
    raycastSelectionMock,
    rebuildSceneGraphMock,
    syncToSelectionMock,
    gizmoHandlePointerDownMock,
    gizmoHandlePointerMoveMock,
    gizmoHandlePointerUpMock,
    gizmoHandleCancelMock,
    gizmoIsDraggingMock,
    controlsSuspendMock,
    controlsResumeMock,
    controlsDisposeMock,
    rendererRenderMock,
    rendererSetSizeMock,
    rendererDisposeMock,
    set3DInitializedMock,
    set3DGridVisibleMock,
    set3DAxesVisibleMock,
    setCameraPositionMock,
    setCameraTargetMock,
    setOrbitStateMock,
    selectionState: {
      selectedIds: [] as string[],
      selectSingle: selectSingleMock,
      clearSelection: clearSelectionMock,
    },
    threeDViewState: {
      cameraTarget: { x: 0, y: 0, z: 0 },
      cameraPosition: { x: 10, y: 10, z: 10 },
      orbitRadius: 100,
      polarAngle: 1,
      azimuthAngle: 1,
      showGrid: true,
      showAxes: true,
      showPlanOverlay: false,
      setCameraPosition: setCameraPositionMock,
      setCameraTarget: setCameraTargetMock,
      setOrbitState: setOrbitStateMock,
    },
    viewModeState: {
      set3DInitialized: set3DInitializedMock,
      set3DGridVisible: set3DGridVisibleMock,
      set3DAxesVisible: set3DAxesVisibleMock,
    },
    entityState: {
      byId: {},
      allIds: [],
    },
  };
});

vi.mock('@/core/store/entityStore', () => ({
  useEntityStore: Object.assign(
    <T,>(selector: (state: typeof testState.entityState) => T) => selector(testState.entityState),
    { getState: () => testState.entityState }
  ),
}));

vi.mock('@/features/canvas/store/selectionStore', () => ({
  useSelectionStore: Object.assign(
    <T,>(selector: (state: typeof testState.selectionState) => T) => selector(testState.selectionState),
    { getState: () => testState.selectionState }
  ),
}));

vi.mock('@/features/canvas/store/threeDViewStore', () => ({
  useThreeDViewStore: Object.assign(
    <T,>(selector?: (state: typeof testState.threeDViewState) => T) =>
      selector ? selector(testState.threeDViewState) : testState.threeDViewState,
    { getState: () => testState.threeDViewState }
  ),
}));

vi.mock('@/features/canvas/store/viewModeStore', () => ({
  useViewModeStore: Object.assign(
    <T,>(selector?: (state: typeof testState.viewModeState) => T) =>
      selector ? selector(testState.viewModeState) : testState.viewModeState,
    { getState: () => testState.viewModeState }
  ),
}));

vi.mock('@/features/canvas/3d/scene/deriveSceneNodes', () => ({
  deriveSceneNodes: vi.fn(() => []),
}));

vi.mock('@/features/canvas/3d/runtime/createScene', () => ({
  createScene: vi.fn(() => new THREE.Scene()),
}));

vi.mock('@/features/canvas/3d/runtime/createCamera', () => ({
  createCamera: vi.fn((width: number, height: number) => new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)),
}));

vi.mock('@/features/canvas/3d/runtime/createRenderer', () => ({
  createRenderer: vi.fn(() => {
    const canvas = document.createElement('canvas');
    testState.rendererCanvas = canvas;
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) }),
    });
    Object.defineProperty(canvas, 'setPointerCapture', {
      configurable: true,
      value: vi.fn((pointerId: number) => {
        testState.activeCapturedPointerId = pointerId;
      }),
    });
    Object.defineProperty(canvas, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn((pointerId: number) => {
        if (testState.activeCapturedPointerId === pointerId) {
          testState.activeCapturedPointerId = null;
        }
      }),
    });
    Object.defineProperty(canvas, 'hasPointerCapture', {
      configurable: true,
      value: vi.fn((pointerId: number) => testState.activeCapturedPointerId === pointerId),
    });

    return {
      domElement: canvas,
      render: testState.rendererRenderMock,
      setSize: testState.rendererSetSizeMock,
      dispose: testState.rendererDisposeMock,
    };
  }),
}));

vi.mock('@/features/canvas/3d/runtime/createControls', () => ({
  createControls: vi.fn(() => ({
    suspend: testState.controlsSuspendMock,
    resume: testState.controlsResumeMock,
    dispose: testState.controlsDisposeMock,
  })),
}));

vi.mock('@/features/canvas/3d/runtime/rebuildSceneGraph', () => ({
  rebuildSceneGraph: testState.rebuildSceneGraphMock,
}));

vi.mock('@/features/canvas/3d/runtime/raycastSelection', () => ({
  raycastSelection: testState.raycastSelectionMock,
}));

vi.mock('@/features/canvas/3d/utils/sceneBounds', () => ({
  computeSceneBounds: vi.fn(() => ({ centerX: 0, centerY: 0, centerZ: 0 })),
}));

vi.mock('@/features/canvas/3d/runtime/gizmoManager', () => ({
  createGizmoManager: vi.fn(() => ({
    syncToSelection: testState.syncToSelectionMock,
    handlePointerDown: testState.gizmoHandlePointerDownMock,
    handlePointerMove: testState.gizmoHandlePointerMoveMock,
    handlePointerUp: testState.gizmoHandlePointerUpMock,
    handleCancel: testState.gizmoHandleCancelMock,
    dispose: vi.fn(),
    isDragging: testState.gizmoIsDraggingMock,
  })),
}));

vi.mock('@/features/canvas/3d/commands', () => ({
  moveEntity3D: vi.fn(),
  rotateEntity3D: vi.fn(),
}));

import { ThreeViewport } from '@/features/canvas/components/ThreeViewport';

describe('ThreeViewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.activeCapturedPointerId = null;
    testState.rendererCanvas = null;
    testState.selectionState.selectedIds = [];
    testState.raycastSelectionMock.mockReturnValue([]);
    testState.gizmoHandlePointerDownMock.mockReturnValue(false);
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('selects on a primary click with minimal movement', () => {
    testState.raycastSelectionMock.mockReturnValueOnce([
      { object: { userData: { entityId: 'entity-1' } } },
    ]);

    const { container } = render(<ThreeViewport />);
    const canvas = container.querySelector('canvas');

    expect(canvas).not.toBeNull();

    fireEvent.pointerDown(canvas!, { button: 0, clientX: 10, clientY: 12, pointerId: 1 });
    fireEvent.pointerUp(canvas!, { button: 0, clientX: 12, clientY: 13, pointerId: 1 });

    expect(testState.raycastSelectionMock).toHaveBeenCalledTimes(1);
    expect(testState.selectSingleMock).toHaveBeenCalledWith('entity-1');
    expect(testState.clearSelectionMock).not.toHaveBeenCalled();
  });

  it('skips selection for non-primary releases and movement beyond click tolerance', () => {
    const firstRender = render(<ThreeViewport />);
    const firstCanvas = firstRender.container.querySelector('canvas');

    expect(firstCanvas).not.toBeNull();

    fireEvent.pointerDown(firstCanvas!, { button: 2, clientX: 10, clientY: 10, pointerId: 2 });
    fireEvent.pointerUp(firstCanvas!, { button: 2, clientX: 10, clientY: 10, pointerId: 2 });

    expect(testState.raycastSelectionMock).not.toHaveBeenCalled();
    expect(testState.selectSingleMock).not.toHaveBeenCalled();
    expect(testState.clearSelectionMock).not.toHaveBeenCalled();

    firstRender.unmount();
    cleanup();
    vi.clearAllMocks();
    testState.activeCapturedPointerId = null;
    testState.rendererCanvas = null;
    testState.selectionState.selectedIds = [];
    testState.raycastSelectionMock.mockReturnValue([]);
    testState.gizmoHandlePointerDownMock.mockReturnValue(false);

    const secondRender = render(<ThreeViewport />);
    const secondCanvas = secondRender.container.querySelector('canvas');

    fireEvent.pointerDown(secondCanvas!, { button: 0, clientX: 10, clientY: 10, pointerId: 3 });
    fireEvent.pointerUp(secondCanvas!, { button: 0, clientX: 20, clientY: 20, pointerId: 3 });

    expect(testState.raycastSelectionMock).not.toHaveBeenCalled();
    expect(testState.selectSingleMock).not.toHaveBeenCalled();
    expect(testState.clearSelectionMock).not.toHaveBeenCalled();
  });

  it('completes gizmo drags through the unified drag-end path and resumes controls', () => {
    testState.gizmoHandlePointerDownMock.mockReturnValueOnce(true);

    const { container } = render(<ThreeViewport />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    fireEvent.pointerDown(canvas, { button: 0, clientX: 30, clientY: 30, pointerId: 7 });

    expect(testState.controlsSuspendMock).toHaveBeenCalledTimes(1);
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(7);

    fireEvent.pointerCancel(canvas, { button: 0, clientX: 50, clientY: 50, pointerId: 7 });

    expect(testState.gizmoHandlePointerUpMock).toHaveBeenCalledTimes(1);
    expect(testState.controlsResumeMock).toHaveBeenCalledTimes(1);
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(7);
    expect(testState.raycastSelectionMock).not.toHaveBeenCalled();
    expect(testState.selectSingleMock).not.toHaveBeenCalled();
    expect(testState.clearSelectionMock).not.toHaveBeenCalled();
  });
});
