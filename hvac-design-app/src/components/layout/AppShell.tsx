'use client';

import React, { ReactNode } from 'react';
import { Header } from './Header';

interface AppShellProps {
    children: ReactNode;
    projectName: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, projectName }) => {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
            {/* Header with Menu Bar */}
            <Header projectName={projectName} />

            {children}
        </div>
    );
};
