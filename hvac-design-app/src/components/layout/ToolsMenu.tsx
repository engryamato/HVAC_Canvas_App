'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToolStore, type CanvasTool } from '@/core/store/canvas.store';

export function ToolsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { setTool } = useToolStore();

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

    const selectTool = (tool: CanvasTool) => {
        setTool(tool);
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
                Tools
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[180px] z-50">
                    <button
                        onClick={() => selectTool('select')}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Select Tool <span className="text-xs opacity-50">V</span>
                    </button>
                    <button
                        onClick={() => selectTool('room')}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Room Tool <span className="text-xs opacity-50">R</span>
                    </button>
                    <button
                        onClick={() => selectTool('duct')}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Duct Tool <span className="text-xs opacity-50">D</span>
                    </button>
                    <button
                        onClick={() => selectTool('equipment')}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Equipment Tool <span className="text-xs opacity-50">E</span>
                    </button>
                    <button
                        onClick={() => selectTool('pipe')}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Pipe Tool <span className="text-xs opacity-50">P</span>
                    </button>
                    <button
                        onClick={() => selectTool('note')}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm flex justify-between"
                    >
                        Note Tool <span className="text-xs opacity-50">N</span>
                    </button>
                </div>
            )}
        </div>
    );
}
