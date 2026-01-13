'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useViewportStore } from '@/stores/useViewportStore';

interface ViewMenuProps {
    onResetLayout?: () => void;
}

export function ViewMenu({ onResetLayout }: ViewMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { resetLayout } = useLayoutStore();
    const { toggleGrid, gridVisible, setZoom, fitToScreen } = useViewportStore();

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

    const handleResetLayout = () => {
        resetLayout();
        onResetLayout?.();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8 px-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                View
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[200px] z-50">
                    <button
                        onClick={() => { setZoom(100); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Zoom to 100% <span className="text-xs opacity-50">Ctrl+0</span>
                    </button>
                    <button
                        onClick={() => { fitToScreen(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Fit to Screen <span className="text-xs opacity-50">Ctrl+1</span>
                    </button>

                    <div className="h-px bg-slate-200 my-1" />

                    <button
                        onClick={() => { toggleGrid(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        {gridVisible ? '✓ ' : ''}Toggle Grid <span className="text-xs opacity-50">Ctrl+G</span>
                    </button>

                    <div className="h-px bg-slate-200 my-1" />

                    <button
                        onClick={handleResetLayout}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                        data-testid="menu-reset-layout"
                    >
                        Reset Layout
                    </button>
                </div>
            )}
        </div>
    );
}
