'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogPanel } from './CatalogPanel';
import { ManagePanel } from './ManagePanel';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';

export function ProjectAssetsPanel() {
  const pendingEditEntryId = useUnifiedCatalogStore((state) => state.pendingEditEntryId);
  const [activeTab, setActiveTab] = useState<'catalog' | 'manage'>('catalog');

  useEffect(() => {
    if (pendingEditEntryId) {
      setActiveTab('manage');
    }
  }, [pendingEditEntryId]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-900">Traycer Catalog</h2>
        <p className="mt-1 text-sm text-slate-500">Browse placeable entries in Catalog or maintain definitions in Manage.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'catalog' | 'manage')} className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
          <TabsTrigger value="catalog" data-testid="tab-catalog">Catalog</TabsTrigger>
          <TabsTrigger value="manage" data-testid="tab-manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="m-0 flex-1 overflow-hidden">
          <CatalogPanel onOpenManage={() => setActiveTab('manage')} />
        </TabsContent>

        <TabsContent value="manage" className="m-0 flex-1 overflow-hidden">
          <ManagePanel
            activeTab={activeTab}
            onOpenCatalog={() => setActiveTab('catalog')}
            onOpenManage={() => setActiveTab('manage')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
