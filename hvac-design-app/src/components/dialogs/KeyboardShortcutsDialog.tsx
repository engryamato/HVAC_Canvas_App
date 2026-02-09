'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const shortcuts = [
    {
        category: 'Navigation', items: [
            { keys: 'Ctrl+Shift+D', description: 'Go to Dashboard' },
            { keys: 'Alt+1', description: 'Focus Left Sidebar' },
            { keys: 'Alt+2', description: 'Focus Canvas' },
            { keys: 'Alt+3', description: 'Focus Right Sidebar' },
            { keys: 'Alt+4', description: 'Focus Toolbar' },
        ]
    },
    {
        category: 'Panels', items: [
            { keys: 'Ctrl+B', description: 'Toggle Left Sidebar' },
            { keys: 'Ctrl+Shift+B', description: 'Toggle Right Sidebar' },
            { keys: 'Ctrl+P', description: 'Properties Panel' },
            { keys: 'Ctrl+M', description: 'BOM Panel' },
        ]
    },
    {
        category: 'Tools', items: [
            { keys: 'V', description: 'Select Tool' },
            { keys: 'L', description: 'Line Tool' },
            { keys: 'D', description: 'Duct Tool' },
            { keys: 'E', description: 'Equipment Tool' },
            { keys: 'F', description: 'Fitting Tool' },
            { keys: 'N', description: 'Note Tool' },
        ]
    },
    {
        category: 'Edit', items: [
            { keys: 'Ctrl+Z', description: 'Undo' },
            { keys: 'Ctrl+Shift+Z', description: 'Redo' },
            { keys: 'Ctrl+C', description: 'Copy' },
            { keys: 'Ctrl+V', description: 'Paste' },
            { keys: 'Delete', description: 'Delete Selected' },
        ]
    },
    {
        category: 'View', items: [
            { keys: 'Ctrl+G', description: 'Toggle Grid' },
            { keys: 'Ctrl++', description: 'Zoom In' },
            { keys: 'Ctrl+-', description: 'Zoom Out' },
            { keys: 'Ctrl+0', description: 'Zoom to 100%' },
        ]
    },
    {
        category: 'General', items: [
            { keys: 'Ctrl+/', description: 'Show Keyboard Shortcuts' },
            { keys: 'Escape', description: 'Close Dialog / Cancel' },
        ]
    },
];

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl max-h-[80vh] overflow-y-auto"
                data-testid="keyboard-shortcuts-dialog"
            >
                <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 mt-4">
                    {shortcuts.map((group) => (
                        <div key={group.category}>
                            <h3 className="font-semibold text-sm text-slate-900 mb-2">
                                {group.category}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <div
                                        key={item.keys}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-slate-600">{item.description}</span>
                                        <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                                            {item.keys}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-slate-500 text-center">
                    Press <kbd className="px-1 py-0.5 bg-slate-100 rounded font-mono">Esc</kbd> to close
                </div>
            </DialogContent>
        </Dialog>
    );
}

