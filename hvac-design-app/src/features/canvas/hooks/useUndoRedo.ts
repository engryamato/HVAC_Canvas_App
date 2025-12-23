'use client';

import { useEffect } from 'react';
import { undo, redo } from '@/core/commands/entityCommands';

/**
 * Detect if user is on macOS (SSR-safe)
 */
function isMacOS(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  // Use userAgentData if available (modern browsers), fallback to platform
  if (navigator.userAgentData) {
    return navigator.userAgentData.platform === 'macOS';
  }
  // Fallback to deprecated platform property
  return navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Hook to register global undo/redo keyboard shortcuts
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 */
export function useUndoRedo() {
  useEffect(() => {
    // SSR guard: only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = isMacOS();
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
