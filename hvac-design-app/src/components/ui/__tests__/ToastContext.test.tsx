import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '../ToastContext';

function TestComponent() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <div>
      <button
        onClick={() =>
          addToast({
            type: 'info',
            title: 'Test Toast',
            message: 'Test message',
          })
        }
      >
        Add Toast
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          <span>{toast.title}</span>
          <button onClick={() => removeToast(toast.id)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('adds a toast to the queue', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Toast'));
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('auto-dismisses toast after default duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Toast'));
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('allows manual dismissal', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Toast'));
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      fireEvent.click(screen.getByText('Dismiss'));
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('supports multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
    expect(screen.getAllByText('Test Toast')).toHaveLength(3);
  });

  it('generates unique ids for each toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Add Toast'));
    });

    const toasts = screen.getAllByTestId(/^toast-toast-/);
    expect(toasts).toHaveLength(2);
    const [firstToast, secondToast] = toasts;
    expect(firstToast).toBeDefined();
    expect(secondToast).toBeDefined();
    expect(firstToast?.getAttribute('data-testid')).not.toBe(secondToast?.getAttribute('data-testid'));
  });

  it('respects custom duration', () => {
    function CustomDurationComponent() {
      const { addToast, toasts } = useToast();

      return (
        <div>
          <button
            onClick={() =>
              addToast({
                type: 'info',
                title: 'Custom Duration',
                duration: 1000,
              })
            }
          >
            Add Custom
          </button>
          {toasts.map((toast) => (
            <span key={toast.id}>{toast.title}</span>
          ))}
        </div>
      );
    }

    render(
      <ToastProvider>
        <CustomDurationComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Custom'));
    });
    expect(screen.getByText('Custom Duration')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByText('Custom Duration')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Custom Duration')).not.toBeInTheDocument();
  });
});
