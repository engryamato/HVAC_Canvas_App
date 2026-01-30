'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home, Settings, FolderOpen } from 'lucide-react';
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
    rightActions?: React.ReactNode;
}

/**
 * Header - Modern Engineering Design 2025
 * Glassmorphism header with refined branding and navigation
 */
export const Header: React.FC<HeaderProps> = ({
    projectName,
    showBreadcrumb = true,
    showMenuBar = true,
    rightActions
}) => {
    const router = useRouter();
    const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                router.push('/dashboard');
                return;
            }
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
            <header
                className="h-12 glass-header flex items-center px-4 justify-between shrink-0 z-40"
                data-testid="header"
            >
                {/* Left: Logo + Menu Bar + Breadcrumb */}
                <div className="flex items-center gap-3">
                    {/* Logo / Branding */}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        data-testid="app-logo"
                        onClick={() => router.push('/dashboard')}
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                            <FolderOpen className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm tracking-tight">
                            HVAC Pro
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-5 w-px bg-slate-200" />

                    {/* Menu Bar */}
                    {showMenuBar && (
                        <nav className="flex items-center gap-0.5" role="menubar">
                            <FileMenu />
                            <EditMenu />
                            <ViewMenu onResetLayout={() => { /* TODO */ }} />
                            <ToolsMenu />
                            <HelpMenu onShowShortcuts={() => setShortcutsOpen(true)} />
                        </nav>
                    )}

                    {/* Breadcrumb */}
                    {showBreadcrumb && (
                        <>
                            <div className="h-5 w-px bg-slate-200 ml-2" />
                            <div className="flex items-center gap-1.5 text-sm" data-testid="breadcrumb">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/dashboard')}
                                    className="gap-1.5 h-7 px-2 text-slate-500 hover:text-slate-900"
                                    data-testid="breadcrumb-dashboard"
                                >
                                    <Home className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Button>
                                {projectName && (
                                    <>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                                            {projectName}
                                        </span>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Settings */}
                <div className="flex items-center gap-2">
                    {rightActions}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSettingsOpen(true)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                        data-testid="settings-button"
                        aria-label="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </header>

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
