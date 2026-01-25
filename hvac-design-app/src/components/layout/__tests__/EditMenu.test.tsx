import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditMenu } from '../EditMenu';
import { useHistoryStore } from '@/core/commands';
import type { ReversibleCommand } from '@/core/commands';

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
  it('disables undo/redo when history empty', async () => {
    useHistoryStore.getState().clear();
    render(<EditMenu />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const undoItem = screen.getByTestId('menu-undo') as HTMLButtonElement;
    const redoItem = screen.getByTestId('menu-redo') as HTMLButtonElement;

    expect(undoItem.disabled).toBe(true);
    expect(redoItem.disabled).toBe(true);
  });

  it('enables undo when past has commands', async () => {
    useHistoryStore.getState().clear();
    useHistoryStore.getState().push(makeNoopCommand());

    render(<EditMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const undoItem = screen.getByTestId('menu-undo') as HTMLButtonElement;
    expect(undoItem.disabled).toBe(false);
  });
});
