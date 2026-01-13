'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FileMenu } from './FileMenu';
import { EditMenu } from './EditMenu';
import { ViewMenu } from './ViewMenu';
import { ToolsMenu } from './ToolsMenu';
import { HelpMenu } from './HelpMenu';
import { KeyboardShortcutsDialog } from '@/components/dialogs/KeyboardShortcutsDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';

interface HeaderProps {
    projectName?: string;
    showBreadcrumb?: boolean;
    showMenuBar?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    projectName,
    showBreadcrumb = true,
    showMenuBar = true
}) => {
    const router = useRouter();
    const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Shift+D: Go to Dashboard
            if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                router.push('/dashboard');
                return;
            }

            // Ctrl+/: Show keyboard shortcuts
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setShortcutsOpen(true);
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <>
            <Card
                className="h-[50px] bg-white/95 backdrop-blur-sm border-b flex items-center px-4 justify-between rounded-none shrink-0"
                data-testid="header"
            >
                {/* Left: Logo + Menu Bar + Breadcrumb */}
                <div className="flex items-center gap-2">
                    {/* Logo / Branding */}
                    <div
                        className="font-bold text-blue-600 mr-2 cursor-pointer"
                        data-testid="app-logo"
                        onClick={() => router.push('/dashboard')}
                    >
                        HVAC Canvas
                    </div>

                    {/* Menu Bar */}
                    {showMenuBar && (
                        <div className="flex items-center gap-0.5">
                            <FileMenu />
                            <EditMenu />
                            <ViewMenu onResetLayout={() => { /* TODO */ }} />
                            <ToolsMenu />
                            <HelpMenu onShowShortcuts={() => setShortcutsOpen(true)} />
                        </div>
                    )}

                    {/* Breadcrumb */}
                    {showBreadcrumb && projectName && (
                        <div className="flex items-center gap-2 text-sm ml-4" data-testid="breadcrumb">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="gap-1 h-7"
                                data-testid="breadcrumb-dashboard"
                            >
                                <Home className="w-3.5 h-3.5" />
                                Dashboard
                            </Button>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-700 truncate max-w-[200px]">
                                {projectName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Settings */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSettingsOpen(true)}
                        data-testid="settings-button"
                        aria-label="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </Card>

            {/* Dialogs */}
            <KeyboardShortcutsDialog
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
            />
            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </>
    );
};
