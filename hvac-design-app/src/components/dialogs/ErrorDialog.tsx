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

interface ErrorDialogProps {
    message: string;
    onClose: () => void;
}

/**
 * Generic error dialog for displaying error messages
 * Used for corrupted projects, load failures, etc.
 */
export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <Dialog
            open
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose();
                }
            }}
        >
            <DialogContent
                className="max-w-md"
                data-testid="error-dialog"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    closeButtonRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-red-600">Project Cannot Be Opened</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        {message}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4">
                    <Button ref={closeButtonRef} onClick={onClose}>
                        Back to Dashboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
