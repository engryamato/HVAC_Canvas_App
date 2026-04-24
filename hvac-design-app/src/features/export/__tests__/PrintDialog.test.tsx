import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrintDialog } from '../components/PrintDialog';
import { captureCanvasSnapshot } from '../canvasSnapshot';
import type { PrintOptions } from '../types';

vi.mock('../canvasSnapshot', () => ({
  captureCanvasSnapshot: vi.fn(),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button type="button" onClick={() => onValueChange('wide')}>Wide</button>
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
    <div data-testid="radio-group" data-value={value}>
      {children}
      <button type="button" onClick={() => onValueChange('landscape')}>Landscape</button>
      <button type="button" onClick={() => onValueChange('custom')}>Custom</button>
    </div>
  ),
  RadioGroupItem: ({ value }: { value: string }) => <div data-testid={`radio-${value}`} />,
}));

describe('PrintDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(captureCanvasSnapshot).mockResolvedValue({
      dataUrl: 'data:image/png;base64,abc',
      widthPx: 400,
      heightPx: 300,
    });
  });

  it('renders preview when open', async () => {
    render(
      <PrintDialog
        open={true}
        onOpenChange={vi.fn()}
        onPrint={vi.fn(async (_options: PrintOptions) => undefined)}
      />
    );

    expect(screen.getByTestId('print-dialog')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByAltText('Print preview')).toBeInTheDocument());
  });

  it('calls onPrint with selected options', async () => {
    const onPrint = vi.fn(async (_options: PrintOptions) => undefined);

    render(
      <PrintDialog
        open={true}
        onOpenChange={vi.fn()}
        onPrint={onPrint}
      />
    );

    fireEvent.click(screen.getByText('Landscape'));
    fireEvent.click(screen.getByText('Custom'));
    fireEvent.click(screen.getByText('Wide'));
    fireEvent.change(screen.getByLabelText('Scale (%)'), { target: { value: '125' } });
    fireEvent.click(screen.getByRole('button', { name: /print/i }));

    await waitFor(() => expect(onPrint).toHaveBeenCalled());

    const options = onPrint.mock.calls[0]?.[0] as PrintOptions | undefined;
    expect(options?.orientation).toBe('landscape');
    expect(options?.scale).toBe('custom');
    expect(options?.customScale).toBe(125);
    expect(options?.margins).toBe('wide');
  });
});
