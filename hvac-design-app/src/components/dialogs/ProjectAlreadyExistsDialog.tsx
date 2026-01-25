'use client';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="project-already-exists-dialog">
        <DialogHeader>
          <DialogTitle>Project already exists</DialogTitle>
          <DialogDescription>
            A project named “{projectName}” is already in your project list.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onCancel} data-testid="project-exists-cancel">
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

