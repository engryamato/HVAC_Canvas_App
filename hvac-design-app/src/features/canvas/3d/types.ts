import type { Entity } from '@/core/schema';

export type SceneEntityType = Extract<Entity['type'], 'duct' | 'room' | 'equipment' | 'fitting' | 'note'>;

export interface SceneTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export type GeometryDescriptor =
  | {
      type: 'box';
      width: number;
      height: number;
      depth: number;
    }
  | {
      type: 'cylinder';
      radiusTop: number;
      radiusBottom: number;
      height: number;
      radialSegments?: number;
    }
  | {
      type: 'sphere';
      radius: number;
    }
  | {
      type: 'group';
      children: GeometryDescriptor[];
    };

export interface MaterialDescriptor {
  color: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  emissive?: number;
}

export interface InteractionDescriptor {
  selectable: boolean;
  editable: boolean;
  highlightable: boolean;
}

export interface SceneBounds {
  width: number;
  height: number;
  depth: number;
}

export interface SceneNode {
  entityId: string;
  entityType: SceneEntityType;
  kind: 'mesh' | 'group';
  transform: SceneTransform;
  geometryDescriptor: GeometryDescriptor;
  materialDescriptor: MaterialDescriptor;
  interactionDescriptor: InteractionDescriptor;
  bounds: SceneBounds;
  label?: string;
}
