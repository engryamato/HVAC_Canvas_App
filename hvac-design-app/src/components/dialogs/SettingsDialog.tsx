'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
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
                                <Switch id="dark-mode" disabled />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="compact-mode">Compact Mode</Label>
                                <Switch id="compact-mode" disabled />
                            </div>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Canvas</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="snap-grid">Snap to Grid</Label>
                                <Switch id="snap-grid" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show-rulers">Show Rulers</Label>
                                <Switch id="show-rulers" />
                            </div>
                        </div>
                    </div>

                    {/* Auto-save */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Auto-save</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto-save">Enable Auto-save</Label>
                                <Switch id="auto-save" defaultChecked />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t text-xs text-slate-500">
                    Settings are automatically saved.
                </div>
            </DialogContent>
        </Dialog>
    );
}
