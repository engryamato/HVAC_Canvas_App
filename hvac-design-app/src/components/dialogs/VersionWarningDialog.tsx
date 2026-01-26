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

interface VersionWarningDialogProps {
    projectVersion: string;
    appVersion: string;
    onContinue: () => void;
    onCancel: () => void;
}

/**
 * Warning dialog shown when project version is newer than app version
 */
export function VersionWarningDialog({
    projectVersion,
    appVersion,
    onContinue,
    onCancel
}: VersionWarningDialogProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

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
                data-testid="version-warning-dialog"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    cancelButtonRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-yellow-600">Newer Project Version</DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-3 text-slate-600">
                            <p>
                                This project was created with a newer version of the application.
                            </p>
                            <p className="text-sm">
                                Project version: <strong className="text-slate-900">{projectVersion}</strong>
                                <br />
                                App version: <strong className="text-slate-900">{appVersion}</strong>
                            </p>
                            <p>
                                Some features may not work correctly. Would you like to continue?
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex gap-2 mt-4">
                    <Button
                        ref={cancelButtonRef}
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button onClick={onContinue}>Open Anyway</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
