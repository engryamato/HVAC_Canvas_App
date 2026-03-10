import { describe, it, expect } from 'vitest';
import { deriveRoomNode } from '../../3d/scene/deriveRoomNode';
import type { Room } from '@/core/schema';

const baseRoom: Room = {
    id: 'room-1',
    type: 'room',
    transform: { x: 100, y: 200, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
        name: 'Office',
        width: 240,
        length: 180,
        ceilingHeight: 96,
        occupancyType: 'office',
        airChangesPerHour: 4,
    },
    calculated: { area: 43200, volume: 4147200, requiredCFM: 0 },
};

describe('deriveRoomNode', () => {
    it('derives correct entityType and entityId', () => {
        const node = deriveRoomNode(baseRoom);
        expect(node.entityId).toBe('room-1');
        expect(node.entityType).toBe('room');
    });

    it('produces a box geometry', () => {
        const node = deriveRoomNode(baseRoom);
        expect(node.geometryDescriptor.type).toBe('box');
        if (node.geometryDescriptor.type === 'box') {
            expect(node.geometryDescriptor.width).toBe(240);
            expect(node.geometryDescriptor.height).toBe(96);
            expect(node.geometryDescriptor.depth).toBe(180);
        }
    });

    it('centers position at the room center (x + width/2, z + length/2)', () => {
        const node = deriveRoomNode(baseRoom);
        // x=100 + width/2=120 → 220
        expect(node.transform.position.x).toBeCloseTo(220, 3);
        // z=200 + length/2=90 → 290
        expect(node.transform.position.z).toBeCloseTo(290, 3);
        // y = ceilingHeight/2 = 48
        expect(node.transform.position.y).toBeCloseTo(48, 3);
    });

    it('uses transparent material', () => {
        const node = deriveRoomNode(baseRoom);
        expect(node.materialDescriptor.transparent).toBe(true);
        expect(node.materialDescriptor.opacity).toBeLessThan(1);
    });

    it('is selectable', () => {
        const node = deriveRoomNode(baseRoom);
        expect(node.interactionDescriptor.selectable).toBe(true);
    });
});
