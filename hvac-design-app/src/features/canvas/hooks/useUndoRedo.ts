'use client';

import { useEffect } from 'react';
import { undo, redo } from '@/core/commands/entityCommands';

/**
 * Hook to register global undo/redo keyboard shortcuts
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 */
export function useUndoRedo() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z or Cmd+Z
      if (ctrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        (ctrlOrCmd && e.key === 'y') || // Ctrl+Y (Windows/Linux)
        (ctrlOrCmd && e.shiftKey && e.key === 'z') // Ctrl+Shift+Z or Cmd+Shift+Z
      ) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

export default useUndoRedo;
