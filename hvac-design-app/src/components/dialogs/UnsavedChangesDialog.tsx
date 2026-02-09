'use client';

import { useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaveAndLeave: () => void;
    onLeaveWithoutSaving: () => void;
    onCancel: () => void;
}

export function UnsavedChangesDialog({
    open,
    onOpenChange,
    onSaveAndLeave,
    onLeaveWithoutSaving,
    onCancel,
}: UnsavedChangesDialogProps) {
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
                data-testid="unsaved-changes-dialog"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    cancelButtonRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Unsaved Changes
                    </DialogTitle>
                    <DialogDescription>
                        You have unsaved changes that will be lost if you leave without saving.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex gap-2 mt-4">
                    <Button
                        ref={cancelButtonRef}
                        variant="outline"
                        onClick={onCancel}
                        data-testid="cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onLeaveWithoutSaving}
                        data-testid="leave-without-saving-button"
                    >
                        Leave Without Saving
                    </Button>
                    <Button
                        onClick={onSaveAndLeave}
                        data-testid="save-and-leave-button"
                    >
                        Save and Leave
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

