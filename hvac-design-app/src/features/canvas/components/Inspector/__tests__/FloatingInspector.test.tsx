import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { FloatingInspector } from '../FloatingInspector';
import * as positionUtils from '../../../utils/validateFloatingPosition';

vi.mock('../InspectorPanel', () => ({
  InspectorPanel: () => <div data-testid="inspector-panel" />, 
}));

const setFloatingPositionMock = vi.fn();
let floatingPosition: { x: number; y: number } | null = { x: 0, y: 0 };

vi.mock('../../../store/inspectorPreferencesStore', () => ({
  useInspectorPreferencesStore: (selector: (state: any) => any) =>
    selector({
      floatingPosition,
      setFloatingPosition: setFloatingPositionMock,
    }),
}));

describe('FloatingInspector', () => {
  beforeEach(() => {
    setFloatingPositionMock.mockReset();
    floatingPosition = { x: 100, y: 200 };

    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders at the stored floating position', async () => {
    render(<FloatingInspector onDock={vi.fn()} />);

    const inspector = await screen.findByTestId('floating-inspector');
    expect(inspector.style.left).toBe('100px');
    expect(inspector.style.top).toBe('200px');
    expect(screen.getByTestId('inspector-panel')).toBeDefined();
  });

  it('persists the final position after dragging', async () => {
    floatingPosition = { x: 10, y: 20 };

    render(<FloatingInspector onDock={vi.fn()} />);
    await screen.findByTestId('floating-inspector');

    const dockButton = screen.getByRole('button', { name: 'Dock' });
    const header = dockButton.parentElement as HTMLElement;

    fireEvent.mouseDown(header, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 130, clientY: 160 });
    fireEvent.mouseUp(window);

    expect(setFloatingPositionMock).toHaveBeenCalledWith({ x: 40, y: 80 });
  });

  it('calls onDock when Dock is clicked', async () => {
    const onDock = vi.fn();
    render(<FloatingInspector onDock={onDock} />);
    await screen.findByTestId('floating-inspector');

    fireEvent.click(screen.getByRole('button', { name: 'Dock' }));
    expect(onDock).toHaveBeenCalledTimes(1);
  });

  it('revalidates position on window resize', async () => {
    const validateSpy = vi
      .spyOn(positionUtils, 'validateFloatingPosition')
      .mockReturnValue({ x: 50, y: 60 });

    floatingPosition = { x: 900, y: 700 };

    render(<FloatingInspector onDock={vi.fn()} />);
    const inspector = await screen.findByTestId('floating-inspector');

    (inspector as any).getBoundingClientRect = () =>
      ({
        width: 320,
        height: 600,
        top: 0,
        left: 0,
        right: 320,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      }) as DOMRect;

    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      expect(validateSpy).toHaveBeenCalled();
      expect(setFloatingPositionMock).toHaveBeenCalledWith({ x: 50, y: 60 });
    });

    const lastArgs = validateSpy.mock.calls[validateSpy.mock.calls.length - 1];
    expect(lastArgs?.[2]).toEqual({ width: 1000, height: 800 });
  });
});

