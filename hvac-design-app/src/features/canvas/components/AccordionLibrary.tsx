'use client';

import { useMemo } from 'react';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useToolActions } from '@/core/store/canvas.store';
import type { FittingType } from '@/core/schema/fitting.schema';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface AccordionLibraryProps {
  searchQuery: string;
}

export function AccordionLibrary({ searchQuery }: AccordionLibraryProps) {
  const components = useComponentLibraryStoreV2((state) => state.components);
  const categories = useComponentLibraryStoreV2((state) => state.categories);
  const activeComponentId = useComponentLibraryStoreV2((state) => state.activeComponentId);
  const activateComponent = useComponentLibraryStoreV2((state) => state.activateComponent);

  const { setTool, setFittingType } = useToolActions();

  // Filter components based on search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) {
      return components;
    }
    
    const query = searchQuery.toLowerCase();
    return components.filter((comp) =>
      comp.name.toLowerCase().includes(query) ||
      comp.category.toLowerCase().includes(query) ||
      comp.manufacturer?.toLowerCase().includes(query)
    );
  }, [components, searchQuery]);

  const filteredIds = useMemo(
    () => new Set(filteredComponents.map((item) => item.id)),
    [filteredComponents]
  );

  const activateFromComponent = (component: UnifiedComponentDefinition) => {
    activateComponent(component.id);

    switch (component.category) {
      case 'duct':
        setTool('duct');
        break;
      case 'fitting':
        setFittingType((component.subtype ?? 'elbow_90') as FittingType);
        setTool('fitting');
        break;
      case 'equipment':
        setTool('equipment');
        break;
      default:
        setTool('select');
    }
  };

  // Get root categories (those without a parent)
  const rootCategories = useMemo(() => {
    return categories.filter((cat) => !cat.parentId);
  }, [categories]);

  // Render category and its items
  const renderCategory = (category: typeof categories[number]) => {
    const categoryItems = filteredComponents.filter(
      (item) => item.category === category.id && filteredIds.has(item.id)
    );

    if (categoryItems.length === 0) {
      return null;
    }

    return (
      <AccordionItem key={category.id} value={category.id} className="border-b-0">
        <AccordionTrigger className="hover:no-underline py-3 px-2 hover:bg-slate-50 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{category.name}</span>
            <Badge variant="secondary" className="h-5 text-xs">
              {categoryItems.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-2 pt-1">
          <div className="space-y-1">
            {categoryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => activateFromComponent(item)}
                className={`
                  w-full rounded-md px-3 py-2 text-left text-sm transition-all
                  ${
                    activeComponentId === item.id
                      ? 'bg-blue-100 text-blue-800 font-medium shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.manufacturer && (
                    <span className="text-xs text-slate-400">{item.manufacturer}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  if (filteredComponents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        <div className="text-center">
          <p className="font-medium">No components found</p>
          <p className="mt-1 text-xs">Try a different search term</p>
        </div>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {rootCategories.map(renderCategory)}
    </Accordion>
  );
}
