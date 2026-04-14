import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useHistoryStore } from '@/core/commands';
import type { ReversibleCommand } from '@/core/commands';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useDialogStore } from '@/core/store/dialogStore';

const clipboardMocks = vi.hoisted(() => ({
  copySelectionToClipboard: vi.fn(async () => true),
  cutSelectionToClipboard: vi.fn(async () => true),
  pasteFromClipboard: vi.fn(async () => true),
}));

vi.mock('@/features/canvas/clipboard/entityClipboard', () => clipboardMocks);

import { EditMenu } from '../EditMenu';

function makeNoopCommand(): ReversibleCommand {
  return {
    id: crypto.randomUUID(),
    type: 'CREATE_ENTITY',
    payload: { entity: { id: crypto.randomUUID() } },
    timestamp: Date.now(),
    inverse: {
      id: crypto.randomUUID(),
      type: 'DELETE_ENTITY',
      payload: { entityId: crypto.randomUUID() },
      timestamp: Date.now(),
    },
  } as unknown as ReversibleCommand;
}

describe('EditMenu', () => {
  beforeEach(() => {
    useHistoryStore.getState().clear();
    useSelectionStore.getState().clearSelection();
    useDialogStore.setState({
      openCalculationSettings: false,
      openBulkEdit: false,
      openSystemTemplate: false,
    });
    clipboardMocks.copySelectionToClipboard.mockClear();
    clipboardMocks.cutSelectionToClipboard.mockClear();
    clipboardMocks.pasteFromClipboard.mockClear();
  });

  it('disables undo/redo when history empty', async () => {
    render(<EditMenu />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const undoItem = screen.getByTestId('menu-undo') as HTMLButtonElement;
    const redoItem = screen.getByTestId('menu-redo') as HTMLButtonElement;

    expect(undoItem.disabled).toBe(true);
    expect(redoItem.disabled).toBe(true);
  });

  it('enables undo when past has commands', async () => {
    useHistoryStore.getState().push(makeNoopCommand());

    render(<EditMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const undoItem = screen.getByTestId('menu-undo') as HTMLButtonElement;
    expect(undoItem.disabled).toBe(false);
  });

  it('disables cut/copy when selection empty', () => {
    render(<EditMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const cutItem = screen.getByRole('button', { name: /cut/i }) as HTMLButtonElement;
    const copyItem = screen.getByRole('button', { name: /copy/i }) as HTMLButtonElement;

    expect(cutItem.disabled).toBe(true);
    expect(copyItem.disabled).toBe(true);
  });

  it('invokes clipboard actions when clicking menu items', () => {
    useSelectionStore.getState().select('room-1');

    render(<EditMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(clipboardMocks.copySelectionToClipboard).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: /cut/i }));
    expect(clipboardMocks.cutSelectionToClipboard).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: /paste/i }));
    expect(clipboardMocks.pasteFromClipboard).toHaveBeenCalledTimes(1);
  });

  it('opens calculation settings from edit menu', () => {
    render(<EditMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    fireEvent.click(screen.getByTestId('menu-open-calculation-settings'));

    expect(useDialogStore.getState().openCalculationSettings).toBe(true);
  });

  it('gates bulk edit to multi-selection and opens when enabled', () => {
    render(<EditMenu />);
    const editButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    const bulkEditItem = screen.getByTestId('menu-open-bulk-edit') as HTMLButtonElement;
    expect(bulkEditItem.disabled).toBe(true);

    useSelectionStore.getState().selectMultiple(['entity-1', 'entity-2']);

    fireEvent.click(editButton);
    fireEvent.click(editButton);
    const enabledBulkEditItem = screen.getByTestId('menu-open-bulk-edit') as HTMLButtonElement;
    expect(enabledBulkEditItem.disabled).toBe(false);

    fireEvent.click(enabledBulkEditItem);
    expect(useDialogStore.getState().openBulkEdit).toBe(true);
  });
});
