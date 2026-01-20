'use client';

import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { StatusBar } from './StatusBar';
import { EquipmentTypeSelector } from '@/components/canvas/EquipmentTypeSelector';
import { FittingTypeSelector } from '@/components/canvas/FittingTypeSelector';
import { useCurrentTool } from '@/core/store/canvas.store';

interface AppShellProps {
    children: ReactNode;
    projectName: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, projectName }) => {
    const currentTool = useCurrentTool();

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
            {/* Header with Menu Bar */}
            <Header projectName={projectName} />

            {/* Toolbar */}
            <Toolbar />

            {/* Conditional Type Selectors */}
            {currentTool === 'equipment' && <EquipmentTypeSelector />}
            {currentTool === 'fitting' && <FittingTypeSelector />}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                <LeftSidebar />

                {/* Canvas Area */}
                <main className="flex-1 relative overflow-hidden bg-slate-100 grid-pattern">
                    {children}
                </main>

                <RightSidebar />
            </div>

            {/* Status Bar */}
            <StatusBar />
        </div>
    );
};
