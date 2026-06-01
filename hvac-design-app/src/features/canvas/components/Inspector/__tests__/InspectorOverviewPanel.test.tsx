import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { InspectorOverviewPanel } from '../InspectorOverviewPanel';
import type { InspectorPanelProps } from '../inspectorOverviewTypes';
import { usePreferencesStore } from '@/core/store/preferencesStore';

function createProps(overrides: Partial<InspectorPanelProps> = {}): InspectorPanelProps {
  return {
    project: {
      name: 'Hospital Level 2',
      description: 'Level 2 HVAC duct layout for hospital renovation package.',
      number: 'SW-2026-0148',
      client: 'North Valley Medical Group',
      engineer: 'J. Razonable',
      created: 'May 20, 2026',
      modified: 'May 26, 2026, 6:42 AM',
      version: 'v0.1.0-preview',
      author: 'John Rey Razonable',
    },
    engineering: {
      designStandard: 'SMACNA HVAC Duct Construction Standards',
      shortStandard: 'SMACNA',
      airflowUnits: 'CFM',
      pressureUnits: 'in. w.g.',
      temperatureUnits: 'deg F',
      safetyFactors: 'Default (SMACNA Baseline)',
      autoCalculate: true,
    },
    health: [
      { id: 'unconnected', status: 'error', label: 'Unconnected Sections', count: 5 },
      { id: 'geometry', status: 'ok', label: 'Geometry Clean' },
      { id: 'equipment', status: 'warning', label: 'Missing Equipment', count: 3 },
    ],
    systems: [
      {
        id: 'supply',
        name: 'Supply',
        segmentCount: 12,
        totalLength: 140,
        surfaceArea: 420,
        designAirflow: 1800,
        pressureLoss: 0.32,
        status: 'balanced',
      },
      {
        id: 'oa',
        name: 'Outside Air',
        segmentCount: 4,
        totalLength: 52,
        surfaceArea: 128,
        designAirflow: null,
        pressureLoss: null,
        status: 'not_calculated',
      },
    ],
    unitSystem: 'imperial',
    elements: {
      inventory: { Ducts: 12, Fittings: 0, Equipment: 2, Rooms: 0 },
      breakdown: { Rectangular: 8, Round: 4, Flex: 0, Elbows: 0, Tees: 0, Reducers: 0 },
    },
    recentActivity: [
      { id: '1', action: 'Added', type: 'Rect Duct', target: 'Segment #147', time: '2 min ago' },
    ],
    recentActivityLimit: 10,
    recentActivityTotal: 1,
    canUndo: true,
    canRedo: false,
    actionStatus: null,
    onToggleAutoCalculate: vi.fn(),
    onEditEngineeringSettings: vi.fn(),
    onLocateHealthIssue: vi.fn(),
    onSelectAllInvalid: vi.fn(),
    onAutoFixGeometry: vi.fn(),
    onSelectElementType: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    ...overrides,
  };
}

function openSection(name: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name, 'i') }));
}

describe('InspectorOverviewPanel', () => {
  it('renders all sections collapsed by default', () => {
    render(<InspectorOverviewPanel {...createProps()} />);

    for (const name of ['Project', 'Engineering', 'Model Health', 'Systems', 'Elements', 'Recent Activity']) {
      expect(screen.getByRole('button', { name: new RegExp(name, 'i') }).getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('toggles the Show Centerline preference from the Engineering section', () => {
    usePreferencesStore.getState().setShowCenterline(false);
    render(<InspectorOverviewPanel {...createProps()} />);

    openSection('Engineering');
    const toggle = screen.getByTestId('toggle-show-centerline');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(toggle);
    expect(usePreferencesStore.getState().showCenterline).toBe(true);
    expect(screen.getByTestId('toggle-show-centerline').getAttribute('aria-pressed')).toBe('true');

    usePreferencesStore.getState().setShowCenterline(false);
  });

  it('renders project fields from props after opening Project', () => {
    render(<InspectorOverviewPanel {...createProps()} />);

    openSection('Project');

    expect(screen.getByText('Hospital Level 2')).toBeDefined();
    expect(screen.getByText('SW-2026-0148')).toBeDefined();
    expect(screen.getByText('North Valley Medical Group')).toBeDefined();
    expect(screen.getByText('May 26, 2026, 6:42 AM')).toBeDefined();
  });

  it('uses readable project copy when the project number is not set', () => {
    render(
      <InspectorOverviewPanel
        {...createProps({
          project: {
            ...createProps().project,
            number: 'Not set',
          },
        })}
      />
    );

    expect(screen.getByRole('button', { name: /project/i }).textContent).toContain('Hospital Level 2');
    expect(screen.getByRole('button', { name: /project/i }).textContent).not.toContain('Not set');

    openSection('Project');
    expect(screen.getByText('Not set')).toBeDefined();
  });

  it('renders only passed systems and handles not-calculated values', () => {
    render(<InspectorOverviewPanel {...createProps()} />);

    openSection('Systems');

    expect(screen.getByText('Supply')).toBeDefined();
    expect(screen.getByText('Outside Air')).toBeDefined();
    expect(screen.queryByText('Return')).toBeNull();
    expect(screen.getAllByText('Sections').length).toBeGreaterThan(0);
    expect(screen.queryByText('Segments')).toBeNull();
    expect(screen.getByText('Not Calculated')).toBeDefined();
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
  });

  it('formats system values for metric unit projects', () => {
    render(<InspectorOverviewPanel {...createProps({ unitSystem: 'metric' })} />);

    openSection('Systems');

    expect(screen.getByText('43 m')).toBeDefined();
    expect(screen.getByText('850 L/s')).toBeDefined();
  });

  it('formats the collapsed systems summary for metric unit projects', () => {
    render(<InspectorOverviewPanel {...createProps({ unitSystem: 'metric' })} />);

    expect(screen.getByRole('button', { name: /systems/i }).textContent).toContain('59 m - 850 L/s');
  });

  it('keeps zero-count element rows visible', () => {
    render(<InspectorOverviewPanel {...createProps()} />);

    openSection('Elements');

    const fittingsRow = screen.getByRole('button', { name: /select all fittings/i });
    expect(within(fittingsRow).getByText('0')).toBeDefined();
    const elbowsRow = screen.getByRole('button', { name: /select all elbows/i });
    expect(within(elbowsRow).getByText('0')).toBeDefined();
  });

  it('renders an empty activity state', () => {
    render(<InspectorOverviewPanel {...createProps({ recentActivity: [] })} />);

    openSection('Recent Activity');

    expect(screen.getByText('No changes yet.')).toBeDefined();
  });

  it('shows activity overflow metadata when history exceeds the visible limit', () => {
    render(<InspectorOverviewPanel {...createProps({ recentActivityLimit: 10, recentActivityTotal: 25 })} />);

    openSection('Recent Activity');

    expect(screen.getByText('Showing latest 10 of 25 changes.')).toBeDefined();
  });

  it('disables a loading section and renders loading summary', () => {
    render(
      <InspectorOverviewPanel
        {...createProps({
          sectionStates: { project: { loading: true } },
        })}
      />
    );

    const projectButton = screen.getByRole('button', { name: /project/i });
    expect(projectButton.hasAttribute('disabled')).toBe(true);
    expect(projectButton.textContent).toContain('Loading...');
  });

  it('renders section error state with retry action', () => {
    const onRetry = vi.fn();
    render(
      <InspectorOverviewPanel
        {...createProps({
          sectionStates: { systems: { error: 'Calculation failed', onRetry } },
        })}
      />
    );

    openSection('Systems');
    expect(screen.getByText('Unable to load this section.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('wires required interaction callbacks', () => {
    const props = createProps();
    render(<InspectorOverviewPanel {...props} />);

    openSection('Engineering');
    fireEvent.click(screen.getByRole('button', { name: /auto calculate/i }));
    expect(props.onToggleAutoCalculate).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: /edit engineering settings/i }));
    expect(props.onEditEngineeringSettings).toHaveBeenCalledTimes(1);

    openSection('Model Health');
    fireEvent.click(screen.getByRole('button', { name: /locate unconnected sections/i }));
    expect(props.onLocateHealthIssue).toHaveBeenCalledWith('unconnected');
    fireEvent.click(screen.getByRole('button', { name: /select all invalid/i }));
    expect(props.onSelectAllInvalid).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /auto-fix geometry/i }));
    expect(props.onAutoFixGeometry).toHaveBeenCalledTimes(1);

    openSection('Elements');
    fireEvent.click(screen.getByRole('button', { name: /select all ducts/i }));
    expect(props.onSelectElementType).toHaveBeenCalledWith('Ducts');

    openSection('Recent Activity');
    fireEvent.click(screen.getByRole('button', { name: /^undo last action$/i }));
    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /^redo last undone action$/i }).hasAttribute('disabled')).toBe(true);
  });

  it('opens Model Health when clicking the amber health banner', () => {
    render(<InspectorOverviewPanel {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /model issues/i }));

    expect(screen.getByRole('button', { name: /model health/i }).getAttribute('aria-expanded')).toBe('true');
  });

  it('updates model health when props change without remounting', () => {
    const { rerender } = render(<InspectorOverviewPanel {...createProps({ health: [] })} />);

    expect(screen.getAllByText('All checks passed').length).toBeGreaterThan(0);

    rerender(
      <InspectorOverviewPanel
        {...createProps({
          health: [{ id: 'unconnected', status: 'warning', label: 'Unconnected', count: 2 }],
        })}
      />
    );

    expect(screen.getByRole('button', { name: /2 model issues/i })).toBeDefined();
  });

  it('updates element counts when props change without remounting', () => {
    const { rerender } = render(<InspectorOverviewPanel {...createProps()} />);

    expect(screen.getByRole('button', { name: /elements/i }).textContent).toContain('14 objects');

    rerender(
      <InspectorOverviewPanel
        {...createProps({
          elements: {
            inventory: { Ducts: 1, Fittings: 1, Equipment: 1, Rooms: 1 },
            breakdown: { Rectangular: 1, Round: 0, Flex: 0, Elbows: 1, Tees: 0, Reducers: 0 },
          },
        })}
      />
    );

    expect(screen.getByRole('button', { name: /elements/i }).textContent).toContain('4 objects');
  });

  it('reflects auto calculate updates from external state', () => {
    const { rerender } = render(<InspectorOverviewPanel {...createProps()} />);

    expect(screen.getByRole('button', { name: /engineering/i }).textContent).toContain('Auto Calc ON');

    rerender(
      <InspectorOverviewPanel
        {...createProps({
          engineering: { ...createProps().engineering, autoCalculate: false },
        })}
      />
    );

    expect(screen.getByRole('button', { name: /engineering/i }).textContent).toContain('Auto Calc OFF');
  });
});
