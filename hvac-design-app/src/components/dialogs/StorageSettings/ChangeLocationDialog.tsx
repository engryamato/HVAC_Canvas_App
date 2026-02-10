'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, AlertTriangle } from 'lucide-react';
import { isTauri } from '@/core/persistence/filesystem';
import { useStorageRoot } from '@/hooks/useStorageRoot';

interface ChangeLocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPath: string | null;
}

export function ChangeLocationDialog({ open, onOpenChange, currentPath }: ChangeLocationDialogProps) {
    const { relocate } = useStorageRoot();
    const [newPath, setNewPath] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isDesktop = isTauri();

    const handleSelectFolder = async () => {
        if (!isDesktop) {
            return;
        }

        try {
            const { open: openDialog } = await import('@tauri-apps/plugin-dialog');
            const selected = await openDialog({
                directory: true,
                multiple: false,
                title: 'Select New Storage Location',
            });

            if (selected && typeof selected === 'string') {
                setNewPath(selected);
                setError(null);
            }
        } catch (err) {
            console.error('Failed to open folder picker:', err);
            setError(err instanceof Error ? err.message : 'Failed to open folder picker');
        }
    };

    const handleConfirm = async () => {
        const pathToUse = isDesktop ? newPath : newPath.trim();

        if (!pathToUse) {
            setError('Please select or enter a storage location');
            return;
        }

        if (pathToUse === currentPath) {
            onOpenChange(false);
            return;
        }

        setIsChanging(true);
        setError(null);

        try {
            await relocate(pathToUse);
            onOpenChange(false);
            setNewPath('');
        } catch (err) {
            console.error('Failed to change location:', err);
            setError(err instanceof Error ? err.message : 'Failed to change storage location');
        } finally {
            setIsChanging(false);
        }
    };

    const handleCancel = () => {
        setNewPath('');
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Change Storage Location</DialogTitle>
                    <DialogDescription>
                        Select a new location for your project files. All existing projects will be moved to the new location.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Current Location */}
                    <div>
                        <Label className="text-xs text-slate-500 flex items-center gap-2">
                            <FolderOpen className="w-3 h-3" />
                            Current Location
                        </Label>
                        <p className="text-sm mt-1 font-mono truncate bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {currentPath || 'Not configured'}
                        </p>
                    </div>

                    {/* New Location */}
                    <div>
                        <Label className="text-xs text-slate-500 mb-2 block">
                            New Location
                        </Label>
                        {isDesktop ? (
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={handleSelectFolder}
                                    disabled={isChanging}
                                >
                                    <FolderOpen className="w-4 h-4 mr-2" />
                                    {newPath || 'Select Folder...'}
                                </Button>
                                {newPath && (
                                    <p className="text-xs text-slate-500 font-mono truncate">
                                        {newPath}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <Input
                                placeholder="indexeddb://documents"
                                value={newPath}
                                onChange={(e) => setNewPath(e.target.value)}
                                disabled={isChanging}
                            />
                        )}
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-semibold mb-1">Important</p>
                                <p>This will copy all your projects to the new location. Make sure you have enough disk space available.</p>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={isChanging}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isChanging || (!newPath.trim())}
                    >
                        {isChanging ? 'Moving Files...' : 'Change Location'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
