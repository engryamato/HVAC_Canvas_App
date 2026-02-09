import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RightSidebar } from '../RightSidebar';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/core/store/project.store';

describe('Canvas RightSidebar Tabs', () => {
  beforeEach(() => {
    useLayoutStore.setState({ rightSidebarCollapsed: false, activeRightTab: 'properties' });
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
  });

  it('shows Properties panel by default', () => {
    render(<RightSidebar />);
    expect(screen.getByTestId('properties-panel')).toBeDefined();
  });

  it('switches to BOM tab', () => {
    render(<RightSidebar />);
    fireEvent.click(screen.getByTestId('tab-bom'));
    expect(screen.getByTestId('bom-panel')).toBeDefined();
    expect(screen.getByText('Bill of Quantities')).toBeDefined();
  });
});

