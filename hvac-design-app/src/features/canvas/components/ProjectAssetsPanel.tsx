'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DomainSelector } from './DomainSelector';
import { AccordionLibrary } from './AccordionLibrary';
import { ServiceList } from './ServiceList';

type Domain = 'hvac' | 'plumbing';

export function ProjectAssetsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState<Domain>('hvac');

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header with unified search */}
      <div className="border-b border-slate-200 p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-800">Project Assets</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search components or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs for Library | Services */}
      <Tabs defaultValue="library" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="flex-1 overflow-hidden m-0 p-0">
          <div className="flex h-full">
            {/* Domain Selector (Vertical Stack) */}
            <DomainSelector activeDomain={activeDomain} onDomainChange={setActiveDomain} />

            {/* Accordion Library */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeDomain === 'hvac' ? (
                <AccordionLibrary searchQuery={searchQuery} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  <div className="text-center">
                    <p className="font-medium">Plumbing Library</p>
                    <p className="mt-1 text-xs">Coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="flex-1 overflow-y-auto m-0 p-4">
          <ServiceList searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
