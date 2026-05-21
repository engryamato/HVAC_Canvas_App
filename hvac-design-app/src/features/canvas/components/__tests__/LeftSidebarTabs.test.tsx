import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeftSidebar } from '../LeftSidebar';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/core/store/project.store';

describe('Canvas LeftSidebar Tabs', () => {
  beforeEach(() => {
    useLayoutStore.setState({ leftSidebarCollapsed: false, activeLeftTab: 'catalog' });
    useProjectStore.setState({
      currentProjectId: '11111111-1111-4111-8111-111111111111',
      projectDetails: {
        projectId: '11111111-1111-4111-8111-111111111111',
        projectName: 'Test Project',
        isArchived: false,
        projectNumber: 'P-001',
        clientName: 'Client',
        location: 'Location',
        scope: {
          details: [],
          materials: [],
          projectType: 'commercial',
        },
        siteConditions: {
          elevation: '',
          outdoorTemp: '',
          indoorTemp: '',
          windSpeed: '',
          humidity: '',
          localCodes: '',
        },
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      isDirty: false,
      projectSettings: null,
    });
  });

  it('shows Library by default', () => {
    render(<LeftSidebar />);

    expect(screen.getByTestId('tab-catalog')).toHaveTextContent('Library');
    expect(screen.getByTestId('tab-manage')).toHaveTextContent('Manage');
    expect(screen.getByTestId('toolbar')).toBeDefined();
    expect(screen.getAllByTestId('catalog-panel').length).toBeGreaterThan(0);
  });

  it('switches to Manage tab', () => {
    render(<LeftSidebar />);

    fireEvent.click(screen.getByTestId('tab-manage'));
    expect(screen.getByTestId('manage-panel')).toBeDefined();
  });
});
