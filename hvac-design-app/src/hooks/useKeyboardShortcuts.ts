import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayoutStore } from '@/stores/useLayoutStore';

import { useToolStore } from '@/core/store/canvas.store';
import { useViewportStore } from '@/features/canvas/store/viewportStore';

export const useKeyboardShortcuts = () => {
    const router = useRouter();
    const setActiveTool = useToolStore((state) => state.setTool);

    const {
        toggleLeftSidebar,
        toggleRightSidebar,
        setActiveRightTab
    } = useLayoutStore();

    const {
        zoomTo: setZoom,
        toggleGrid
    } = useViewportStore((state) => ({
        zoomTo: state.zoomTo,
        toggleGrid: state.toggleGrid
    }));
    const zoom = useViewportStore((state) => state.zoom);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input/textarea focused
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Global Shortcuts

            // Dashboard: Ctrl+Shift+D (Handled in Header, but good to have backup or centralized)
            if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                router.push('/dashboard');
                return;
            }

            // Help: Ctrl+/ (Handled in KeyboardShortcutsDialog)

            // View Tools
            if (e.ctrlKey) {
                if (e.key === '=' || e.key === '+') { // Zoom In
                    e.preventDefault();
                    setZoom(Math.min(400, zoom + 25));
                    return;
                }
                if (e.key === '-') { // Zoom Out
                    e.preventDefault();
                    setZoom(Math.max(25, zoom - 25));
                    return;
                }
                if (e.key === '0') { // Reset Zoom (not in spec but standard)
                    e.preventDefault();
                    setZoom(100);
                    return;
                }
            }

            // Tool Selection (Single keys)
            // Handled in Toolbar.tsx normally, but centralized is better?
            // Spec says "v, l, d, e, t"
            // Let's leave specific tool logic in Toolbar or centralized?
            // Centralized is better for consistency.
            // But Toolbar already implements it. 
            // We should consolidate. For now, let's let Toolbar handle drawing tools
            // and this hook handle global app/layout shortcuts.

            // Actually, Toolbar is only mounted when AppShell is mounted.
            // So if we put this in AppShell, it works.
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router, setActiveTool, toggleLeftSidebar, toggleRightSidebar, setActiveRightTab, setZoom, zoom, toggleGrid]);
};
