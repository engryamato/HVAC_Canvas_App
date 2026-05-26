import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { RightSidebar } from '../RightSidebar';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/core/store/project.store';
import { useInspectorPreferencesStore } from '../../store/inspectorPreferencesStore';
import { useSelectionStore } from '../../store/selectionStore';

describe('Canvas RightSidebar - Floating Inspector Integration', () => {
  beforeEach(() => {
    localStorage.removeItem('sws.inspector-preferences');

    useLayoutStore.setState({ rightSidebarCollapsed: false, activeRightTab: 'properties', rightSidebarWidth: 320 });
    useProjectStore.setState({
      currentProjectId: '11111111-1111-4111-8111-111111111111',
      projectDetails: {
        projectId: '11111111-1111-4111-8111-111111111111',
        projectName: 'Test Project',
        isArchived: false,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      isDirty: false,
      projectSettings: null,
    });

    useSelectionStore.setState({ selectedIds: ['one', 'two'], hoveredId: null });

    useInspectorPreferencesStore.setState({ isFloating: false, floatingPosition: null });

    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
  });

  it('shows Float button when docked', () => {
    render(<RightSidebar />);

    const panel = screen.getByTestId('properties-panel');
    const floatButton = within(panel).getByRole('button');

    expect(floatButton).toBeDefined();
  });

  it('clicking Float button updates store and shows placeholder message', () => {
    render(<RightSidebar />);

    const panel = screen.getByTestId('properties-panel');
    const floatButton = within(panel).getByRole('button');

    fireEvent.click(floatButton);

    expect(useInspectorPreferencesStore.getState().isFloating).toBe(true);
    expect(useInspectorPreferencesStore.getState().floatingPosition).toEqual({ x: 440, y: 80 });
    expect(
      within(screen.getByTestId('properties-panel')).getByText(
        'Inspector is floating. Click Dock to return.'
      )
    ).toBeDefined();
  });

  it('shows placeholder message when floating', () => {
    useInspectorPreferencesStore.setState({ isFloating: true, floatingPosition: { x: 100, y: 100 } });
    render(<RightSidebar />);

    const panel = screen.getByTestId('properties-panel');
    expect(within(panel).getByText('Inspector is floating. Click Dock to return.')).toBeDefined();
  });

  it('resizes when dragging the left edge', () => {
    render(<RightSidebar />);

    const sidebar = screen.getByTestId('right-sidebar');
    const handle = screen.getByRole('separator', { name: 'Resize right sidebar' });

    fireEvent.mouseDown(handle, { clientX: 900 });
    fireEvent.mouseMove(window, { clientX: 820 });
    fireEvent.mouseUp(window);

    expect(useLayoutStore.getState().rightSidebarWidth).toBe(400);
    expect(sidebar).toHaveStyle({ width: '400px' });
  });
});
