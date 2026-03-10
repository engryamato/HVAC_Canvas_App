import * as THREE from 'three';
import type { ThreeDViewState } from '../../store/threeDViewStore';

interface ControlCallbacks {
  onStateChange: (state: Pick<ThreeDViewState, 'cameraPosition' | 'cameraTarget' | 'orbitRadius' | 'polarAngle' | 'azimuthAngle'>) => void;
}

export function createControls(
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  initialState: ThreeDViewState,
  callbacks: ControlCallbacks
) {
  let dragging = false;
  let panning = false;
  let suspended = false; // true while a gizmo drag is active
  let lastX = 0;
  let lastY = 0;
  let orbitRadius = initialState.orbitRadius;
  let polarAngle = initialState.polarAngle;
  let azimuthAngle = initialState.azimuthAngle;
  const target = new THREE.Vector3(
    initialState.cameraTarget.x,
    initialState.cameraTarget.y,
    initialState.cameraTarget.z
  );

  const syncCamera = () => {
    const safePolar = Math.min(Math.max(polarAngle, 0.2), Math.PI - 0.2);
    camera.position.set(
      target.x + orbitRadius * Math.sin(safePolar) * Math.cos(azimuthAngle),
      target.y + orbitRadius * Math.cos(safePolar),
      target.z + orbitRadius * Math.sin(safePolar) * Math.sin(azimuthAngle)
    );
    camera.lookAt(target);
    callbacks.onStateChange({
      cameraPosition: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      cameraTarget: { x: target.x, y: target.y, z: target.z },
      orbitRadius,
      polarAngle: safePolar,
      azimuthAngle,
    });
  };

  const onMouseDown = (event: MouseEvent) => {
    if (suspended) return;
    dragging = event.button === 0;
    panning = event.button === 2 || event.shiftKey;
    lastX = event.clientX;
    lastY = event.clientY;
  };

  const onMouseMove = (event: MouseEvent) => {
    if (suspended || (!dragging && !panning)) {
      return;
    }

    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    if (panning) {
      target.x -= dx;
      target.z -= dy;
    } else {
      azimuthAngle -= dx * 0.01;
      polarAngle += dy * 0.01;
    }
    syncCamera();
  };

  const onMouseUp = () => {
    dragging = false;
    panning = false;
  };

  const onWheel = (event: WheelEvent) => {
    if (suspended) return;
    event.preventDefault();
    orbitRadius = Math.max(120, Math.min(4000, orbitRadius + event.deltaY * 0.6));
    syncCamera();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  syncCamera();

  return {
    dispose() {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    },
    syncCamera,
    /** Disable orbit while a gizmo drag is active. */
    suspend() {
      suspended = true;
      dragging = false;
      panning = false;
    },
    /** Re-enable orbit after gizmo drag completes or is cancelled. */
    resume() {
      suspended = false;
    },
  };
}
