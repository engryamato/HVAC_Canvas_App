import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DockDrawer } from '../DockDrawer';
import { useLayoutStore } from '@/stores/useLayoutStore';

vi.mock('../../ProjectAssetsPanel', () => ({
  ProjectAssetsPanel: () => <div data-testid="project-assets-panel">Project Assets</div>,
}));

vi.mock('../../ManagePanel', () => ({
  ManagePanel: () => <div data-testid="manage-panel">Manage</div>,
}));

describe('DockDrawer', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      activeDockPanel: 'library',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the drawer when a dock panel is active', () => {
    render(<DockDrawer />);

    expect(screen.getByTestId('dock-drawer')).toBeDefined();
    expect(screen.getByTestId('project-assets-panel')).toBeDefined();
  });

  it('renders manage content when the services dock is active', () => {
    useLayoutStore.setState({
      activeDockPanel: 'services',
    });

    render(<DockDrawer />);

    expect(screen.getByRole('heading', { name: 'Manage' })).toBeDefined();
    expect(screen.getByTestId('manage-panel')).toBeDefined();
    expect(screen.queryByTestId('project-assets-panel')).toBeNull();
  });

  it('resizes the drawer when the resize handle is dragged', () => {
    render(<DockDrawer />);

    const drawer = screen.getByTestId('dock-drawer');
    const handle = screen.getByRole('separator', { name: 'Resize project assets panel' });

    expect(drawer).toHaveStyle({ width: '480px' });

    fireEvent.mouseDown(handle);
    fireEvent.mouseMove(window, { clientX: 700 });
    fireEvent.mouseUp(window);

    expect(drawer).toHaveStyle({ width: '644px' });
  });

  it('resets the drawer width on handle double click', () => {
    render(<DockDrawer />);

    const drawer = screen.getByTestId('dock-drawer');
    const handle = screen.getByRole('separator', { name: 'Resize project assets panel' });

    fireEvent.mouseDown(handle);
    fireEvent.mouseMove(window, { clientX: 760 });
    fireEvent.mouseUp(window);
    expect(drawer).toHaveStyle({ width: '704px' });

    fireEvent.doubleClick(handle);

    expect(drawer).toHaveStyle({ width: '480px' });
  });
});
