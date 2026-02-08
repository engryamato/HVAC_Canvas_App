'use client';

import { AlertTriangle, Info, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BaseDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

interface LargeFileWarningDialogProps extends BaseDialogProps {
  estimatedSize: string;
}

interface ExportErrorDialogProps extends BaseDialogProps {
  message: string;
}

export function EmptyCanvasDialog({ open, onCancel, onConfirm }: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-w-md" data-testid="empty-canvas-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Export Empty Canvas?
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            The canvas is empty. Exporting will create a blank file. Do you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Export Anyway</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LargeFileWarningDialog({ open, onCancel, onConfirm, estimatedSize }: LargeFileWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-w-md" data-testid="large-file-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Large File Warning
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            This export may be large (estimated {estimatedSize}). Large files can take longer to save or download.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExportErrorDialog({ open, onCancel, onConfirm, message }: ExportErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-w-md" data-testid="export-error-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Export Failed
          </DialogTitle>
          <DialogDescription className="text-slate-600">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
          <Button onClick={onConfirm}>Retry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UnsavedChangesDialog({ open, onCancel, onConfirm }: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-w-md" data-testid="export-unsaved-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Info className="h-5 w-5" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Your project has unsaved changes. Export will include the latest updates. Continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
