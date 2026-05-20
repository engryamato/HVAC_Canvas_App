import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDuctOverlayStore } from '@/core/store/ductOverlayStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useValidationStore } from '@/core/store/validationStore';
import { ValidationDashboard } from '../ValidationDashboard';

describe('ValidationDashboard duct color overlay', () => {
  beforeEach(() => {
    useDuctOverlayStore.getState().resetOverlay();
    useEntityStore.getState().clearAllEntities();
    useValidationStore.getState().clearAll();
  });

  it('shows overlay options and writes the session overlay mode', () => {
    render(<ValidationDashboard />);

    expect(screen.getByText('Duct Color Overlay')).toBeDefined();
    expect(screen.getByLabelText('Off')).toBeDefined();
    expect(screen.getByLabelText('By Velocity')).toBeDefined();
    expect(screen.getByLabelText('By Pressure')).toBeDefined();

    fireEvent.click(screen.getByLabelText('By Velocity'));
    expect(useDuctOverlayStore.getState().overlayMode).toBe('velocity');

    fireEvent.click(screen.getByLabelText('By Pressure'));
    expect(useDuctOverlayStore.getState().overlayMode).toBe('pressure');
  });
});
