'use client';

import React from 'react';
import { Wrench, Droplet } from 'lucide-react';

type Domain = 'hvac' | 'plumbing';

interface DomainSelectorProps {
  activeDomain: Domain;
  onDomainChange: (domain: Domain) => void;
}

export function DomainSelector({ activeDomain, onDomainChange }: DomainSelectorProps) {
  const domains: Array<{ id: Domain; label: string; icon: React.ElementType }> = [
    { id: 'hvac', label: 'HVAC', icon: Wrench },
    { id: 'plumbing', label: 'Plumbing', icon: Droplet },
  ];

  return (
    <div className="flex flex-col gap-2 border-r border-slate-200 bg-slate-50 p-3 w-28">
      {domains.map((domain) => {
        const Icon = domain.icon;
        const isActive = activeDomain === domain.id;

        return (
          <button
            key={domain.id}
            type="button"
            onClick={() => onDomainChange(domain.id)}
            className={`
              flex flex-col items-center gap-2 rounded-lg p-3 text-xs font-medium transition-all
              ${
                isActive
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }
            `}
          >
            <Icon size={20} />
            <span>{domain.label}</span>
          </button>
        );
      })}
    </div>
  );
}
