import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedExportDialog } from '../components/EnhancedExportDialog';
import { captureCanvasSnapshot } from '../canvasSnapshot';
import type { ExportOptions, ExportResult } from '../types';

vi.mock('../canvasSnapshot', () => ({
  captureCanvasSnapshot: vi.fn(),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button type="button" onClick={() => onValueChange('png')}>PNG</button>
      <button type="button" onClick={() => onValueChange('pdf')}>PDF</button>
      <button type="button" onClick={() => onValueChange('svg')}>SVG</button>
      <button type="button" onClick={() => onValueChange('custom')}>Custom</button>
      <button type="button" onClick={() => onValueChange('high')}>High</button>
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (value: boolean) => void }) => (
    <button
      type="button"
      data-testid="checkbox"
      aria-label="toggle"
      data-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress" data-value={value} />, 
}));

describe('EnhancedExportDialog', () => {
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
      <EnhancedExportDialog
        open={true}
        onOpenChange={vi.fn()}
        onExport={vi.fn(async () => ({ success: true } as ExportResult))}
      />
    );

    expect(screen.getByTestId('enhanced-export-dialog')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByAltText('Canvas preview')).toBeInTheDocument());
  });

  it('calls onExport with selected options', async () => {
    const onExport = vi.fn(async (_options: ExportOptions) => ({ success: true } as ExportResult));

    render(
      <EnhancedExportDialog
        open={true}
        onOpenChange={vi.fn()}
        onExport={onExport}
      />
    );

    fireEvent.click(screen.getByText('PNG'));
    fireEvent.click(screen.getByText('High'));
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    await waitFor(() => expect(onExport).toHaveBeenCalled());

    const options = onExport.mock.calls[0]?.[0] as ExportOptions | undefined;
    expect(options?.format).toBe('png');
    expect(options?.quality).toBe('high');
  });
});
