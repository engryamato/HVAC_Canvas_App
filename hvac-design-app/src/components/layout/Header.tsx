'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    projectName: string;
}

export const Header: React.FC<HeaderProps> = ({ projectName }) => {
    const router = useRouter();

    return (
        <Card
            className="h-14 bg-white/90 backdrop-blur-sm border-b flex items-center px-4 justify-between rounded-none"
            data-testid="header"
        >
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="gap-1"
                    data-testid="breadcrumb-dashboard"
                >
                    <Home className="w-4 h-4" />
                    Dashboard
                </Button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">{projectName}</span>
            </div>

            {/* Branding */}
            <div className="text-sm font-medium text-slate-600">
                SizeWise HVAC Canvas
            </div>
        </Card>
    );
};
