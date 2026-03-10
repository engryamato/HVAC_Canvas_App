import * as THREE from 'three';

export function raycastSelection(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  objects: THREE.Object3D[]
) {
  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, true);
}
