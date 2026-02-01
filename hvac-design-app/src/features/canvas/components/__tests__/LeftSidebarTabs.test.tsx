import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeftSidebar } from '../LeftSidebar';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/core/store/project.store';

describe('Canvas LeftSidebar Tabs', () => {
  beforeEach(() => {
    useLayoutStore.setState({ leftSidebarCollapsed: false, activeLeftTab: 'project' });
    useProjectStore.setState({
      currentProjectId: '11111111-1111-4111-8111-111111111111',
      projectDetails: {
        projectId: '11111111-1111-4111-8111-111111111111',
        projectName: 'Test Project',
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

  it('shows Project Properties by default', () => {
    render(<LeftSidebar />);

    expect(screen.getAllByText('Project Details').length).toBeGreaterThan(0);
    expect(screen.getByTestId('tab-project')).toBeDefined();
    expect(screen.getByTestId('tab-equipment')).toBeDefined();
  });

  it('switches to Product Catalog tab', () => {
    render(<LeftSidebar />);

    fireEvent.click(screen.getByTestId('tab-equipment'));
    expect(screen.getByTestId('equipment-search')).toBeDefined();
  });
});
