import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureHighlightCardProps {
    iconSrc: string;
    title: string;
    description: string;
}

export const FeatureHighlightCard: React.FC<FeatureHighlightCardProps> = ({ iconSrc, title, description }) => {
    return (
        <Card className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-blue-100 border-slate-100">
            <CardContent className="flex flex-col items-center p-6">
                <div className="w-16 h-16 mb-4 relative group-hover:scale-110 transition-transform duration-300">
                    <Image
                        src={iconSrc}
                        alt={title}
                        fill
                        className="object-contain"
                    />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 text-center">{title}</h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    );
};
