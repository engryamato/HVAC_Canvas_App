import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

export function useDeviceDetection() {
    // Initialize to false for SSR, will update client-side
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Only run on client-side
        if (typeof window === 'undefined') {
            return;
        }

        const checkDevice = () => {
            // Metric: < 640px is typically a phone
            const width = window.innerWidth;
            const isMobileWidth = width < 640;

            logger.debug(`[DeviceDetection] Window width: ${width}px, isMobile: ${isMobileWidth}`);
            setIsMobile(isMobileWidth);
        };

        // Initial check
        checkDevice();

        // Listener
        window.addEventListener('resize', checkDevice);

        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return { isMobile };
}
