'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabbedPropertiesPanelProps {
  tabs: Tab[];
  defaultTab?: string;
  entityType: string;
}

export function TabbedPropertiesPanel({ 
  tabs, 
  defaultTab,
  entityType 
}: TabbedPropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div className="tabbed-properties-panel" data-entity-type={entityType}>
      <div className="tab-header flex border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'tab-button px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            )}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content p-4">
        {activeTabData?.content}
      </div>
    </div>
  );
}

export default TabbedPropertiesPanel;
