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

    it('tee geometry has correct dimensions (36x18x36)', () => {
        const node = deriveFittingNode(makeFitting('tee'));
        expect(node.geometryDescriptor.type).toBe('box');
        if (node.geometryDescriptor.type !== 'box') {
            throw new Error('Expected box geometry');
        }

        expect(node.geometryDescriptor.width).toBe(36);
        expect(node.geometryDescriptor.height).toBe(18);
        expect(node.geometryDescriptor.depth).toBe(36);
    });

    it('uses box geometry for reducer fitting', () => {
        const node = deriveFittingNode(makeFitting('reducer'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('uses cylinder geometry for elbow fittings', () => {
        const node = deriveFittingNode(makeFitting('elbow_90'));
        expect(node.geometryDescriptor.type).toBe('cylinder');
    });

    it('uses cylinder geometry for elbow_45 fitting', () => {
        const node = deriveFittingNode(makeFitting('elbow_45'));
        expect(node.geometryDescriptor.type).toBe('cylinder');
    });

    it('uses cylinder geometry for elbow_mitered fitting', () => {
        const node = deriveFittingNode(makeFitting('elbow_mitered'));
        expect(node.geometryDescriptor.type).toBe('cylinder');
    });

    it('elbow_45 Y position is height/2 from default dimensions', () => {
        const node = deriveFittingNode(makeFitting('elbow_45'));
        expect(node.transform.position.y).toBeCloseTo(8);
    });

    it('uses box geometry for wye fitting', () => {
        const node = deriveFittingNode(makeFitting('wye'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('wye geometry has correct dimensions (36x18x36)', () => {
        const node = deriveFittingNode(makeFitting('wye'));
        expect(node.geometryDescriptor.type).toBe('box');
        if (node.geometryDescriptor.type !== 'box') {
            throw new Error('Expected box geometry');
        }

        expect(node.geometryDescriptor.width).toBe(36);
        expect(node.geometryDescriptor.height).toBe(18);
        expect(node.geometryDescriptor.depth).toBe(36);
    });

    it('uses box geometry for reducer_tapered fitting', () => {
        const node = deriveFittingNode(makeFitting('reducer_tapered'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('uses box geometry for reducer_eccentric fitting', () => {
        const node = deriveFittingNode(makeFitting('reducer_eccentric'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('uses box geometry for transition_square_to_round fitting', () => {
        const node = deriveFittingNode(makeFitting('transition_square_to_round'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('gracefully handles unknown fittingType with default box dimensions', () => {
        const fitting = makeFitting('invalid_type' as any);
        const node = deriveFittingNode(fitting);
        expect(node).toBeDefined();
        expect(node.geometryDescriptor.type).toBe('box');
        if (node.geometryDescriptor.type !== 'box') {
            throw new Error('Expected box geometry');
        }

        expect(node.geometryDescriptor.width).toBe(24);
        expect(node.geometryDescriptor.height).toBe(16);
        expect(node.geometryDescriptor.depth).toBe(24);
        expect(node.transform.position.y).toBe(8);
    });

    it('uses box geometry for end_boot fitting', () => {
        const node = deriveFittingNode(makeFitting('end_boot'));
        expect(node.geometryDescriptor.type).toBe('box');
    });

    it('end_boot geometry has correct dimensions (20x16x20)', () => {
        const node = deriveFittingNode(makeFitting('end_boot'));
        expect(node.geometryDescriptor.type).toBe('box');
        if (node.geometryDescriptor.type !== 'box') {
            throw new Error('Expected box geometry');
        }

        expect(node.geometryDescriptor.width).toBe(20);
        expect(node.geometryDescriptor.height).toBe(16);
        expect(node.geometryDescriptor.depth).toBe(20);
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
