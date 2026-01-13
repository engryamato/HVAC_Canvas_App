'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function EditMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8 px-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                Edit
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[180px] z-50">
                    <button
                        onClick={() => { document.execCommand('undo'); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                        data-testid="menu-undo"
                    >
                        Undo <span className="text-xs opacity-50">Ctrl+Z</span>
                    </button>
                    <button
                        onClick={() => { document.execCommand('redo'); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                        data-testid="menu-redo"
                    >
                        Redo <span className="text-xs opacity-50">Ctrl+Shift+Z</span>
                    </button>

                    <div className="h-px bg-slate-200 my-1" />

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Cut <span className="text-xs opacity-50">Ctrl+X</span>
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Copy <span className="text-xs opacity-50">Ctrl+C</span>
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Paste <span className="text-xs opacity-50">Ctrl+V</span>
                    </button>

                    <div className="h-px bg-slate-200 my-1" />

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Select All <span className="text-xs opacity-50">Ctrl+A</span>
                    </button>
                </div>
            )}
        </div>
    );
}
