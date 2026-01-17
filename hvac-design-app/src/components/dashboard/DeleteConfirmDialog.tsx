'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';

export interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectName: string;
    entityCount?: number;
    modifiedAt?: string;
    filePath?: string; // Tauri: absolute file path to .sws file
    onDeleted?: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    open,
    onOpenChange,
    projectId,
    projectName,
    entityCount = 0,
    modifiedAt,
    filePath,
    onDeleted,
}) => {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const removeProject = useProjectListStore((state) => state.removeProject);

    const isConfirmed = confirmText.trim() === projectName;

    const formatRelativeTime = (dateString?: string) => {
        if (!dateString) {return 'Unknown';}
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {return 'Today';}
        if (diffDays === 1) {return 'Yesterday';}
        if (diffDays < 7) {return `${diffDays} days ago`;}
        if (diffDays < 30) {return `${Math.floor(diffDays / 7)} weeks ago`;}
        return date.toLocaleDateString();
    };

    const handleDelete = async () => {
        if (!isConfirmed) {return;}

        setIsDeleting(true);
        setError(null);

        try {
            // Remove from store (async in Tauri mode for file deletion)
            await removeProject(projectId);

            // Close dialog
            onOpenChange(false);

            // Reset state
            setConfirmText('');

            // Callback
            onDeleted?.();
        } catch (err) {
            console.error('Failed to delete project:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (isDeleting) {return;}
        setConfirmText('');
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-md"
                data-testid="delete-confirm-dialog"
                onPointerDownOutside={(e) => {
                    if (isDeleting) {e.preventDefault();}
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Project?
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. The project and all its data will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Project Info */}
                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                        <p className="font-semibold text-slate-900">{projectName}</p>
                        <div className="mt-2 text-sm text-slate-600 space-y-1">
                            <p>{entityCount} entities</p>
                            <p>Last modified: {formatRelativeTime(modifiedAt)}</p>
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                        <p className="text-sm text-red-800">
                            <strong>⚠️ Warning:</strong> This action cannot be undone. The project file and all associated data will be permanently deleted.
                        </p>
                        {filePath && (
                            <div className="mt-2 space-y-1 text-xs text-red-700 font-mono">
                                <p className="font-sans font-medium">Files to be deleted:</p>
                                <p className="truncate" title={filePath}>• {filePath}</p>
                                <p className="truncate" title={`${filePath}.bak`}>• {filePath}.bak</p>
                            </div>
                        )}
                    </div>

                    {/* Confirmation Input */}
                    <div className="space-y-2">
                        <label htmlFor="confirm-delete" className="block text-sm font-medium text-slate-700">
                            Type <span className="font-semibold text-slate-900">{projectName}</span> to confirm deletion:
                        </label>
                        <div className="relative">
                            <Input
                                id="confirm-delete"
                                data-testid="delete-confirm-input"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={projectName}
                                disabled={isDeleting}
                                className={isConfirmed ? 'border-green-500 pr-10' : ''}
                                autoComplete="off"
                            />
                            {isConfirmed && (
                                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                            )}
                        </div>
                        {isConfirmed && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                Name confirmed
                            </p>
                        )}
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmed || isDeleting}
                        data-testid="delete-confirm-btn"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
