import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DuctInspector } from '../DuctInspector';
import type { Duct } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useSettingsStore } from '@/core/store/settingsStore';
import { parametricUpdateService } from '@/core/services/parametric/parametricUpdateService';

vi.mock('@/components/canvas/AutoSizingControls', () => ({
  AutoSizingControls: () => <div data-testid="auto-sizing-controls" />,
}));

// Note: DuctInspector no longer uses TabbedPropertiesPanel or InspectorAccordion.
// The layout is a flat card/section structure, so no panel-level mock is needed.

vi.mock('@/core/services/parametric/parametricUpdateService', async () => {
  const actual = await vi.importActual('@/core/services/parametric/parametricUpdateService');
  return {
    ...actual,
    parametricUpdateService: {
      ...((actual as { parametricUpdateService: object }).parametricUpdateService),
      scheduleDuctPropertyChange: vi.fn(),
    },
  };
});

function equivalentRoundDiameter(width: number, height: number): number {
  return 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
}

function createDuct(overrides: Partial<Duct['props']> = {}): Duct {
  return {
    id: '00000000-0000-4000-8000-000000000111',
    type: 'duct',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
      engineeringSystem: 'standard_duct',
      name: 'Main Duct',
      shape: 'round',
      diameter: 12,
      length: 20,
      material: 'galvanized',
      airflow: 3000,
      staticPressure: 0.1,
      engineeringData: {
        airflow: 3000,
        velocity: 3200,
        pressureDrop: 0.25,
        friction: 0.002,
      },
      constraintStatus: {
        isValid: false,
        violations: [
          {
            type: 'velocity-max',
            severity: 'error',
            message: 'Velocity 3200 FPM exceeds maximum 2500 FPM',
            suggestedFix: 'legacy text fix',
          },
          {
            type: 'pressure-drop-max',
            severity: 'error',
            message: 'Pressure drop 0.250 in.w.g./100ft exceeds maximum 0.1',
            suggestedFix: 'legacy text fix',
          },
        ],
        lastValidated: new Date('2025-01-01T00:00:00.000Z'),
      },
      ...overrides,
    },
    calculated: {
      area: 113.1,
      velocity: 3200,
      frictionLoss: 0.25,
    },
  };
}

describe('DuctInspector Milestone 4 behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntityStore.getState().clearAllEntities();
    useSettingsStore.setState((state) => ({
      ...state,
      calculationSettings: {
        ...state.calculationSettings,
        engineeringLimits: {
          maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
          minVelocity: { supply: 600, return: 500, exhaust: 500 },
          maxPressureDrop: { supply: 0.1, return: 0.08, exhaust: 0.08 },
          frictionFactors: {
            galvanized: 0.0005,
            stainless: 0.00015,
            flexible: 0.003,
            fiberglass: 0.0003,
          },
          standardConditions: {
            temperature: 70,
            pressure: 29.92,
            altitude: 0,
          },
        },
      },
    }));
  });

  it('allows violating edits to persist while validation issues remain visible', async () => {
    const duct = createDuct();
    const scheduleMock = vi.mocked(parametricUpdateService.scheduleDuctPropertyChange);

    scheduleMock.mockResolvedValue({
      updatedEntities: [duct.id],
      violations: [{ entityId: duct.id, message: 'Velocity exceeds max' }],
      requiresUserAction: true,
      engineeringData: {
        airflow: 3400,
        velocity: 3600,
        pressureDrop: 0.3,
        friction: 0.002,
      },
      entityUpdates: [
        {
          id: duct.id,
          previous: duct,
          updates: {
            props: {
              ...duct.props,
              airflow: 3400,
              engineeringData: {
                airflow: 3400,
                velocity: 3600,
                pressureDrop: 0.3,
                friction: 0.002,
              },
              constraintStatus: {
                isValid: false,
                violations: [
                  {
                    type: 'velocity-max',
                    severity: 'error',
                    message: 'Velocity 3600 FPM exceeds maximum 2500 FPM',
                    suggestedFix: 'legacy text fix',
                  },
                ],
                lastValidated: new Date('2025-01-01T00:00:00.000Z'),
              },
            },
            modifiedAt: new Date('2025-01-01T00:00:01.000Z').toISOString(),
          },
        },
      ],
    });

    useEntityStore.getState().addEntity(duct);
    render(<DuctInspector entity={duct} />);

    const airflowInput = screen.getByLabelText('Airflow (CFM)') as HTMLInputElement;
    fireEvent.change(airflowInput, { target: { value: '3400' } });

    expect(scheduleMock).toHaveBeenCalledWith(
      duct.id,
      { airflow: 3400 },
      {
        ducts: expect.any(Array),
        fittings: expect.any(Array),
      },
      expect.any(Object),
      'input',
      500
    );

    await waitFor(() => {
      const stored = useEntityStore.getState().byId[duct.id] as Duct;
      expect(stored.props.airflow).toBe(3400);
    });
    expect(screen.getByText('Validation Issues')).toBeInTheDocument();
    expect(screen.getByText(/Velocity 3200 FPM exceeds maximum 2500 FPM/)).toBeInTheDocument();
  });

  it('does not render one-click actions for non-actionable text suggestions', () => {
    const duct = createDuct({
      constraintStatus: {
        isValid: false,
        violations: [
          {
            type: 'velocity-max',
            severity: 'error',
            message: 'Velocity 3200 FPM exceeds maximum 2500 FPM',
            suggestedFix: 'legacy text fix',
          },
        ],
        lastValidated: new Date('2025-01-01T00:00:00.000Z'),
      },
    });

    const scheduleMock = vi.mocked(parametricUpdateService.scheduleDuctPropertyChange);
    useEntityStore.getState().addEntity(duct);
    render(<DuctInspector entity={duct} />);

    expect(screen.queryByRole('button', { name: /Apply Fix/i })).toBeNull();
    expect(screen.getByText(/Velocity 3200 FPM exceeds maximum 2500 FPM/)).toBeInTheDocument();
    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it('remembers rectangular dimensions when switching to round and restores them when switching back', async () => {
    const rectangularDuct = createDuct({
      name: 'Rectangular Duct 1',
      shape: 'rectangular',
      width: 24,
      height: 12,
      diameter: undefined,
    });

    useEntityStore.getState().addEntity(rectangularDuct);
    const { unmount } = render(<DuctInspector entity={rectangularDuct} />);

    fireEvent.change(screen.getByLabelText('Shape'), { target: { value: 'round' } });

    await waitFor(() => {
      const stored = useEntityStore.getState().byId[rectangularDuct.id] as Duct;
      expect(stored.props.shape).toBe('round');
      expect(stored.props.diameter).toBeCloseTo(equivalentRoundDiameter(24, 12), 3);
      expect(stored.props.previousRectangularWidth).toBe(24);
      expect(stored.props.previousRectangularHeight).toBe(12);
    });

    const roundDuct = useEntityStore.getState().byId[rectangularDuct.id] as Duct;
    unmount();
    render(<DuctInspector entity={roundDuct} />);

    fireEvent.change(screen.getByLabelText('Shape'), { target: { value: 'rectangular' } });

    await waitFor(() => {
      const stored = useEntityStore.getState().byId[rectangularDuct.id] as Duct;
      expect(stored.props.shape).toBe('rectangular');
      expect(stored.props.width).toBe(24);
      expect(stored.props.height).toBe(12);
      expect(stored.props.diameter).toBeUndefined();
    });
  });
});
