'use client';

import { useLayoutStore } from '@/stores/useLayoutStore';
import { ProjectAssetsPanel } from '../ProjectAssetsPanel';
import { X } from 'lucide-react';

interface DockDrawerProps {
  className?: string;
}

export function DockDrawer({ className = '' }: DockDrawerProps) {
  const activeDockPanel = useLayoutStore((state) => state.activeDockPanel);
  const closeDockPanel = useLayoutStore((state) => state.closeDockPanel);

  if (activeDockPanel === 'none') {
    return null;
  }

  return (
    <div 
      className={`
        flex flex-col w-[400px] bg-white border-r border-slate-200 h-full relative z-20 shadow-xl
        animate-in slide-in-from-left duration-200
        ${className}
      `}
    >
        {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="font-semibold text-slate-800">
          Assets
        </h2>
        <button 
          onClick={closeDockPanel}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ProjectAssetsPanel />
      </div>
    </div>
  );
}
