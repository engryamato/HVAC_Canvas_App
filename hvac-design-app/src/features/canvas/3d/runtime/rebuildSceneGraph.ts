import * as THREE from 'three';
import type { SceneNode, GeometryDescriptor } from '../types';

function createGeometry(descriptor: GeometryDescriptor): THREE.BufferGeometry {
  switch (descriptor.type) {
    case 'box':
      return new THREE.BoxGeometry(descriptor.width, descriptor.height, descriptor.depth);
    case 'cylinder':
      return new THREE.CylinderGeometry(
        descriptor.radiusTop,
        descriptor.radiusBottom,
        descriptor.height,
        descriptor.radialSegments ?? 16
      );
    case 'sphere':
      return new THREE.SphereGeometry(descriptor.radius, 16, 16);
    case 'group':
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function createMaterial(node: SceneNode, isSelected: boolean) {
  return new THREE.MeshStandardMaterial({
    color: isSelected ? 0x2563eb : node.materialDescriptor.color,
    transparent: node.materialDescriptor.transparent ?? false,
    opacity: node.materialDescriptor.opacity ?? 1,
    wireframe: node.materialDescriptor.wireframe ?? false,
    emissive: isSelected ? 0x1d4ed8 : node.materialDescriptor.emissive ?? 0x000000,
    roughness: 0.45,
    metalness: 0.18,
  });
}

export function rebuildSceneGraph(
  parent: THREE.Group,
  nodes: SceneNode[],
  selectedIds: string[]
) {
  let child = parent.children[0];
  while (child) {
    parent.remove(child);
    child.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        if (Array.isArray(node.material)) {
          node.material.forEach((material) => material.dispose());
        } else {
          node.material.dispose();
        }
      }
    });
    child = parent.children[0];
  }

  for (const node of nodes) {
    const geometry = createGeometry(node.geometryDescriptor);
    const mesh = new THREE.Mesh(geometry, createMaterial(node, selectedIds.includes(node.entityId)));
    mesh.position.set(node.transform.position.x, node.transform.position.y, node.transform.position.z);
    mesh.rotation.set(node.transform.rotation.x, node.transform.rotation.y, node.transform.rotation.z);
    mesh.scale.set(node.transform.scale.x, node.transform.scale.y, node.transform.scale.z);
    mesh.userData.entityId = node.entityId;
    mesh.userData.entityType = node.entityType;
    parent.add(mesh);
  }
}
