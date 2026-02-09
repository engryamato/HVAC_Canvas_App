'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, Search } from 'lucide-react';

interface ErrorPageProps {
    title?: string;
    message?: string;
    showSearchButton?: boolean;
}

export function ErrorPage({
    title = 'Page Not Found',
    message = 'The project you are looking for could not be found.',
    showSearchButton = true,
}: ErrorPageProps) {
    const router = useRouter();

    return (
        <div
            className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
            data-testid="error-page"
        >
            <Card className="max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileQuestion className="w-8 h-8 text-slate-400" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {title}
                </h1>

                <p className="text-slate-600 mb-8">
                    {message}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => router.push('/dashboard')}
                        data-testid="goto-dashboard-button"
                        className="gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Go to Dashboard
                    </Button>

                    {showSearchButton && (
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard')}
                            data-testid="search-projects-button"
                            className="gap-2"
                        >
                            <Search className="w-4 h-4" />
                            Search Projects
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}

