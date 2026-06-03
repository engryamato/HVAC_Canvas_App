'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface PopoverProps {
  open: boolean;
  anchorRect?: { x: number; y: number; width: number; height: number };
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((node) => !node.hasAttribute('disabled') && node.tabIndex !== -1);
}

export function Popover({ open, anchorRect, onOpenChange, children, className }: PopoverProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = ref.current;
    window.setTimeout(() => {
      const first = node ? getFocusable(node)[0] : null;
      (first ?? node)?.focus();
    }, 0);

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      if (node && !node.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (event.key !== 'Tab' || !node) {
        return;
      }

      const focusable = getFocusable(node);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  const left = anchorRect ? Math.min(Math.max(anchorRect.x, 8), window.innerWidth - 288) : 8;
  const top = anchorRect ? Math.min(Math.max(anchorRect.y + anchorRect.height + 8, 8), window.innerHeight - 240) : 8;

  return (
    <div
      ref={ref}
      data-testid="popover"
      tabIndex={-1}
      className={cn(
        'fixed z-50 w-72 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-lg outline-none',
        className
      )}
      style={{ left, top }}
    >
      {children}
    </div>
  );
}
