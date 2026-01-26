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

interface ProjectAlreadyExistsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onContinue: () => void;
  onCancel: () => void;
}

export function ProjectAlreadyExistsDialog({
  open,
  onOpenChange,
  projectName,
  onContinue,
  onCancel,
}: ProjectAlreadyExistsDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-w-md"
        data-testid="project-already-exists-dialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelButtonRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Project already exists</DialogTitle>
          <DialogDescription>
            A project named “{projectName}” is already in your project list.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 mt-4">
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={onCancel}
            data-testid="project-exists-cancel"
          >
            Cancel
          </Button>
          <Button onClick={onContinue} data-testid="project-exists-continue">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
