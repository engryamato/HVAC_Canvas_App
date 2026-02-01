'use client';

import React, { ReactNode } from 'react';
import { Header } from './Header';

interface AppShellProps {
    children: ReactNode;
    projectName?: string;
    showBreadcrumb?: boolean;
    rightActions?: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ 
    children, 
    projectName,
    showBreadcrumb = true,
    rightActions
}) => {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
            {/* Header with Menu Bar */}
            <Header 
                projectName={projectName} 
                showBreadcrumb={showBreadcrumb}
                rightActions={rightActions}
            />

            {children}
        </div>
    );
};
