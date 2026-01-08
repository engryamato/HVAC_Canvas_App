'use client';

import React from 'react';
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';

export default function CanvasPage() {
    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Tutorial Overlay */}
            <TutorialOverlay />

            {/* Toolbar */}
            <nav className="h-14 bg-white border-b flex items-center px-4 justify-between" data-testid="toolbar">
                <div className="font-bold">HVAC Canvas</div>
                <div className="flex gap-2">
                    <button title="Help" className="p-2 hover:bg-slate-100 rounded">Help</button>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-64 bg-white border-r p-4" data-testid="equipment-library">
                    <h3 className="font-semibold mb-4">Equipment</h3>
                    <div className="space-y-2">
                        <div className="p-2 border rounded hover:bg-blue-50 cursor-move">Air Handler Unit</div>
                        <div className="p-2 border rounded hover:bg-blue-50 cursor-move">VAV Box</div>
                    </div>
                </aside>

                {/* Canvas Area */}
                <main className="flex-1 bg-slate-100 relative overflow-hidden" data-testid="canvas">
                    <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-10 pointer-events-none">
                        {/* Grid Pattern */}
                    </div>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        Canvas Area
                    </div>

                    {/* Contextual Tooltip Mock */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 p-4 bg-slate-800 text-white text-sm rounded shadow-lg" role="tooltip">
                        Your design workspace. Pan with mouse drag, zoom with wheel.
                    </div>

                    {/* Tips Panel */}
                    <div className="absolute bottom-4 right-4 w-64 bg-white p-4 rounded-lg shadow-lg border" data-testid="tips-panel">
                        <div className="font-semibold border-b pb-2 mb-2">Tips 💡</div>
                        <p className="text-sm text-slate-600">Hold Shift to constrain duct angles to 90°</p>
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="w-64 bg-white border-l p-4" data-testid="properties-panel">
                    <h3 className="font-semibold mb-4">Properties</h3>
                    <div className="text-sm text-slate-500">No selection</div>
                </aside>
            </div>
        </div>
    );
}
