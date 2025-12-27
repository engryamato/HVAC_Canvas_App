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
  // Use userAgentData if available (modern browsers)
  // Type assertion needed as userAgentData is not in standard Navigator type yet
  const nav = navigator as Navigator & { userAgentData?: { platform: string } };
  if (nav.userAgentData?.platform) {
    return nav.userAgentData.platform === 'macOS';
  }
  // Fallback to deprecated platform property for older browsers
  return navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Hook to register global undo/redo keyboard shortcuts
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 */
export function useUndoRedo() {
  useEffect(() => {
    // SSR guard: only run in browser - use try-catch for environments where window is deleted
    let win: typeof globalThis.window | undefined;
    try {
      win = typeof window !== 'undefined' ? window : undefined;
    } catch {
      // window is not defined (SSR or deleted)
      return;
    }

    if (!win) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for Ctrl or Cmd (both work on all platforms for better compatibility)
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z or Cmd+Z
      if (ctrlOrCmd && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        (ctrlOrCmd && key === 'y') || // Ctrl+Y (Windows/Linux)
        (ctrlOrCmd && e.shiftKey && key === 'z') // Ctrl+Shift+Z or Cmd+Shift+Z
      ) {
        e.preventDefault();
        redo();
        return;
      }
    };

    win.addEventListener('keydown', handleKeyDown);

    return () => {
      win.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

export default useUndoRedo;
