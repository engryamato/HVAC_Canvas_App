import { FolderOpen } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { useStorageStore } from '@/core/store/storageStore';
import { useStorageRoot } from '@/hooks/useStorageRoot';
import { useState } from 'react';
import { ChangeLocationDialog } from './ChangeLocationDialog';

interface StorageSettingsPanelProps {
    onOpenQuarantine: () => void;
}

export function StorageSettingsPanel({ onOpenQuarantine }: StorageSettingsPanelProps) {
    const { storageRootPath } = useStorageRoot();
    const { quarantinedFileCount } = useStorageStore();
    const [showChangeLocationDialog, setShowChangeLocationDialog] = useState(false);

    return (
        <div className="space-y-4">
            {/* Storage Location */}
            <div>
                <Label className="text-xs text-slate-500 flex items-center gap-2">
                    <FolderOpen className="w-3 h-3" />
                    Storage Location
                </Label>
                <p className="text-sm mt-1 font-mono truncate bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {storageRootPath || 'Not configured'}
                </p>
            </div>

            {/* Quarantine Info */}
            {quarantinedFileCount > 0 && (
                <div>
                    <Label className="text-xs text-slate-500">Quarantined Files</Label>
                    <p className="text-sm mt-1">
                        {quarantinedFileCount} corrupted file{quarantinedFileCount !== 1 ? 's' : ''} detected
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowChangeLocationDialog(true)}
                >
                    Change Location
                </Button>
                {quarantinedFileCount > 0 && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={onOpenQuarantine}
                    >
                        View Quarantine ({quarantinedFileCount})
                    </Button>
                )}
            </div>

            {/* Change Location Dialog */}
            <ChangeLocationDialog
                open={showChangeLocationDialog}
                onOpenChange={setShowChangeLocationDialog}
                currentPath={storageRootPath}
            />
        </div>
    );
}
