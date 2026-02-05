import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RightSidebar from '../RightSidebar';
import { useInspectorPreferencesStore } from '../../store/inspectorPreferencesStore';

// Mock dependencies
vi.mock('@/stores/useLayoutStore', () => ({
  useLayoutStore: vi.fn((selector) => selector({
    activeRightTab: 'properties',
    setActiveRightTab: vi.fn(),
    rightSidebarCollapsed: false,
    toggleRightSidebar: vi.fn(),
  })),
}));

vi.mock('../../store/inspectorPreferencesStore', () => ({
  useInspectorPreferencesStore: vi.fn(),
}));

// Mock resize observer since we might need it implicitly (though we drive via mouse events)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('RightSidebar Resize Logic', () => {
  const setInspectorWidthMock = vi.fn();
  const resetInspectorWidthMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default store mock
    (useInspectorPreferencesStore as any).mockImplementation((selector: any) => selector({
      inspectorWidth: 320,
      setInspectorWidth: setInspectorWidthMock,
      resetInspectorWidth: resetInspectorWidthMock,
    }));

    // Mock window innerWidth for calculation
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  it('renders with default width of 320px', () => {
    render(<RightSidebar isOpen={true} />);
    const sidebar = screen.getByTestId('right-sidebar');
    expect(sidebar).toHaveStyle({ width: '320px' });
  });

  it('renders resize handle when not collapsed', () => {
    render(<RightSidebar isOpen={true} />);
    // The handle doesn't have text, but we can find it by class or title if we added one. 
    // We added title="Drag to resize, double-click to reset" in the implementation step 19.
    const handle = screen.getByTitle('Drag to resize, double-click to reset');
    expect(handle).toBeInTheDocument();
  });

  it('updates visual width on drag but only updates store on mouseup', () => {
    render(<RightSidebar isOpen={true} />);
    const handle = screen.getByTitle('Drag to resize, double-click to reset');
    const sidebar = screen.getByTestId('right-sidebar');

    fireEvent.mouseDown(handle, { clientX: 704 }); // Initial mouse position

    act(() => {
      fireEvent.mouseMove(window, { clientX: 624 }); // New mouse position
    });

    // Store should NOT be updated yet
    expect(setInspectorWidthMock).not.toHaveBeenCalled();
    
    // Visual width should be updated (calculated: window.innerWidth (1024) - 624 = 400)
    expect(sidebar).toHaveStyle({ width: '400px' });

    act(() => {
      fireEvent.mouseUp(window);
    });

    // Store SHOULD be updated now
    expect(setInspectorWidthMock).toHaveBeenCalledWith(400); 
  });

  it('enforces minimum width constraint (280px)', () => {
    render(<RightSidebar isOpen={true} />);
    const handle = screen.getByTitle('Drag to resize, double-click to reset');
    const sidebar = screen.getByTestId('right-sidebar');

    fireEvent.mouseDown(handle, { clientX: 704 });

    act(() => {
      fireEvent.mouseMove(window, { clientX: 900 }); // Dragging far right
    });

    // Store should NOT be updated yet
    expect(setInspectorWidthMock).not.toHaveBeenCalled();
    
    // Visual width should be clamped to 280
    expect(sidebar).toHaveStyle({ width: '280px' });

    act(() => {
      fireEvent.mouseUp(window);
    });

    expect(setInspectorWidthMock).toHaveBeenCalledWith(280);
  });

  it('enforces maximum width constraint (480px)', () => {
    render(<RightSidebar isOpen={true} />);
    const handle = screen.getByTitle('Drag to resize, double-click to reset');
    const sidebar = screen.getByTestId('right-sidebar');

    fireEvent.mouseDown(handle, { clientX: 704 });

    act(() => {
        fireEvent.mouseMove(window, { clientX: 400 }); // Dragging far left
    });

    // Store should NOT be updated yet
    expect(setInspectorWidthMock).not.toHaveBeenCalled();
    
    // Visual width should be clamped to 480
    expect(sidebar).toHaveStyle({ width: '480px' });

    act(() => {
        fireEvent.mouseUp(window);
    });

    expect(setInspectorWidthMock).toHaveBeenCalledWith(480);
  });

  it('resets width to 320px on double click', () => {
    render(<RightSidebar isOpen={true} />);
    const handle = screen.getByTitle('Drag to resize, double-click to reset');

    fireEvent.doubleClick(handle);

    expect(resetInspectorWidthMock).toHaveBeenCalled();
  });

  it('removes event listeners on mouse up', () => {
    render(<RightSidebar isOpen={true} />);
    const handle = screen.getByTitle('Drag to resize, double-click to reset');

    fireEvent.mouseDown(handle);
    fireEvent.mouseUp(window);

    // After mouse up, moving mouse shouldn't call setInspectorWidth
    vi.clearAllMocks();
    act(() => {
        fireEvent.mouseMove(window, { clientX: 600 });
    });

    expect(setInspectorWidthMock).not.toHaveBeenCalled();
  });
});
