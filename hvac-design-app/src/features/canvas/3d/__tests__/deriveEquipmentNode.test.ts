import { describe, it, expect } from 'vitest';
import { deriveEquipmentNode } from '../../3d/scene/deriveEquipmentNode';
import type { Equipment } from '@/core/schema';

function makeEquipment(overrides: Partial<Equipment['props']> = {}): Equipment {
    return {
        id: 'equip-1',
        type: 'equipment',
        transform: { x: 50, y: 80, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        props: {
            name: 'Air Handler',
            equipmentType: 'air_handler',
            width: 60,
            height: 48,
            depth: 36,
            model: 'AH-1',
            capacity: 2000,
            capacityUnit: 'CFM',
            staticPressure: 1.5,
            staticPressureUnit: 'in_wg',
            ...overrides,
        } as Equipment['props'],
    };
}

describe('deriveEquipmentNode', () => {
    it('produces correct entityId and entityType', () => {
        const node = deriveEquipmentNode(makeEquipment());
        expect(node.entityId).toBe('equip-1');
        expect(node.entityType).toBe('equipment');
    });

    it('produces a box bounding volume', () => {
        const node = deriveEquipmentNode(makeEquipment());
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('centers position at x+width/2, z+depth/2, y=mountHeight+height/2', () => {
        const node = deriveEquipmentNode(makeEquipment());
        // x=50+30=80, z=80+18=98, y=0+24=24
        expect(node.transform.position.x).toBeCloseTo(80, 3);
        expect(node.transform.position.z).toBeCloseTo(98, 3);
        expect(node.transform.position.y).toBeCloseTo(24, 3);
    });

    it('applies mountHeight offset to Y position', () => {
        const node = deriveEquipmentNode(makeEquipment({ mountHeight: 36 }));
        // y = 36 (mountHeight) + 48/2 (height/2) = 60
        expect(node.transform.position.y).toBeCloseTo(60, 3);
    });

    it('uses different colors per equipment type', () => {
        const fan = deriveEquipmentNode(makeEquipment({ equipmentType: 'fan' }));
        const hood = deriveEquipmentNode(makeEquipment({ equipmentType: 'hood' }));
        expect(fan.materialDescriptor.color).not.toBe(hood.materialDescriptor.color);
    });

    it('is selectable and editable', () => {
        const node = deriveEquipmentNode(makeEquipment());
        expect(node.interactionDescriptor.selectable).toBe(true);
        expect(node.interactionDescriptor.editable).toBe(true);
    });
});
