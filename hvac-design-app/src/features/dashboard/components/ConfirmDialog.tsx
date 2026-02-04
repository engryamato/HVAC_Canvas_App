'use client';

import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) {
    return null;
  }

  const confirmVariant = variant === 'danger' ? 'destructive' : 'default';

  const titleClassName =
    variant === 'danger'
      ? 'text-red-600'
      : variant === 'warning'
        ? 'text-yellow-700'
        : 'text-slate-900';

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent
        className="max-w-md"
        data-testid="confirm-dialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelButtonRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className={titleClassName}>{title}</DialogTitle>
          <DialogDescription className="text-slate-600">{message}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 mt-4">
          <Button ref={cancelButtonRef} variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


