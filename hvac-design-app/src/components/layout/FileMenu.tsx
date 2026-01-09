'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSystemService } from '@/services/FileSystemService';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

export function FileMenu() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleOpenFromFile = async () => {
        setIsOpen(false);
        setIsLoading(true);
        try {
            const projectData = await FileSystemService.openProjectFromFile();

            if (projectData) {
                // Import to both stores
                const projectId = await FileSystemService.importProject(projectData);

                // Navigate to canvas
                router.push(`/canvas/${projectId}`);
            }
        } catch (error) {
            console.error('Failed to open file:', error);
            // TODO: Show error dialog to user
            alert('Failed to open project file. Please ensure it is a valid .hvac or .json file.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                role="button"
                onClick={() => setIsOpen(!isOpen)}
            >
                <FileText className="w-4 h-4" />
                File
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[200px] z-50">
                    <button
                        onClick={handleOpenFromFile}
                        disabled={isLoading}
                        role="menuitem"
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Opening...' : 'Open from File...'}
                    </button>
                    {/* Future: Add Save, Export, etc. */}
                </div>
            )}
        </div>
    );
}
