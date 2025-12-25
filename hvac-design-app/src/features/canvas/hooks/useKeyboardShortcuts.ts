'use client';

import { useEffect } from 'react';
import { redo, undo } from '@/core/commands';

interface ShortcutOptions {
  onSave?: () => void;
  onDelete?: () => void;
}

/**
 * Global keyboard handler for canvas shortcuts (Appendix A subset)
 */
export function useKeyboardShortcuts(options: ShortcutOptions = {}) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (ctrlOrMeta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }

      if (ctrlOrMeta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }

      if (ctrlOrMeta && event.key.toLowerCase() === 's') {
        event.preventDefault();
        options.onSave?.();
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        options.onDelete?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [options, redo, undo]);
}
