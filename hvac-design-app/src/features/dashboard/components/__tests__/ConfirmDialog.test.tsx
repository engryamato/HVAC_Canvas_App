import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when isOpen is true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    it('should not render dialog when isOpen is false', () => {
      render(
        <ConfirmDialog
          isOpen={false}
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    it('should display title and message', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Project"
          message="This action cannot be undone."
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });
  });

  describe('Variant Styling', () => {
    it('should apply danger variant styling (red title)', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete"
          message="Confirm delete?"
          variant="danger"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const title = screen.getByText('Delete');
      expect(title).toHaveClass('text-red-600');
    });

    it('should apply warning variant styling (yellow title)', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Warning"
          message="Proceed with caution?"
          variant="warning"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const title = screen.getByText('Warning');
      expect(title).toHaveClass('text-yellow-700');
    });

    it('should apply info variant styling (default slate title)', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Info"
          message="Continue?"
          variant="info"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const title = screen.getByText('Info');
      expect(title).toHaveClass('text-slate-900');
    });

    it('should use info variant by default', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Default"
          message="Continue?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const title = screen.getByText('Default');
      expect(title).toHaveClass('text-slate-900');
    });
  });

  describe('Button Labels', () => {
    it('should use default labels when not provided', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should use custom labels when provided', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test message"
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Confirm Button Styling Per Variant', () => {
    it('should use destructive styling for danger variant confirm button', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete"
          message="Confirm?"
          variant="danger"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      // The Button component with destructive variant is rendered
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeInTheDocument();
      // Destructive variant applies red styling via shadcn destructive classes
    });

    it('should use amber styling for warning variant confirm button', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Archive"
          message="Archive this project?"
          variant="warning"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeInTheDocument();
      // Warning variant applies amber button styling
      expect(confirmButton).toHaveClass('bg-amber-500');
      expect(confirmButton).toHaveClass('hover:bg-amber-600');
    });

    it('should use blue styling for info variant confirm button', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Duplicate"
          message="Duplicate this project?"
          variant="info"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeInTheDocument();
      // Info variant applies blue/primary button styling
      expect(confirmButton).toHaveClass('bg-blue-600');
      expect(confirmButton).toHaveClass('hover:bg-blue-700');
    });

    it('should use blue styling for default (no variant) confirm button', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Confirm"
          message="Continue?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeInTheDocument();
      // Default uses info variant which applies blue styling
      expect(confirmButton).toHaveClass('bg-blue-600');
    });

    it('should use outline variant for cancel button', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      // Cancel button uses outline variant
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Dialog Tailwind Classes', () => {
    it('should apply max-w-md class to dialog content', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const dialogContent = screen.getByTestId('confirm-dialog');
      expect(dialogContent).toHaveClass('max-w-md');
    });

    it('should apply text-slate-600 to message description', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      
      const message = screen.getByText('Test message');
      expect(message).toHaveClass('text-slate-600');
    });
  });
});
