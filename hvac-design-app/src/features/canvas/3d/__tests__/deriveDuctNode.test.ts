import { describe, it, expect } from 'vitest';
import { deriveDuctNode } from '../../3d/scene/deriveDuctNode';
import type { Duct } from '@/core/schema';

const baseDuct: Duct = {
    id: 'duct-1',
    type: 'duct',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
        name: 'Supply Duct',
        shape: 'rectangular',
        length: 10,
        width: 18,
        height: 12,
        material: 'galvanized',
        airflow: 1200,
        staticPressure: 0.5,
        insulationThickness: 0,
    },
    calculated: {
        area: 216,
        velocity: 800,
        frictionLoss: 0.08,
    },
};

describe('deriveDuctNode', () => {
    it('returns a box geometry for rectangular duct', () => {
        const node = deriveDuctNode(baseDuct);
        expect(node).not.toBeNull();
        expect(node?.geometryDescriptor.type).toBe('box');
        expect(node?.entityType).toBe('duct');
    });

    it('positions box at mid-offset along rotation', () => {
        const node = deriveDuctNode(baseDuct);
        // rotation=0: midOffsetX = length*12/2 = 60, midOffsetZ = 0
        expect(node?.transform.position.x).toBeCloseTo(60, 3);
        expect(node?.transform.position.z).toBeCloseTo(0, 3);
    });

    it('returns a cylinder geometry for round duct', () => {
        const roundDuct: Duct = {
            ...baseDuct,
            props: { ...baseDuct.props, shape: 'round', diameter: 12 },
        };
        const node = deriveDuctNode(roundDuct);
        expect(node?.geometryDescriptor.type).toBe('cylinder');
    });

    it('returns null for zero-length duct', () => {
        const zeroLengthDuct: Duct = {
            ...baseDuct,
            props: { ...baseDuct.props, length: 0 },
        };
        expect(deriveDuctNode(zeroLengthDuct)).toBeNull();
    });

    it('returns null for negative-length duct', () => {
        const negDuct: Duct = {
            ...baseDuct,
            props: { ...baseDuct.props, length: -1 },
        };
        expect(deriveDuctNode(negDuct)).toBeNull();
    });

    it('node has correct entityId', () => {
        const node = deriveDuctNode(baseDuct);
        expect(node?.entityId).toBe('duct-1');
    });

    it('node selectable flag is true', () => {
        const node = deriveDuctNode(baseDuct);
        expect(node?.interactionDescriptor.selectable).toBe(true);
    });
});
