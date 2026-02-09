'use client';

import { useEffect, useRef } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { isTauri } from '@/utils/platform';

export const DeviceWarning = () => {
    const { isMobile } = useDeviceDetection();
    const exitButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (isMobile) {
            exitButtonRef.current?.focus();
        }
    }, [isMobile]);

    if (!isMobile) {
        return null;
    }

    const handleExit = async () => {
        // Try Tauri API first (for desktop app)
        if (isTauri) {
            // TODO: Fix Tauri v2 import for process exit
            console.warn('Tauri exit not implemented yet for v2');
        }

        // Fallback: try window.close() (may be blocked by browser)
        window.close();

        // If still here, show message (browsers often block window.close())
        // User will need to close manually
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-sm"
            role="alertdialog"
            aria-live="assertive"
            aria-label="Device Incompatible"
            data-testid="device-warning"
            onKeyDown={(event) => {
                if (event.key === 'Tab') {
                    event.preventDefault();
                    exitButtonRef.current?.focus();
                }
            }}
        >
            <div className="max-w-md p-8 space-y-6 text-center border rounded-lg shadow-lg bg-card text-card-foreground animate-in fade-in zoom-in duration-300">
                <div className="text-4xl" aria-hidden="true">⚠️</div>

                <h2 className="text-2xl font-bold tracking-tight">Device Incompatible</h2>

                <p className="text-muted-foreground">
                    This application requires a larger screen resolution to function.
                    Please use a Tablet, Laptop, or Desktop.
                </p>

                <div className="pt-4">
                    <button
                        ref={exitButtonRef}
                        onClick={handleExit}
                        className="px-6 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="Exit Application"
                        data-testid="exit-application"
                    >
                        Exit Application
                    </button>
                </div>
            </div>
        </div>
    );
};

