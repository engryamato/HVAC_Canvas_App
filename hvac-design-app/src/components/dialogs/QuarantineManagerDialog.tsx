'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, FolderOpen, Info } from 'lucide-react';
import { getProjectRepository } from '@/core/persistence/ProjectRepository';
import type { QuarantinedFile } from '@/core/services/types';

interface QuarantineManagerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuarantineManagerDialog({ open, onOpenChange }: QuarantineManagerDialogProps) {
    const [files, setFiles] = useState<QuarantinedFile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadQuarantinedFiles();
        }
    }, [open]);

    const loadQuarantinedFiles = async () => {
        setLoading(true);
        try {
            const repository = await getProjectRepository();
            const quarantinedFiles = await repository.getQuarantinedFiles();
            setFiles(quarantinedFiles);
        } catch (error) {
            console.error('Failed to load quarantined files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filePath: string) => {
        try {
            const repository = await getProjectRepository();
            await repository.deleteQuarantinedFile(filePath);
            await loadQuarantinedFiles();
        } catch (error) {
            console.error('Failed to delete quarantined file:', error);
        }
    };

    const handleOpenFolder = async () => {
        // TODO: Use Tauri shell plugin to open quarantine folder
        console.log('Open quarantine folder');
    };

    const handleClearAll = async () => {
        const confirmed = globalThis.confirm(
            `Are you sure you want to permanently delete all ${files.length} quarantined files?`
        );
        
        if (confirmed) {
            try {
                const repository = await getProjectRepository();
                for (const file of files) {
                    await repository.deleteQuarantinedFile(file.path);
                }
                await loadQuarantinedFiles();
            } catch (error) {
                console.error('Failed to clear quarantined files:', error);
            }
        }
    };

    const formatDate = (isoDate: string): string => {
        return new Date(isoDate).toLocaleString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Quarantined Files</DialogTitle>
                </DialogHeader>

                <div className="max-h-[400px] overflow-y-auto">
                    {files.length === 0 && !loading && (
                        <div className="py-8 text-center">
                            <Info className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                No quarantined files
                            </p>
                            <p className="text-xs text-slate-500">
                                Corrupted or invalid project files will appear here
                            </p>
                        </div>
                    )}

                    {files.length > 0 && (
                        <>
                            <Alert className="mb-4">
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    These files were quarantined because they failed validation checks.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                {files.map((file) => (
                                    <div
                                        key={file.path}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {file.path.split('/').pop() || file.path}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <span>{formatDate(new Date(file.timestamp).toISOString())}</span>
                                                {file.reason && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-red-600 dark:text-red-400">
                                                            {file.reason}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(file.path)}
                                            className="ml-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    {files.length > 0 && (
                        <>
                            <Button variant="outline" onClick={handleOpenFolder}>
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Open Folder
                            </Button>
                            <Button variant="destructive" onClick={handleClearAll}>
                                Clear All
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

