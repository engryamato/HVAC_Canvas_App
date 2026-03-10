import * as THREE from 'three';
import type { ThreeDViewState } from '../../store/threeDViewStore';

export function createCamera(width: number, height: number, state: ThreeDViewState) {
  const camera = new THREE.PerspectiveCamera(50, width / Math.max(height, 1), 0.1, 10000);
  camera.position.set(
    state.cameraPosition.x,
    state.cameraPosition.y,
    state.cameraPosition.z
  );
  camera.lookAt(state.cameraTarget.x, state.cameraTarget.y, state.cameraTarget.z);
  return camera;
}
