import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog')).toBeDefined();
      expect(screen.getByText('Confirm Action')).toBeDefined();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeDefined();
    });

    it('should not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('confirm-dialog')).toBeNull();
    });

    it('should display custom confirm and cancel labels', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep"
        />
      );

      expect(screen.getByText('Yes, Delete')).toBeDefined();
      expect(screen.getByText('No, Keep')).toBeDefined();
    });

    it('should use default labels when not provided', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Confirm')).toBeDefined();
      expect(screen.getByText('Cancel')).toBeDefined();
    });
  });

  describe('Variants', () => {
    it('should apply danger styling for danger variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const title = screen.getByText('Confirm Action');
      expect(title.className).toContain('text-red-600');
    });

    it('should apply warning styling for warning variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      const title = screen.getByText('Confirm Action');
      expect(title.className).toContain('text-yellow-700');
    });

    it('should apply default styling for info variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);

      const title = screen.getByText('Confirm Action');
      expect(title.className).toContain('text-slate-900');
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmBtn = screen.getByTestId('confirm-button');
      fireEvent.click(confirmBtn);

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelBtn = screen.getByText('Cancel');
      fireEvent.click(cancelBtn);

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('should have dialog title', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Confirm Action' })).toBeDefined();
    });
  });
});
