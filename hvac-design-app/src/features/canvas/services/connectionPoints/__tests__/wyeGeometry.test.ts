import { describe, expect, it } from 'vitest';
import { buildWyeGeometry } from '../wyeGeometry';

describe('buildWyeGeometry', () => {
  it('emits inlet, outlet, and branch ports on the drawn openings', () => {
    const geometry = buildWyeGeometry(12, 9.6, 6);
    const byId = Object.fromEntries(geometry.ports.map((port) => [port.id, port]));

    expect(geometry.ports.map((port) => port.id)).toEqual(['INLET', 'OUTLET', 'BRANCH']);

    // Main run centered on x = 0: inlet and outlet are symmetric on the y = 0 axis.
    expect(byId.INLET.position).toEqual({ x: -27.24, y: 0 });
    expect(byId.OUTLET.position).toEqual({ x: 27.24, y: 0 });
    expect(byId.INLET.direction).toEqual({ x: -1, y: 0 });
    expect(byId.OUTLET.direction).toEqual({ x: 1, y: 0 });

    // Branch exits up-and-to-the-right at 45°.
    expect(byId.BRANCH.position.y).toBeLessThan(0);
    expect(byId.BRANCH.direction.x).toBeCloseTo(Math.SQRT1_2, 3);
    expect(byId.BRANCH.direction.y).toBeCloseTo(-Math.SQRT1_2, 3);
  });

  it('carries each port diameter for end-line and profile sizing', () => {
    const geometry = buildWyeGeometry(12, 9.6, 6);
    const byId = Object.fromEntries(geometry.ports.map((port) => [port.id, port]));

    expect(byId.INLET.diameter).toBe(12);
    expect(byId.OUTLET.diameter).toBe(9.6);
    expect(byId.BRANCH.diameter).toBe(6);
  });

  it('scales port positions with diameter (parametric, not fixed)', () => {
    const small = buildWyeGeometry(12, 9.6, 6);
    const large = buildWyeGeometry(24, 19.2, 12);
    const smallOutlet = small.ports.find((port) => port.id === 'OUTLET')!;
    const largeOutlet = large.ports.find((port) => port.id === 'OUTLET')!;

    expect(largeOutlet.position.x).toBeCloseTo(smallOutlet.position.x * 2, 3);
  });

  it('produces a closed main-run outline and a 4-point branch cone', () => {
    const geometry = buildWyeGeometry(12, 9.6, 6);
    expect(geometry.outline).toHaveLength(8);
    expect(geometry.cone).toHaveLength(4);
  });
});
