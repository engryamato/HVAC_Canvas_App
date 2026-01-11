'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutGroup {
    category: string;
    shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        category: "General",
        shortcuts: [
            { keys: ["Ctrl", "/"], description: "Show keyboard shortcuts" },
            { keys: ["Ctrl", "Shift", "D"], description: "Go to Dashboard" },
            { keys: ["Ctrl", "S"], description: "Save project" },
            { keys: ["Ctrl", "O"], description: "Open project" },
        ]
    },
    {
        category: "Tools",
        shortcuts: [
            { keys: ["V", "Esc"], description: "Select tool" },
            { keys: ["L"], description: "Line tool" },
            { keys: ["D"], description: "Duct tool" },
            { keys: ["E"], description: "Equipment tool" },
            { keys: ["T"], description: "Text tool" },
        ]
    },
    {
        category: "View",
        shortcuts: [
            { keys: ["Ctrl", "+"], description: "Zoom in" },
            { keys: ["Ctrl", "-"], description: "Zoom out" },
            { keys: ["Ctrl", "G"], description: "Toggle grid" },
            { keys: ["Space + Drag"], description: "Pan canvas" },
        ]
    },
    {
        category: "Panels",
        shortcuts: [
            { keys: ["Ctrl", "B"], description: "Toggle Left Sidebar" },
            { keys: ["Ctrl", "Shift", "B"], description: "Toggle Right Sidebar" },
            { keys: ["Ctrl", "P"], description: "Properties Panel" },
            { keys: ["Ctrl", "Shift", "P"], description: "Calculations Panel" },
            { keys: ["Ctrl", "M"], description: "BOM Panel" },
            { keys: ["Ctrl", "Shift", "N"], description: "Notes Panel" },
        ]
    },
    {
        category: "Editing",
        shortcuts: [
            { keys: ["Ctrl", "Z"], description: "Undo" },
            { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
            { keys: ["Delete"], description: "Delete selected" },
            { keys: ["Ctrl", "C"], description: "Copy" },
            { keys: ["Ctrl", "V"], description: "Paste" },
        ]
    }
];

export const KeyboardShortcutsDialog: React.FC = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                    <DialogDescription>
                        A comprehensive list of keyboard shortcuts for HVAC Canvas.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                        {SHORTCUT_GROUPS.map((group) => (
                            <div key={group.category} className="space-y-3">
                                <h3 className="font-semibold text-sm text-slate-900 pb-1 border-b">
                                    {group.category}
                                </h3>
                                <div className="space-y-2">
                                    {group.shortcuts.map((shortcut, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">{shortcut.description}</span>
                                            <div className="flex items-center gap-1">
                                                {shortcut.keys.map((key, kIdx) => (
                                                    <kbd
                                                        key={kIdx}
                                                        className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex"
                                                    >
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-xs text-slate-500 pt-4 border-t mt-2">
                    Tip: You can customize these shortcuts in Settings (Coming Soon).
                </div>
            </DialogContent>
        </Dialog>
    );
};
