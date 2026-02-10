'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useShallow } from 'zustand/react/shallow';
import { QuarantineManagerDialog } from './QuarantineManagerDialog';
import { StorageSettingsPanel } from './StorageSettings/StorageSettingsPanel';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const theme = usePreferencesStore((state) => state.theme);
    const compactMode = usePreferencesStore((state) => state.compactMode);
    const snapToGrid = usePreferencesStore((state) => state.snapToGrid);
    const showRulers = usePreferencesStore((state) => state.showRulers);
    const autoSaveEnabled = usePreferencesStore((state) => state.autoSaveEnabled);
    const {
        setTheme,
        setCompactMode,
        setSnapToGrid,
        setShowRulers,
        setAutoSaveEnabled,
    } = usePreferencesStore(
        useShallow((state) => ({
            setTheme: state.setTheme,
            setCompactMode: state.setCompactMode,
            setSnapToGrid: state.setSnapToGrid,
            setShowRulers: state.setShowRulers,
            setAutoSaveEnabled: state.setAutoSaveEnabled,
        }))
    );

    const [showQuarantine, setShowQuarantine] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md"
                data-testid="settings-dialog"
            >
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Appearance */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Appearance</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="dark-mode">Dark Mode</Label>
                                <Switch
                                    id="dark-mode"
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="compact-mode">Compact Mode</Label>
                                <Switch
                                    id="compact-mode"
                                    checked={compactMode}
                                    onCheckedChange={setCompactMode}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Canvas</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="snap-grid">Snap to Grid</Label>
                                <Switch
                                    id="snap-grid"
                                    checked={snapToGrid}
                                    onCheckedChange={setSnapToGrid}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show-rulers">Show Rulers</Label>
                                <Switch
                                    id="show-rulers"
                                    checked={showRulers}
                                    onCheckedChange={setShowRulers}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Auto-save */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Auto-save</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto-save">Enable Auto-save</Label>
                                <Switch
                                    id="auto-save"
                                    checked={autoSaveEnabled}
                                    onCheckedChange={setAutoSaveEnabled}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Storage */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Storage</h3>
                        <StorageSettingsPanel onOpenQuarantine={() => setShowQuarantine(true)} />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t text-xs text-slate-500">
                    Settings are automatically saved.
                </div>
            </DialogContent>
            <QuarantineManagerDialog 
                open={showQuarantine} 
                onOpenChange={setShowQuarantine}
            />
        </Dialog>
    );
}

