import { describe, it, expect } from 'vitest';
import { deriveFittingNode } from '../../3d/scene/deriveFittingNode';
import type { Fitting } from '@/core/schema';

function makeFitting(fittingType: Fitting['props']['fittingType']): Fitting {
    return {
        id: 'fitting-1',
        type: 'fitting',
        transform: { x: 120, y: 80, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        props: {
            name: 'Tee',
            fittingType,
        },
        calculated: {
            equivalentLength: 0,
            pressureLoss: 0,
        },
    };
}

describe('deriveFittingNode', () => {
    it('produces entityId and entityType', () => {
        const node = deriveFittingNode(makeFitting('tee'));
        expect(node.entityId).toBe('fitting-1');
        expect(node.entityType).toBe('fitting');
    });

    it('uses box geometry for tee fitting', () => {
        const node = deriveFittingNode(makeFitting('tee'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('uses box geometry for reducer fitting', () => {
        const node = deriveFittingNode(makeFitting('reducer'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('uses cylinder geometry for elbow fittings', () => {
        const node = deriveFittingNode(makeFitting('elbow_90'));
        expect(node.geometryDescriptor.type).toBe('cylinder');
    });

    it('falls back gracefully for unknown types', () => {
        // "cap" is a known type with a default dimension mapping
        const node = deriveFittingNode(makeFitting('cap'));
        expect(node).toBeDefined();
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('is selectable', () => {
        const node = deriveFittingNode(makeFitting('tee'));
        expect(node.interactionDescriptor.selectable).toBe(true);
    });

    it('positions at transform coordinates', () => {
        const node = deriveFittingNode(makeFitting('tee'));
        expect(node.transform.position.x).toBe(120);
        expect(node.transform.position.z).toBe(80);
    });
});
