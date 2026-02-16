import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { UnifiedDock } from '../index';
import { useLayoutStore } from '@/stores/useLayoutStore';

// Mock child components to verify structure without testing implementation details again
vi.mock('../DockRail', () => ({
  DockRail: () => <div data-testid="dock-rail">DockRail</div>,
}));

vi.mock('../DockDrawer', () => ({
  DockDrawer: () => {
    const activePanel = useLayoutStore((state) => state.activeDockPanel);
    if (activePanel === 'none') return null;
    return <div data-testid="dock-drawer">Drawer: {activePanel}</div>;
  }
}));

describe('UnifiedDock', () => {
  beforeEach(() => {
    useLayoutStore.setState({ activeDockPanel: 'none' });
  });

  afterEach(() => {
    cleanup();
  });

  it('should always render DockRail', () => {
    render(<UnifiedDock />);
    expect(screen.getByTestId('dock-rail')).toBeDefined();
  });

  it('should not render DockDrawer when activePanel is none', () => {
    render(<UnifiedDock />);
    expect(screen.queryByTestId('dock-drawer')).toBeNull();
  });

  it('should render DockDrawer when activePanel is library', () => {
    useLayoutStore.setState({ activeDockPanel: 'library' });
    render(<UnifiedDock />);
    expect(screen.getByTestId('dock-drawer')).toBeDefined();
    expect(screen.getByText('Drawer: library')).toBeDefined();
  });

  it('should render DockDrawer when activePanel is services', () => {
    useLayoutStore.setState({ activeDockPanel: 'services' });
    render(<UnifiedDock />);
    expect(screen.getByTestId('dock-drawer')).toBeDefined();
    expect(screen.getByText('Drawer: services')).toBeDefined();
  });
});
