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

  // Map variant to Button variant and custom classes
  const getConfirmButtonProps = () => {
    switch (variant) {
      case 'danger':
        return { variant: 'destructive' as const, className: '' };
      case 'warning':
        return { 
          variant: 'default' as const, 
          className: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' 
        };
      case 'info':
      default:
        return { 
          variant: 'default' as const, 
          className: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
        };
    }
  };

  const confirmButtonProps = getConfirmButtonProps();

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
          <Button 
            variant={confirmButtonProps.variant} 
            className={confirmButtonProps.className}
            onClick={onConfirm}
            data-testid="confirm-button"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


