'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface HelpMenuProps {
    onShowShortcuts?: () => void;
}

export function HelpMenu({ onShowShortcuts }: HelpMenuProps) {
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
                Help
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[200px] z-50">
                    <button
                        onClick={() => {
                            onShowShortcuts?.();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Keyboard Shortcuts <span className="text-xs opacity-50">Ctrl+/</span>
                    </button>

                    <div className="h-px bg-slate-200 my-1" />

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                    >
                        Documentation
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                    >
                        Report Issue
                    </button>

                    <div className="h-px bg-slate-200 my-1" />

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                    >
                        About HVAC Canvas
                    </button>
                </div>
            )}
        </div>
    );
}
