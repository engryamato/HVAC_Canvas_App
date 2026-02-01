'use client';

import { useEffect, useRef } from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';

const MOBILE_BREAKPOINT = 1024;

export const useResponsiveLayout = () => {
    // Determine active state via ref to avoid stale closures in event listener
    const stateRef = useRef({
        leftCollapsed: false,
        rightCollapsed: false
    });

    useEffect(() => {
        // Subscribe to store updates to keep ref current
        const unsubscribe = useLayoutStore.subscribe((state) => {
            stateRef.current = {
                leftCollapsed: state.leftSidebarCollapsed,
                rightCollapsed: state.rightSidebarCollapsed
            };
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const { toggleLeftSidebar, toggleRightSidebar } = useLayoutStore.getState();

            // Auto-collapse if width drops below breakpoint and sidebars are open
            if (width < MOBILE_BREAKPOINT) {
                if (!stateRef.current.leftCollapsed) {
                    toggleLeftSidebar();
                    // Optionally notify user via toast (omitted for now)
                }
                if (!stateRef.current.rightCollapsed) {
                    toggleRightSidebar();
                }
            } else {
                // Restore full layout when returning to desktop width.
                if (stateRef.current.leftCollapsed) {
                    toggleLeftSidebar();
                }
                if (stateRef.current.rightCollapsed) {
                    toggleRightSidebar();
                }
            }
        };

        // Check on mount
        handleResize();

        let timeoutId: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleResize, 200);
        };

        window.addEventListener('resize', debouncedResize);
        return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(timeoutId);
        };
    }, []);
};
